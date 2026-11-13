import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, qs, sectionPath } from '../api.js';
import { Field, Message, useLookups } from '../components/ui.jsx';

export default function Enroll() {
  const { lookups } = useLookups();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = params.get('cno') ? `${params.get('cno')}|${params.get('semester')}|${params.get('year')}|${params.get('sec_no')}` : '';
  const [term, setTerm] = useState(params.get('semester') ? `${params.get('semester')}|${params.get('year')}` : '');
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({ sid: '', section: preset });
  const [student, setStudent] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!term && lookups?.terms.length) {
      const t = lookups.terms.find((x) => x.semester === 'Spring' && x.year === 2027) || lookups.terms[0];
      setTerm(`${t.semester}|${t.year}`);
    }
  }, [lookups]);

  useEffect(() => {
    if (!term) return;
    const [semester, year] = term.split('|');
    api(`/sections${qs({ semester, year })}`).then((r) => r.ok && setSections(r.data));
  }, [term]);

  useEffect(() => {
    setStudent(null);
    if (!/^\d{9}$/.test(form.sid.trim())) return;
    const t = setTimeout(() => api(`/students/${form.sid.trim()}`).then((r) => setStudent(r.ok ? r.data : { missing: true })), 250);
    return () => clearTimeout(t);
  }, [form.sid]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.sid.trim()) errs.sid = 'Enter a student ID.';
    else if (!/^\d{9}$/.test(form.sid.trim())) errs.sid = 'Student ID must be exactly 9 digits.';
    if (!form.section) errs.section = 'Pick a section.';
    setErrors(errs);
    setResult(null);
    if (Object.keys(errs).length) return setMsg({ type: 'error', text: 'Please fix the highlighted fields.' });
    const [cno, semester, year, sec_no] = form.section.split('|');
    setSaving(true);
    const r = await api('/enrollments', { method: 'POST', body: { sid: form.sid.trim(), cno, semester, year, sec_no } });
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fields || {});
      return setMsg({ type: 'error', text: r.error });
    }
    setMsg({ type: r.data.status === 'Enrolled' ? 'success' : 'warning', text: r.data.message });
    setResult({ cno, semester, year, sec_no, sid: form.sid.trim() });
    api(`/sections${qs({ semester, year })}`).then((x) => x.ok && setSections(x.data));
  };

  const chosen = sections.find((s) => `${s.cno}|${s.semester}|${s.year}|${s.sec_no}` === form.section);

  return (
    <>
      <h1>Enroll a student</h1>
      <p className="lead">The database checks prerequisites and capacity. If the section is full, the student goes on the waitlist.</p>
      <Message msg={msg} onClose={() => setMsg(null)} />
      {result && (
        <p className="after-save">
          Check it: <Link to={sectionPath(result)}>view the section roster</Link> or <Link to={`/students/${result.sid}/transcript`}>the student's courses</Link>.
        </p>
      )}
      <form className="card form-grid" onSubmit={submit} noValidate>
        <Field label="Student ID" htmlFor="esid" error={errors.sid} required
          hint={student ? (student.missing ? 'No student with this ID.' : `${student.fname} ${student.lname} · ${student.class_level}`) : '9 digits'}>
          <input id="esid" inputMode="numeric" maxLength={9} value={form.sid} onChange={(e) => setForm({ ...form, sid: e.target.value })} />
        </Field>
        <Field label="Term" htmlFor="eterm">
          <select id="eterm" value={term} onChange={(e) => { setTerm(e.target.value); setForm({ ...form, section: '' }); }}>
            {lookups?.terms.map((t) => <option key={`${t.semester}|${t.year}`} value={`${t.semester}|${t.year}`}>{t.semester} {t.year}</option>)}
          </select>
        </Field>
        <Field label="Section" htmlFor="esec" error={errors.section} required>
          <select id="esec" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
            <option value="">Choose a section…</option>
            {sections.map((s) => (
              <option key={sectionPath(s)} value={`${s.cno}|${s.semester}|${s.year}|${s.sec_no}`}>
                {s.cno}-{s.sec_no} {s.title} ({s.seats_left > 0 ? `${s.seats_left} seats left` : 'full, waitlist'})
              </option>
            ))}
          </select>
        </Field>
        {chosen && (
          <p className="span-2 note">{chosen.instructor} · {chosen.days ? `${chosen.days} ${chosen.start_time}–${chosen.end_time}` : 'Online'} · {chosen.enrolled}/{chosen.capacity} enrolled</p>
        )}
        <div className="actions span-2">
          <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Enrolling…' : 'Enroll'}</button>
          <button className="btn" type="button" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </>
  );
}
