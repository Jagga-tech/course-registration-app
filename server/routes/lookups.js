import { Router } from 'express';
import { query } from '../db.js';
import { CLASS_LEVELS, SEMESTERS, STATUSES } from '../validate.js';

const router = Router();

router.get('/', async (req, res) => {
  const [departments, courses, instructors, grades, terms] = await Promise.all([
    query('SELECT dcode, dname FROM department ORDER BY dname'),
    query('SELECT cno, title, dcode FROM course ORDER BY cno'),
    query('SELECT iid, name, dcode FROM instructor ORDER BY name'),
    query('SELECT grade, points FROM grade_scale ORDER BY points IS NULL, points DESC, grade'),
    query(`SELECT semester, year FROM section
           GROUP BY semester, year
           ORDER BY year DESC, FIELD(semester, 'Fall', 'Summer', 'Spring')`)
  ]);
  res.json({ departments, courses, instructors, grades, terms, classLevels: CLASS_LEVELS, semesters: SEMESTERS, statuses: STATUSES });
});

export default router;
