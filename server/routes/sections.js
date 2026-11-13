import { Router } from 'express';
import { query } from '../db.js';
import { AppError } from '../errors.js';
import { Checker, checkSectionKey, SEMESTERS } from '../validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const f = new Checker(req.query)
    .oneOf('semester', 'Semester', SEMESTERS, { optional: true })
    .int('year', 'Year', { min: 2000, max: 2100, optional: true })
    .text('dcode', 'Department', { max: 6, optional: true })
    .text('q', 'Course search', { max: 60, optional: true })
    .int('iid', 'Instructor', { min: 1, max: 99999999, optional: true })
    .oneOf('open', 'Open only', ['1', '0'], { optional: true })
    .done();

  const where = [];
  const params = [];
  if (f.semester) { where.push('sec.semester = ?'); params.push(f.semester); }
  if (f.year) { where.push('sec.year = ?'); params.push(f.year); }
  if (f.dcode) { where.push('c.dcode = ?'); params.push(f.dcode); }
  if (f.iid) { where.push('sec.iid = ?'); params.push(f.iid); }
  if (f.q) { where.push('(c.cno LIKE ? OR c.title LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }

  const sql = `
    SELECT sec.cno, c.title, c.units, sec.semester, sec.year, sec.sec_no, sec.days,
           TIME_FORMAT(sec.start_time, '%H:%i') AS start_time, TIME_FORMAT(sec.end_time, '%H:%i') AS end_time,
           sec.building, sec.room_no, sec.capacity, i.iid, i.name AS instructor, c.dcode,
           COUNT(CASE WHEN e.status = 'Enrolled' THEN 1 END) AS enrolled,
           COUNT(CASE WHEN e.status = 'Waitlisted' THEN 1 END) AS waitlisted,
           sec.capacity - COUNT(CASE WHEN e.status = 'Enrolled' THEN 1 END) AS seats_left
    FROM section sec
    JOIN course c ON c.cno = sec.cno
    JOIN instructor i ON i.iid = sec.iid
    LEFT JOIN enrollment e ON e.cno = sec.cno AND e.semester = sec.semester AND e.year = sec.year AND e.sec_no = sec.sec_no
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY sec.cno, c.title, c.units, sec.semester, sec.year, sec.sec_no, sec.days, sec.start_time, sec.end_time,
             sec.building, sec.room_no, sec.capacity, i.iid, i.name, c.dcode
    ${f.open === '1' ? 'HAVING seats_left > 0' : ''}
    ORDER BY sec.year DESC, FIELD(sec.semester, 'Fall', 'Summer', 'Spring'), sec.cno, sec.sec_no
    LIMIT 300`;
  res.json(await query(sql, params));
});

router.get('/:cno/:semester/:year/:sec_no/roster', async (req, res) => {
  const k = checkSectionKey(req.params);
  const section = await query(
    `SELECT sec.cno, c.title, sec.semester, sec.year, sec.sec_no, sec.capacity, i.name AS instructor
     FROM section sec JOIN course c ON c.cno = sec.cno JOIN instructor i ON i.iid = sec.iid
     WHERE sec.cno = ? AND sec.semester = ? AND sec.year = ? AND sec.sec_no = ?`,
    [k.cno, k.semester, k.year, k.sec_no]);
  if (!section.length) throw new AppError(404, `Section ${k.cno}-${k.sec_no} (${k.semester} ${k.year}) does not exist.`);

  const students = await query(
    `SELECT s.sid, s.fname, s.lname, s.email, s.class_level, s.major_dcode,
            e.reg_date, e.status, e.grade
     FROM enrollment e JOIN student s ON s.sid = e.sid
     WHERE e.cno = ? AND e.semester = ? AND e.year = ? AND e.sec_no = ?
     ORDER BY FIELD(e.status, 'Enrolled', 'Waitlisted', 'Dropped'), e.reg_date, s.lname`,
    [k.cno, k.semester, k.year, k.sec_no]);
  res.json({ section: section[0], students });
});

export default router;
