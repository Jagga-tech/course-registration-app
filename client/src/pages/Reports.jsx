import { useEffect, useState } from 'react';
import { api, qs } from '../api.js';
import { Empty, Field, Loading, Message, useLookups } from '../components/ui.jsx';

const REPORTS = {
  department: {
    title: 'Enrollment by department',
    path: '/reports/enrollment-by-department',
    about: 'How full each department’s sections are. Helps decide where to add or cut sections.',
    cols: [['dname', 'Department'], ['sections', 'Sections'], ['seats', 'Seats'], ['enrolled', 'Enrolled'], ['waitlisted', 'Waitlisted'], ['fill_percent', 'Fill %']],
    bar: 'fill_percent'
  },
  instructor: {
    title: 'Instructor teaching load',
    path: '/reports/instructor-load',
    about: 'Sections and students per instructor. Helps balance teaching assignments.',
    cols: [['name', 'Instructor'], ['instr_rank', 'Rank'], ['dcode', 'Dept'], ['sections', 'Sections'], ['students', 'Students'], ['avg_class_size', 'Avg class'], ['largest_class', 'Largest']]
  },
  grades: {
    title: 'Grades by course',
    path: '/reports/grades-by-course',
    about: 'Average grade points and pass rate per course, from recorded grades. Helps spot courses where students struggle.',
    cols: [['cno', 'Course'], ['title', 'Title'], ['graded', 'Graded'], ['avg_grade_points', 'Avg points'], ['a_grades', 'A / A-'], ['d_or_f', 'D / F'], ['withdrawals', 'W'], ['pass_percent', 'Pass %']],
    bar: 'pass_percent'
  }
};

export default function Reports() {
  const { lookups } = useLookups();
  const [which, setWhich] = useState('department');
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const report = REPORTS[which];

  useEffect(() => {
    const [semester, year] = term ? term.split('|') : [];
    setRows(null);
    api(`${report.path}${qs({ semester, year })}`).then((r) => {
      if (r.ok) { setRows(r.data); setError(null); } else { setRows([]); setError(r.error); }
    });
  }, [which, term]);

  return (
    <>
      <h1>Reports</h1>
      <div className="tabs" role="tablist">
        {Object.entries(REPORTS).map(([key, r]) => (
          <button key={key} role="tab" aria-selected={which === key} className={which === key ? 'tab active' : 'tab'} onClick={() => setWhich(key)}>{r.title}</button>
        ))}
      </div>
      <div className="card filters">
        <Field label="Term" htmlFor="rterm">
          <select id="rterm" value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="">All terms</option>
            {lookups?.terms.map((t) => <option key={`${t.semester}|${t.year}`} value={`${t.semester}|${t.year}`}>{t.semester} {t.year}</option>)}
          </select>
        </Field>
        <p className="note">{report.about}</p>
      </div>
      <Message msg={error && { type: 'error', text: error }} />
      {rows === null ? <Loading /> : rows.length === 0 ? <Empty>No data for this term yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr>{report.cols.map(([k, label]) => <th key={k}>{label}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {report.cols.map(([k, label]) => (
                    <td key={k} data-label={label}>
                      {k === report.bar && r[k] !== null ? (
                        <span className="bar-cell"><span className="track"><span className="bar" style={{ width: `${Math.min(100, r[k])}%` }} /></span>{r[k]}%</span>
                      ) : (r[k] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
