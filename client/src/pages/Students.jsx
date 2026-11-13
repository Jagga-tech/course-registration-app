import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, qs } from '../api.js';
import { Empty, Field, Loading, Message, useLookups } from '../components/ui.jsx';

export default function Students() {
  const { lookups } = useLookups();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ q: params.get('q') || '', major: params.get('major') || '', level: params.get('level') || '' });
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState(location.state?.msg || null);

  useEffect(() => {
    if (location.state?.msg) navigate(location.pathname + location.search, { replace: true, state: null });
  }, []);

  useEffect(() => {
    const filters = { q: params.get('q'), major: params.get('major'), level: params.get('level') };
    setRows(null);
    api(`/students${qs(filters)}`).then((r) => {
      if (r.ok) setRows(r.data);
      else { setRows([]); setMsg({ type: 'error', text: r.error }); }
    });
  }, [params]);

  const submit = (e) => {
    e.preventDefault();
    if (form.q.length > 60) return setMsg({ type: 'error', text: 'Search text must be 60 characters or less.' });
    setMsg(null);
    setParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== '')));
  };
  const clear = () => {
    setForm({ q: '', major: '', level: '' });
    setParams({});
  };

  return (
    <>
      <div className="page-head">
        <h1>Students</h1>
        <Link to="/students/new" className="btn primary">Add student</Link>
      </div>
      <Message msg={msg} onClose={() => setMsg(null)} />
      <form className="card filters" onSubmit={submit} role="search">
        <Field label="Name, email or student ID" htmlFor="q">
          <input id="q" value={form.q} maxLength={60} placeholder="e.g. Nguyen or 2201" onChange={(e) => setForm({ ...form, q: e.target.value })} />
        </Field>
        <Field label="Major" htmlFor="major">
          <select id="major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })}>
            <option value="">Any major</option>
            <option value="NONE">Undeclared</option>
            {lookups?.departments.map((d) => <option key={d.dcode} value={d.dcode}>{d.dname}</option>)}
          </select>
        </Field>
        <Field label="Class level" htmlFor="level">
          <select id="level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option value="">Any level</option>
            {lookups?.classLevels.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <div className="actions">
          <button className="btn primary" type="submit">Search</button>
          <button className="btn" type="button" onClick={clear}>Clear</button>
        </div>
      </form>

      {rows === null ? <Loading /> : rows.length === 0 ? <Empty>No students match these filters.</Empty> : (
        <>
          <p className="count">{rows.length} student{rows.length === 1 ? '' : 's'}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student ID</th><th>Name</th><th>Email</th><th>Class</th><th>Major</th><th>Phone</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.sid}>
                    <td data-label="ID">{s.sid}</td>
                    <td data-label="Name">{s.fname} {s.minit ? `${s.minit}. ` : ''}{s.lname}</td>
                    <td data-label="Email">{s.email}</td>
                    <td data-label="Class">{s.class_level}</td>
                    <td data-label="Major">{s.major_name || <em>Undeclared</em>}</td>
                    <td data-label="Phone">{s.phones || '—'}</td>
                    <td className="row-actions">
                      <Link to={`/students/${s.sid}/transcript`} className="btn small">Courses</Link>
                      <Link to={`/students/${s.sid}/edit`} className="btn small">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
