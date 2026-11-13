import { Router } from 'express';
import { query } from '../db.js';
import { Checker, SEMESTERS } from '../validate.js';

const router = Router();

function termFilter(req, alias) {
  const f = new Checker(req.query)
    .oneOf('semester', 'Semester', SEMESTERS, { optional: true })
    .int('year', 'Year', { min: 2000, max: 2100, optional: true })
    .done();
  const where = [];
  const params = [];
  if (f.semester) { where.push(`${alias}.semester = ?`); params.push(f.semester); }
  if (f.year) { where.push(`${alias}.year = ?`); params.push(f.year); }
  return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

const SECTION_COUNTS = `
  SELECT sec.cno, sec.semester, sec.year, sec.sec_no, sec.capacity, sec.iid,
         COUNT(CASE WHEN e.status = 'Enrolled' THEN 1 END) AS enrolled,
         COUNT(CASE WHEN e.status = 'Waitlisted' THEN 1 END) AS waitlisted
  FROM section sec
  LEFT JOIN enrollment e ON e.cno = sec.cno AND e.semester = sec.semester AND e.year = sec.year AND e.sec_no = sec.sec_no
  __WHERE__
  GROUP BY sec.cno, sec.semester, sec.year, sec.sec_no, sec.capacity, sec.iid`;

router.get('/enrollment-by-department', async (req, res) => {
  const t = termFilter(req, 'sec');
  const rows = await query(
    `SELECT d.dcode, d.dname,
            COUNT(*) AS sections,
            SUM(sc.capacity) AS seats,
            SUM(sc.enrolled) AS enrolled,
            SUM(sc.waitlisted) AS waitlisted,
            ROUND(100 * SUM(sc.enrolled) / SUM(sc.capacity), 1) AS fill_percent
     FROM (${SECTION_COUNTS.replace('__WHERE__', t.clause)}) AS sc
     JOIN course c ON c.cno = sc.cno
     JOIN department d ON d.dcode = c.dcode
     GROUP BY d.dcode, d.dname
     ORDER BY enrolled DESC, d.dcode`, t.params);
  res.json(rows);
});

router.get('/instructor-load', async (req, res) => {
  const t = termFilter(req, 'sec');
  const rows = await query(
    `SELECT i.iid, i.name, i.instr_rank, i.dcode,
            COUNT(*) AS sections,
            SUM(sc.enrolled) AS students,
            ROUND(AVG(sc.enrolled), 1) AS avg_class_size,
            MAX(sc.enrolled) AS largest_class
     FROM (${SECTION_COUNTS.replace('__WHERE__', t.clause)}) AS sc
     JOIN instructor i ON i.iid = sc.iid
     GROUP BY i.iid, i.name, i.instr_rank, i.dcode
     ORDER BY students DESC, i.name`, t.params);
  res.json(rows);
});

router.get('/grades-by-course', async (req, res) => {
  const t = termFilter(req, 'e');
  const rows = await query(
    `SELECT c.cno, c.title,
            COUNT(*) AS graded,
            ROUND(AVG(CASE WHEN g.counts_in_gpa THEN g.points END), 2) AS avg_grade_points,
            SUM(CASE WHEN g.grade IN ('A', 'A-') THEN 1 ELSE 0 END) AS a_grades,
            SUM(CASE WHEN g.is_passing THEN 1 ELSE 0 END) AS passed,
            SUM(CASE WHEN g.grade IN ('D', 'F') THEN 1 ELSE 0 END) AS d_or_f,
            SUM(CASE WHEN g.grade = 'W' THEN 1 ELSE 0 END) AS withdrawals,
            ROUND(100 * SUM(CASE WHEN g.is_passing THEN 1 ELSE 0 END) / COUNT(*), 1) AS pass_percent
     FROM enrollment e
     JOIN grade_scale g ON g.grade = e.grade
     JOIN course c ON c.cno = e.cno
     ${t.clause}
     GROUP BY c.cno, c.title
     ORDER BY avg_grade_points DESC`, t.params);
  res.json(rows);
});

export default router;
