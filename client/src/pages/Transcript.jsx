import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, Loading, Message, StatusBadge } from '../components/ui.jsx';

export default function Transcript() {
  const { sid } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/students/${sid}/transcript`).then((r) => (r.ok ? setData(r.data) : setError(r.error)));
  }, [sid]);

  if (error) return <Message msg={{ type: 'error', text: error }} />;
  if (!data) return <Loading />;
  const { student, courses, summary } = data;

  return (
    <>
      <p><Link to="/students">← Back to students</Link></p>
      <h1>Courses for {student.fname} {student.lname}</h1>
      <div className="stats">
        <div><span>Student ID</span><strong>{student.sid}</strong></div>
        <div><span>Major</span><strong>{student.major_name || 'Undeclared'}</strong></div>
        <div><span>Class</span><strong>{student.class_level}</strong></div>
        <div><span>GPA</span><strong>{summary.gpa ?? '—'}</strong></div>
        <div><span>Graded units</span><strong>{summary.graded_units}</strong></div>
      </div>
      {courses.length === 0 ? <Empty>This student has not registered for any sections yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Term</th><th>Course</th><th>Title</th><th>Units</th><th>Section</th><th>Instructor</th><th>Status</th><th>Grade</th></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={`${c.cno}-${c.semester}-${c.year}-${c.sec_no}`}>
                  <td data-label="Term">{c.semester} {c.year}</td>
                  <td data-label="Course">{c.cno}</td>
                  <td data-label="Title">{c.title}</td>
                  <td data-label="Units">{c.units}</td>
                  <td data-label="Section"><Link to={`/sections/${c.cno}/${c.semester}/${c.year}/${c.sec_no}`}>{c.sec_no}</Link></td>
                  <td data-label="Instructor">{c.instructor}</td>
                  <td data-label="Status"><StatusBadge status={c.status} /></td>
                  <td data-label="Grade">{c.grade || (c.status === 'Enrolled' ? 'In progress' : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">GPA is calculated by the database from grade points weighted by units. CR, NC, W and I do not count toward GPA.</p>
    </>
  );
}
