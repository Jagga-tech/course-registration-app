import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { AppError } from '../errors.js';
import { checkStudent, checkSid, Checker, CLASS_LEVELS } from '../validate.js';

const router = Router();

const STUDENT_SELECT = `
  SELECT s.sid, s.fname, s.minit, s.lname, s.email, s.bdate, s.class_level, s.major_dcode,
         d.dname AS major_name,
         GROUP_CONCAT(p.phone ORDER BY p.phone SEPARATOR ', ') AS phones
  FROM student s
  LEFT JOIN department d ON d.dcode = s.major_dcode
  LEFT JOIN student_phone p ON p.sid = s.sid`;

router.get('/', async (req, res) => {
  const f = new Checker(req.query)
    .text('q', 'Search text', { max: 60, optional: true })
    .text('major', 'Major', { max: 6, optional: true })
    .oneOf('level', 'Class level', CLASS_LEVELS, { optional: true })
    .done();

  const where = [];
  const params = [];
  if (f.q) {
    where.push(`(CONCAT(s.fname, ' ', s.lname) LIKE ? OR s.email LIKE ? OR CAST(s.sid AS CHAR) LIKE ?)`);
    const like = `%${f.q}%`;
    params.push(like, like, `${f.q}%`);
  }
  if (f.major === 'NONE') {
    where.push('s.major_dcode IS NULL');
  } else if (f.major) {
    where.push('s.major_dcode = ?');
    params.push(f.major);
  }
  if (f.level) {
    where.push('s.class_level = ?');
    params.push(f.level);
  }
  const sql = `${STUDENT_SELECT}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY s.sid, s.fname, s.minit, s.lname, s.email, s.bdate, s.class_level, s.major_dcode, d.dname
    ORDER BY s.lname, s.fname
    LIMIT 200`;
  res.json(await query(sql, params));
});

router.get('/:sid', async (req, res) => {
  const sid = checkSid(req.params.sid);
  const rows = await query(`${STUDENT_SELECT} WHERE s.sid = ?
    GROUP BY s.sid, s.fname, s.minit, s.lname, s.email, s.bdate, s.class_level, s.major_dcode, d.dname`, [sid]);
  if (!rows.length) throw new AppError(404, `No student found with ID ${sid}.`);
  const student = rows[0];
  student.phones = student.phones ? student.phones.split(', ') : [];
  res.json(student);
});

router.post('/', async (req, res) => {
  const s = checkStudent(req.body, { isNew: true });
  await withTransaction(async (conn) => {
    await conn.execute(
      `INSERT INTO student (sid, fname, minit, lname, email, bdate, class_level, major_dcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.sid, s.fname, s.minit, s.lname, s.email, s.bdate, s.class_level, s.major_dcode]
    );
    for (const phone of s.phones) {
      await conn.execute('INSERT INTO student_phone (sid, phone) VALUES (?, ?)', [s.sid, phone]);
    }
  }).catch((err) => {
    if (err.code === 'ER_DUP_ENTRY' && /PRIMARY/.test(err.sqlMessage) && !/student_phone/.test(err.sqlMessage)) {
      throw new AppError(409, `A student with ID ${s.sid} already exists.`, { sid: 'This Student ID is already taken.' });
    }
    if (err.code === 'ER_DUP_ENTRY' && /email/.test(err.sqlMessage)) {
      throw new AppError(409, 'Another student already uses that email.', { email: 'This email is already in use.' });
    }
    if (err.code?.startsWith('ER_NO_REFERENCED_ROW')) {
      throw new AppError(400, `Major "${s.major_dcode}" is not a department in the database.`, { major_dcode: 'Unknown department.' });
    }
    throw err;
  });
  res.status(201).json({ message: `Added ${s.fname} ${s.lname} (ID ${s.sid}).`, sid: s.sid });
});

router.put('/:sid', async (req, res) => {
  const sid = checkSid(req.params.sid);
  const s = checkStudent(req.body, { isNew: false });
  await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `UPDATE student
       SET fname = ?, minit = ?, lname = ?, email = ?, bdate = ?, class_level = ?, major_dcode = ?
       WHERE sid = ?`,
      [s.fname, s.minit, s.lname, s.email, s.bdate, s.class_level, s.major_dcode, sid]
    );
    if (result.affectedRows === 0) throw new AppError(404, `No student found with ID ${sid}.`);
    await conn.execute('DELETE FROM student_phone WHERE sid = ?', [sid]);
    for (const phone of s.phones) {
      await conn.execute('INSERT INTO student_phone (sid, phone) VALUES (?, ?)', [sid, phone]);
    }
  }).catch((err) => {
    if (err.code === 'ER_DUP_ENTRY' && /email/.test(err.sqlMessage)) {
      throw new AppError(409, 'Another student already uses that email.', { email: 'This email is already in use.' });
    }
    if (err.code?.startsWith('ER_NO_REFERENCED_ROW')) {
      throw new AppError(400, `Major "${s.major_dcode}" is not a department in the database.`, { major_dcode: 'Unknown department.' });
    }
    throw err;
  });
  res.json({ message: `Saved changes to ${s.fname} ${s.lname} (ID ${sid}).` });
});

router.get('/:sid/transcript', async (req, res) => {
  const sid = checkSid(req.params.sid);
  const student = await query(
    `SELECT s.sid, s.fname, s.lname, s.class_level, d.dname AS major_name
     FROM student s LEFT JOIN department d ON d.dcode = s.major_dcode
     WHERE s.sid = ?`, [sid]);
  if (!student.length) throw new AppError(404, `No student found with ID ${sid}.`);

  const courses = await query(
    `SELECT e.semester, e.year, e.cno, c.title, c.units, e.sec_no, i.name AS instructor,
            e.status, e.grade, g.points
     FROM enrollment e
     JOIN section sec ON sec.cno = e.cno AND sec.semester = e.semester AND sec.year = e.year AND sec.sec_no = e.sec_no
     JOIN course c ON c.cno = e.cno
     JOIN instructor i ON i.iid = sec.iid
     LEFT JOIN grade_scale g ON g.grade = e.grade
     WHERE e.sid = ?
     ORDER BY e.year DESC, FIELD(e.semester, 'Fall', 'Summer', 'Spring'), e.cno`, [sid]);

  const [summary] = await query(
    `SELECT COUNT(*) AS graded_courses,
            COALESCE(SUM(c.units), 0) AS graded_units,
            ROUND(SUM(g.points * c.units) / NULLIF(SUM(c.units), 0), 2) AS gpa
     FROM enrollment e
     JOIN course c ON c.cno = e.cno
     JOIN grade_scale g ON g.grade = e.grade
     WHERE e.sid = ? AND g.counts_in_gpa = TRUE`, [sid]);

  res.json({ student: student[0], courses, summary });
});

export default router;
