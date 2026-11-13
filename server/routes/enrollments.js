import { Router } from 'express';
import { withTransaction } from '../db.js';
import { AppError } from '../errors.js';
import { Checker, checkSectionKey, checkSid, STATUSES } from '../validate.js';

const router = Router();

async function lockSection(conn, k) {
  const [rows] = await conn.execute(
    `SELECT cno, capacity FROM section
     WHERE cno = ? AND semester = ? AND year = ? AND sec_no = ? FOR UPDATE`,
    [k.cno, k.semester, k.year, k.sec_no]);
  if (!rows.length) {
    throw new AppError(404, `Section ${k.cno}-${k.sec_no} (${k.semester} ${k.year}) does not exist.`, { section: 'Pick an existing section.' });
  }
  return rows[0];
}

async function enrolledCount(conn, k) {
  const [[row]] = await conn.execute(
    `SELECT COUNT(*) AS n FROM enrollment
     WHERE cno = ? AND semester = ? AND year = ? AND sec_no = ? AND status = 'Enrolled'`,
    [k.cno, k.semester, k.year, k.sec_no]);
  return row.n;
}

router.post('/', async (req, res) => {
  const sid = checkSid(req.body?.sid);
  const k = checkSectionKey(req.body ?? {});
  const today = new Date().toISOString().slice(0, 10);

  const result = await withTransaction(async (conn) => {
    const [stu] = await conn.execute('SELECT fname, lname FROM student WHERE sid = ?', [sid]);
    if (!stu.length) throw new AppError(404, `No student found with ID ${sid}.`, { sid: 'Unknown student.' });
    const section = await lockSection(conn, k);

    const [already] = await conn.execute(
      `SELECT e.sec_no, e.status FROM enrollment e
       WHERE e.sid = ? AND e.cno = ? AND e.semester = ? AND e.year = ? AND e.status <> 'Dropped'`,
      [sid, k.cno, k.semester, k.year]);
    if (already.length) {
      throw new AppError(409, `${stu[0].fname} ${stu[0].lname} is already ${already[0].status.toLowerCase()} in ${k.cno} section ${already[0].sec_no} for ${k.semester} ${k.year}.`);
    }

    const [missing] = await conn.execute(
      `SELECT p.prereq_cno
       FROM prerequisite p
       WHERE p.cno = ?
         AND NOT EXISTS (
           SELECT 1 FROM enrollment e JOIN grade_scale g ON g.grade = e.grade
           WHERE e.sid = ? AND e.cno = p.prereq_cno AND g.is_passing = TRUE)`,
      [k.cno, sid]);
    if (missing.length) {
      throw new AppError(400, `${stu[0].fname} has not passed the prerequisite${missing.length > 1 ? 's' : ''} for ${k.cno}: ${missing.map((m) => m.prereq_cno).join(', ')}.`);
    }

    const count = await enrolledCount(conn, k);
    const status = count < section.capacity ? 'Enrolled' : 'Waitlisted';

    const [prev] = await conn.execute(
      `SELECT status FROM enrollment WHERE sid = ? AND cno = ? AND semester = ? AND year = ? AND sec_no = ?`,
      [sid, k.cno, k.semester, k.year, k.sec_no]);
    if (prev.length) {
      await conn.execute(
        `UPDATE enrollment SET status = ?, reg_date = ?, grade = NULL
         WHERE sid = ? AND cno = ? AND semester = ? AND year = ? AND sec_no = ?`,
        [status, today, sid, k.cno, k.semester, k.year, k.sec_no]);
    } else {
      await conn.execute(
        `INSERT INTO enrollment (sid, cno, semester, year, sec_no, reg_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sid, k.cno, k.semester, k.year, k.sec_no, today, status]);
    }
    return { status, name: `${stu[0].fname} ${stu[0].lname}` };
  });

  const where = `${k.cno}-${k.sec_no} (${k.semester} ${k.year})`;
  res.status(201).json({
    status: result.status,
    message: result.status === 'Enrolled'
      ? `${result.name} is now enrolled in ${where}.`
      : `${where} is full, so ${result.name} was added to the waitlist.`
  });
});

router.put('/:sid/:cno/:semester/:year/:sec_no', async (req, res) => {
  const sid = checkSid(req.params.sid);
  const k = checkSectionKey(req.params);
  const v = new Checker(req.body)
    .oneOf('status', 'Status', STATUSES)
    .text('grade', 'Grade', { max: 2, optional: true })
    .done();

  const message = await withTransaction(async (conn) => {
    const section = await lockSection(conn, k);
    const [rows] = await conn.execute(
      `SELECT status FROM enrollment WHERE sid = ? AND cno = ? AND semester = ? AND year = ? AND sec_no = ?`,
      [sid, k.cno, k.semester, k.year, k.sec_no]);
    if (!rows.length) throw new AppError(404, `Student ${sid} is not registered in ${k.cno}-${k.sec_no} (${k.semester} ${k.year}).`);

    if (v.grade) {
      const [g] = await conn.execute('SELECT grade FROM grade_scale WHERE grade = ?', [v.grade]);
      if (!g.length) throw new AppError(400, `"${v.grade}" is not a valid grade.`, { grade: 'Pick a grade from the list.' });
      if (v.status !== 'Enrolled') throw new AppError(400, 'Only enrolled students can receive a grade.', { grade: 'Clear the grade or set the status to Enrolled.' });
    }
    if (v.status === 'Enrolled' && rows[0].status !== 'Enrolled') {
      const count = await enrolledCount(conn, k);
      if (count >= section.capacity) {
        throw new AppError(409, `The section is full (${count}/${section.capacity}). Someone has to drop before this student can be enrolled.`, { status: 'No seats left.' });
      }
    }
    const [result] = await conn.execute(
      `UPDATE enrollment SET status = ?, grade = ?
       WHERE sid = ? AND cno = ? AND semester = ? AND year = ? AND sec_no = ?`,
      [v.status, v.grade, sid, k.cno, k.semester, k.year, k.sec_no]);
    if (result.affectedRows !== 1) throw new AppError(500, 'The update did not match exactly one registration.');
    return `Saved: student ${sid} in ${k.cno}-${k.sec_no} is ${v.status}${v.grade ? ` with grade ${v.grade}` : ''}.`;
  });
  res.json({ message });
});

export default router;
