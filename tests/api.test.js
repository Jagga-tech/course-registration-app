import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../server/db.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const NEW_SID = 299900001;

async function call(path, method = 'GET', body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json() };
}

const newStudent = {
  sid: String(NEW_SID), fname: 'Test', minit: 'Q', lname: 'Student', email: 'test.student@students.univ.edu',
  bdate: '2004-05-06', class_level: 'Junior', major_dcode: 'CS', phones: ['510-555-9999']
};

test.before(async () => {
  await pool.execute('DELETE FROM enrollment WHERE sid = ?', [NEW_SID]);
  await pool.execute('DELETE FROM student_phone WHERE sid = ?', [NEW_SID]);
  await pool.execute('DELETE FROM student WHERE sid = ?', [NEW_SID]);
});
test.after(() => pool.end());

test('search filters students by name and class level', async () => {
  const r = await call('/students?q=Nguyen&level=Sophomore');
  assert.equal(r.status, 200);
  assert.ok(r.body.length >= 1);
  assert.ok(r.body.every((s) => s.class_level === 'Sophomore' && `${s.fname} ${s.lname}`.includes('Nguyen')));
});

test('insert rejects missing required fields', async () => {
  const r = await call('/students', 'POST', { sid: '' });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.sid && r.body.fields.fname && r.body.fields.email && r.body.fields.class_level);
});

test('insert rejects invalid values', async () => {
  const r = await call('/students', 'POST', { ...newStudent, email: 'not-an-email', sid: '12', bdate: '2004-02-31' });
  assert.equal(r.status, 400);
  assert.match(r.body.fields.email, /valid email/);
  assert.match(r.body.fields.sid, /between/);
  assert.match(r.body.fields.bdate, /real calendar date/);
});

test('insert rejects a major that is not a department (foreign key)', async () => {
  const r = await call('/students', 'POST', { ...newStudent, major_dcode: 'XYZ' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /not a department/);
});

test('insert adds a student and the row is saved in MySQL', async () => {
  const r = await call('/students', 'POST', newStudent);
  assert.equal(r.status, 201);
  const [rows] = await pool.execute('SELECT fname, email FROM student WHERE sid = ?', [NEW_SID]);
  assert.equal(rows[0].email, newStudent.email);
});

test('insert rejects a duplicate student ID', async () => {
  const r = await call('/students', 'POST', { ...newStudent, email: 'other@students.univ.edu' });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /already exists/);
});

test('insert rejects a duplicate email', async () => {
  const r = await call('/students', 'POST', { ...newStudent, sid: '299900002' });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /email/);
});

test('update changes only the chosen student', async () => {
  const before = await pool.execute('SELECT COUNT(*) AS n FROM student WHERE class_level = ?', ['Senior']);
  const r = await call(`/students/${NEW_SID}`, 'PUT', { ...newStudent, class_level: 'Senior', phones: ['510-555-9999', '925-555-1111'] });
  assert.equal(r.status, 200);
  const one = await call(`/students/${NEW_SID}`);
  assert.equal(one.body.class_level, 'Senior');
  assert.deepEqual(one.body.phones, ['510-555-9999', '925-555-1111']);
  const after = await pool.execute('SELECT COUNT(*) AS n FROM student WHERE class_level = ?', ['Senior']);
  assert.equal(after[0][0].n, before[0][0].n + 1);
});

test('update of a missing student returns 404', async () => {
  const r = await call('/students/111111111', 'PUT', { ...newStudent, email: 'x@y.edu' });
  assert.equal(r.status, 404);
});

test('enrollment blocks a course whose prerequisites are not passed', async () => {
  const r = await call('/enrollments', 'POST', { sid: NEW_SID, cno: 'CS4660', semester: 'Spring', year: 2027, sec_no: '01' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /prerequisite/);
});

test('enrollment rejects a section that does not exist', async () => {
  const r = await call('/enrollments', 'POST', { sid: NEW_SID, cno: 'CS1160', semester: 'Fall', year: 2026, sec_no: '09' });
  assert.equal(r.status, 404);
});

test('enrollment inserts a registration and the roster shows it', async () => {
  const r = await call('/enrollments', 'POST', { sid: NEW_SID, cno: 'CS1160', semester: 'Fall', year: 2026, sec_no: '01' });
  assert.equal(r.status, 201);
  assert.equal(r.body.status, 'Enrolled');
  const roster = await call('/sections/CS1160/Fall/2026/01/roster');
  assert.ok(roster.body.students.some((s) => s.sid === NEW_SID && s.status === 'Enrolled'));
});

test('enrollment rejects registering twice for the same course and term', async () => {
  const r = await call('/enrollments', 'POST', { sid: NEW_SID, cno: 'CS1160', semester: 'Fall', year: 2026, sec_no: '02' });
  assert.equal(r.status, 409);
});

test('grade update rejects an invalid grade', async () => {
  const r = await call(`/enrollments/${NEW_SID}/CS1160/Fall/2026/01`, 'PUT', { status: 'Enrolled', grade: 'Z' });
  assert.equal(r.status, 400);
});

test('grade update saves a valid grade for that one registration', async () => {
  const r = await call(`/enrollments/${NEW_SID}/CS1160/Fall/2026/01`, 'PUT', { status: 'Enrolled', grade: 'A-' });
  assert.equal(r.status, 200);
  const [rows] = await pool.execute('SELECT grade FROM enrollment WHERE sid = ? AND cno = ?', [NEW_SID, 'CS1160']);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].grade, 'A-');
});

test('a full section puts new students on the waitlist and blocks promotion', async () => {
  const [waiting] = await pool.execute(
    `SELECT sid FROM enrollment WHERE cno = 'CS4660' AND semester = 'Fall' AND year = 2026 AND status = 'Waitlisted' LIMIT 1`);
  const r = await call(`/enrollments/${waiting[0].sid}/CS4660/Fall/2026/01`, 'PUT', { status: 'Enrolled', grade: '' });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /full/);
});

test('summary reports return grouped rows', async () => {
  for (const path of ['/reports/enrollment-by-department', '/reports/instructor-load', '/reports/grades-by-course?semester=Fall&year=2025']) {
    const r = await call(path);
    assert.equal(r.status, 200, path);
    assert.ok(r.body.length > 0, path);
  }
});

test('bad filter values are rejected with a clear message', async () => {
  const r = await call('/sections?semester=Winter');
  assert.equal(r.status, 400);
  assert.match(r.body.fields.semester, /Spring, Summer, Fall/);
});
