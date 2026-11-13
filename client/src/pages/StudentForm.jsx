import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Field, Loading, Message, useLookups } from '../components/ui.jsx';

const blank = { sid: '', fname: '', minit: '', lname: '', email: '', bdate: '', class_level: '', major_dcode: '', phones: [''] };
const NAME = /^[\p{L}][\p{L}' .-]*$/u;

function validate(f, isNew) {
  const e = {};
  const today = new Date().toISOString().slice(0, 10);
  if (isNew) {
    if (!f.sid.trim()) e.sid = 'Student ID is required.';
    else if (!/^\d{9}$/.test(f.sid.trim())) e.sid = 'Student ID must be exactly 9 digits.';
  }
  if (!f.fname.trim()) e.fname = 'First name is required.';
  else if (!NAME.test(f.fname.trim())) e.fname = 'Use letters, spaces, hyphens or apostrophes only.';
  if (f.minit.trim() && !/^[A-Za-z]$/.test(f.minit.trim())) e.minit = 'One letter only.';
  if (!f.lname.trim()) e.lname = 'Last name is required.';
  else if (!NAME.test(f.lname.trim())) e.lname = 'Use letters, spaces, hyphens or apostrophes only.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email, like name@school.edu.';
  if (!f.bdate) e.bdate = 'Birth date is required.';
  else if (f.bdate < '1920-01-01' || f.bdate > today) e.bdate = `Birth date must be between 1920-01-01 and ${today}.`;
  if (!f.class_level) e.class_level = 'Pick a class level.';
  const phones = f.phones.map((p) => p.trim()).filter(Boolean);
  const bad = phones.find((p) => !/^[0-9+()\-.\s]{7,20}$/.test(p));
  if (bad) e.phones = `"${bad}" is not a valid phone number.`;
  else if (new Set(phones).size !== phones.length) e.phones = 'The same phone number is listed twice.';
  return e;
}

export default function StudentForm() {
  const { sid } = useParams();
  const isNew = !sid;
  const navigate = useNavigate();
  const { lookups } = useLookups();
  const [form, setForm] = useState(isNew ? blank : null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api(`/students/${sid}`).then((r) => {
      if (!r.ok) return setMsg({ type: 'error', text: r.error });
      const s = r.data;
      setForm({
        sid: String(s.sid), fname: s.fname, minit: s.minit || '', lname: s.lname, email: s.email,
        bdate: s.bdate, class_level: s.class_level, major_dcode: s.major_dcode || '',
        phones: s.phones.length ? s.phones : ['']
      });
    });
  }, [sid]);

  if (!form) return msg ? <Message msg={msg} /> : <Loading />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPhone = (i, v) => setForm({ ...form, phones: form.phones.map((p, j) => (j === i ? v : p)) });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, isNew);
    setErrors(errs);
    if (Object.keys(errs).length) return setMsg({ type: 'error', text: 'Please fix the highlighted fields.' });
    setSaving(true);
    setMsg(null);
    const body = { ...form, phones: form.phones.filter((p) => p.trim()) };
    const r = isNew
      ? await api('/students', { method: 'POST', body })
      : await api(`/students/${sid}`, { method: 'PUT', body });
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fields || {});
      return setMsg({ type: 'error', text: r.error });
    }
    navigate(`/students?q=${isNew ? form.sid : sid}`, { state: { msg: { type: 'success', text: r.data.message } } });
  };

  const cancel = () => navigate(-1);

  return (
    <>
      <h1>{isNew ? 'Add a student' : `Edit student ${sid}`}</h1>
      <Message msg={msg} onClose={() => setMsg(null)} />
      <form className="card form-grid" onSubmit={submit} noValidate>
        <Field label="Student ID" htmlFor="sid" error={errors.sid} required={isNew} hint={isNew ? '9 digits, e.g. 220105000' : 'The ID cannot be changed.'}>
          <input id="sid" inputMode="numeric" value={form.sid} onChange={set('sid')} disabled={!isNew} maxLength={9} />
        </Field>
        <Field label="First name" htmlFor="fname" error={errors.fname} required>
          <input id="fname" value={form.fname} onChange={set('fname')} maxLength={40} autoComplete="given-name" />
        </Field>
        <Field label="Middle initial" htmlFor="minit" error={errors.minit}>
          <input id="minit" value={form.minit} onChange={set('minit')} maxLength={1} />
        </Field>
        <Field label="Last name" htmlFor="lname" error={errors.lname} required>
          <input id="lname" value={form.lname} onChange={set('lname')} maxLength={40} autoComplete="family-name" />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email} required>
          <input id="email" type="email" value={form.email} onChange={set('email')} maxLength={100} />
        </Field>
        <Field label="Birth date" htmlFor="bdate" error={errors.bdate} required>
          <input id="bdate" type="date" value={form.bdate} onChange={set('bdate')} />
        </Field>
        <Field label="Class level" htmlFor="class_level" error={errors.class_level} required>
          <select id="class_level" value={form.class_level} onChange={set('class_level')}>
            <option value="">Choose…</option>
            {lookups?.classLevels.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Major" htmlFor="major_dcode" error={errors.major_dcode}>
          <select id="major_dcode" value={form.major_dcode} onChange={set('major_dcode')}>
            <option value="">Undeclared</option>
            {lookups?.departments.map((d) => <option key={d.dcode} value={d.dcode}>{d.dname}</option>)}
          </select>
        </Field>
        <fieldset className={`field span-2${errors.phones ? ' has-error' : ''}`}>
          <legend>Phone numbers</legend>
          {form.phones.map((p, i) => (
            <div className="phone-row" key={i}>
              <input aria-label={`Phone ${i + 1}`} value={p} onChange={(e) => setPhone(i, e.target.value)} placeholder="510-555-0199" maxLength={20} />
              {form.phones.length > 1 && (
                <button type="button" className="btn small" onClick={() => setForm({ ...form, phones: form.phones.filter((_, j) => j !== i) })}>Remove</button>
              )}
            </div>
          ))}
          {form.phones.length < 5 && (
            <button type="button" className="btn small" onClick={() => setForm({ ...form, phones: [...form.phones, ''] })}>Add another phone</button>
          )}
          {errors.phones && <small className="field-error" role="alert">{errors.phones}</small>}
        </fieldset>
        <div className="actions span-2">
          <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add student' : 'Save changes'}</button>
          <button className="btn" type="button" onClick={cancel}>Cancel</button>
        </div>
      </form>
    </>
  );
}
