import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, qs, sectionPath } from '../api.js';
import { Empty, Field, Loading, Message, useLookups } from '../components/ui.jsx';

export default function Sections() {
  const { lookups } = useLookups();
  const [params, setParams] = useSearchParams();
  const initialTerm = params.get('semester') && params.get('year') ? `${params.get('semester')}|${params.get('year')}` : '';
  const [form, setForm] = useState({ term: initialTerm, dcode: params.get('dcode') || '', q: params.get('q') || '', open: params.get('open') === '1' });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lookups || params.toString() || initialTerm) return;
    const current = lookups.terms.find((t) => t.semester === 'Fall' && t.year === 2026) || lookups.terms[0];
    if (current) {
      setForm((f) => ({ ...f, term: `${current.semester}|${current.year}` }));
      setParams({ semester: current.semester, year: String(current.year) }, { replace: true });
    }
  }, [lookups]);

  useEffect(() => {
    setRows(null);
    api(`/sections${qs(Object.fromEntries(params))}`).then((r) => {
      if (r.ok) { setRows(r.data); setError(null); } else { setRows([]); setError(r.error); }
    });
  }, [params]);

  const submit = (e) => {
    e.preventDefault();
    const [semester, year] = form.term ? form.term.split('|') : [];
    setParams(Object.fromEntries(Object.entries({ semester, year, dcode: form.dcode, q: form.q.trim(), open: form.open ? '1' : '' }).filter(([, v]) => v)));
  };

  return (
    <>
      <h1>Sections</h1>
      <Message msg={error && { type: 'error', text: error }} />
      <form className="card filters" onSubmit={submit} role="search">
        <Field label="Term" htmlFor="term">
          <select id="term" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
            <option value="">All terms</option>
            {lookups?.terms.map((t) => <option key={`${t.semester}|${t.year}`} value={`${t.semester}|${t.year}`}>{t.semester} {t.year}</option>)}
          </select>
        </Field>
        <Field label="Department" htmlFor="dcode">
          <select id="dcode" value={form.dcode} onChange={(e) => setForm({ ...form, dcode: e.target.value })}>
            <option value="">All departments</option>
            {lookups?.departments.map((d) => <option key={d.dcode} value={d.dcode}>{d.dname}</option>)}
          </select>
        </Field>
        <Field label="Course number or title" htmlFor="sq">
          <input id="sq" value={form.q} maxLength={60} placeholder="e.g. CS46 or Database" onChange={(e) => setForm({ ...form, q: e.target.value })} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={form.open} onChange={(e) => setForm({ ...form, open: e.target.checked })} /> Only sections with open seats
        </label>
        <div className="actions">
          <button className="btn primary" type="submit">Search</button>
          <button className="btn" type="button" onClick={() => { setForm({ term: '', dcode: '', q: '', open: false }); setParams({ all: '1' }); }}>Clear</button>
        </div>
      </form>

      {rows === null ? <Loading /> : rows.length === 0 ? <Empty>No sections match these filters.</Empty> : (
        <>
          <p className="count">{rows.length} section{rows.length === 1 ? '' : 's'}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Term</th><th>Course</th><th>Sec</th><th>Meets</th><th>Room</th><th>Instructor</th><th>Seats</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={sectionPath(s)}>
                    <td data-label="Term">{s.semester} {s.year}</td>
                    <td data-label="Course"><strong>{s.cno}</strong> {s.title}</td>
                    <td data-label="Section">{s.sec_no}</td>
                    <td data-label="Meets">{s.days ? `${s.days} ${s.start_time}–${s.end_time}` : 'Online'}</td>
                    <td data-label="Room">{s.building ? `${s.building} ${s.room_no}` : '—'}</td>
                    <td data-label="Instructor">{s.instructor}</td>
                    <td data-label="Seats">
                      <span className={s.seats_left > 0 ? 'seats ok' : 'seats full'}>{s.enrolled}/{s.capacity}</span>
                      {s.waitlisted > 0 && <small> +{s.waitlisted} waitlisted</small>}
                    </td>
                    <td className="row-actions">
                      <Link className="btn small" to={sectionPath(s)}>Roster</Link>
                      <Link className="btn small" to={`/enroll?cno=${s.cno}&semester=${s.semester}&year=${s.year}&sec_no=${s.sec_no}`}>Enroll</Link>
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
