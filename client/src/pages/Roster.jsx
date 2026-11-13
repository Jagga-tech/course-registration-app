import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, Loading, Message, StatusBadge, useLookups } from '../components/ui.jsx';

function Row({ s, k, grades, statuses, onSaved }) {
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    if (edit.grade && edit.status !== 'Enrolled') return setErr('Only enrolled students can get a grade.');
    setSaving(true);
    const r = await api(`/enrollments/${s.sid}/${k.cno}/${k.semester}/${k.year}/${k.secNo}`, { method: 'PUT', body: edit });
    setSaving(false);
    if (!r.ok) return setErr(r.error);
    setEdit(null);
    setErr(null);
    onSaved(r.data.message);
  };

  return (
    <tr>
      <td data-label="ID">{s.sid}</td>
      <td data-label="Name"><Link to={`/students/${s.sid}/transcript`}>{s.fname} {s.lname}</Link></td>
      <td data-label="Class">{s.class_level}</td>
      <td data-label="Registered">{s.reg_date}</td>
      {edit ? (
        <td colSpan={3} className="inline-edit">
          <form onSubmit={save}>
            <label>Status
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {statuses.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label>Grade
              <select value={edit.grade} onChange={(e) => setEdit({ ...edit, grade: e.target.value })}>
                <option value="">No grade yet</option>
                {grades.map((g) => <option key={g.grade} value={g.grade}>{g.grade}{g.points !== null ? ` (${g.points})` : ''}</option>)}
              </select>
            </label>
            <button className="btn small primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button className="btn small" type="button" onClick={() => { setEdit(null); setErr(null); }}>Cancel</button>
            {err && <small className="field-error" role="alert">{err}</small>}
          </form>
        </td>
      ) : (
        <>
          <td data-label="Status"><StatusBadge status={s.status} /></td>
          <td data-label="Grade">{s.grade || '—'}</td>
          <td className="row-actions">
            <button className="btn small" onClick={() => setEdit({ status: s.status, grade: s.grade || '' })}>Update</button>
          </td>
        </>
      )}
    </tr>
  );
}

export default function Roster() {
  const k = useParams();
  const { lookups } = useLookups();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => api(`/sections/${k.cno}/${k.semester}/${k.year}/${k.secNo}/roster`).then((r) => {
    if (r.ok) setData(r.data);
    else setMsg({ type: 'error', text: r.error });
  });
  useEffect(() => { load(); }, [k.cno, k.semester, k.year, k.secNo]);

  if (!data) return msg ? <Message msg={msg} /> : <Loading />;
  const { section, students } = data;
  const enrolled = students.filter((s) => s.status === 'Enrolled').length;

  return (
    <>
      <p><Link to="/sections">← Back to sections</Link></p>
      <div className="page-head">
        <h1>{section.cno}-{section.sec_no}: {section.title}</h1>
        <Link className="btn primary" to={`/enroll?cno=${section.cno}&semester=${section.semester}&year=${section.year}&sec_no=${section.sec_no}`}>Enroll a student</Link>
      </div>
      <div className="stats">
        <div><span>Term</span><strong>{section.semester} {section.year}</strong></div>
        <div><span>Instructor</span><strong>{section.instructor}</strong></div>
        <div><span>Enrolled</span><strong>{enrolled} / {section.capacity}</strong></div>
        <div><span>Waitlisted</span><strong>{students.filter((s) => s.status === 'Waitlisted').length}</strong></div>
      </div>
      <Message msg={msg} onClose={() => setMsg(null)} />
      {students.length === 0 ? <Empty>No students are registered in this section yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Student ID</th><th>Name</th><th>Class</th><th>Registered</th><th>Status</th><th>Grade</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <Row key={s.sid} s={s} k={k} grades={lookups?.grades || []} statuses={lookups?.statuses || []}
                  onSaved={(text) => { setMsg({ type: 'success', text }); load(); }} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
