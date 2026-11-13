import { AppError } from './errors.js';

export const CLASS_LEVELS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
export const SEMESTERS = ['Spring', 'Summer', 'Fall'];
export const STATUSES = ['Enrolled', 'Waitlisted', 'Dropped'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+()\-.\s]{7,20}$/;
const NAME = /^[\p{L}][\p{L}' .-]*$/u;
const COURSE = /^[A-Z]{2,6}[0-9]{3,4}$/;
const SEC_NO = /^[0-9]{2}$/;

export class Checker {
  constructor(body = {}) {
    this.body = body ?? {};
    this.errors = {};
    this.values = {};
  }

  raw(field) {
    const v = this.body[field];
    if (v === undefined || v === null) return '';
    return typeof v === 'string' ? v.trim() : v;
  }

  fail(field, message) {
    if (!this.errors[field]) this.errors[field] = message;
    return this;
  }

  required(field, label) {
    if (this.raw(field) === '') this.fail(field, `${label} is required.`);
    return this;
  }

  text(field, label, { max, pattern, patternMessage, optional = false } = {}) {
    const v = this.raw(field);
    if (v === '') {
      if (!optional) this.fail(field, `${label} is required.`);
      else this.values[field] = null;
      return this;
    }
    const s = String(v);
    if (max && s.length > max) return this.fail(field, `${label} must be at most ${max} characters.`);
    if (pattern && !pattern.test(s)) return this.fail(field, patternMessage || `${label} has an invalid format.`);
    this.values[field] = s;
    return this;
  }

  int(field, label, { min, max, optional = false } = {}) {
    const v = this.raw(field);
    if (v === '') {
      if (!optional) this.fail(field, `${label} is required.`);
      else this.values[field] = null;
      return this;
    }
    if (!/^-?\d+$/.test(String(v))) return this.fail(field, `${label} must be a whole number.`);
    const n = Number(v);
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) {
      return this.fail(field, `${label} must be between ${min} and ${max}.`);
    }
    this.values[field] = n;
    return this;
  }

  oneOf(field, label, allowed, { optional = false } = {}) {
    const v = this.raw(field);
    if (v === '') {
      if (!optional) this.fail(field, `${label} is required.`);
      else this.values[field] = null;
      return this;
    }
    if (!allowed.includes(v)) return this.fail(field, `${label} must be one of: ${allowed.join(', ')}.`);
    this.values[field] = v;
    return this;
  }

  date(field, label, { min, max } = {}) {
    const v = this.raw(field);
    if (v === '') return this.fail(field, `${label} is required.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v + 'T00:00:00Z'))) {
      return this.fail(field, `${label} must be a valid date (YYYY-MM-DD).`);
    }
    const d = new Date(v + 'T00:00:00Z');
    if (d.toISOString().slice(0, 10) !== v) return this.fail(field, `${label} must be a real calendar date.`);
    if (min && v < min) return this.fail(field, `${label} cannot be before ${min}.`);
    if (max && v > max) return this.fail(field, `${label} cannot be after ${max}.`);
    this.values[field] = v;
    return this;
  }

  done() {
    if (Object.keys(this.errors).length) {
      throw new AppError(400, 'Please fix the highlighted fields.', this.errors);
    }
    return this.values;
  }
}

export function checkStudent(body, { isNew }) {
  const today = new Date().toISOString().slice(0, 10);
  const c = new Checker(body);
  if (isNew) c.int('sid', 'Student ID', { min: 100000000, max: 999999999 });
  c.text('fname', 'First name', { max: 40, pattern: NAME, patternMessage: 'First name can only contain letters, spaces, hyphens and apostrophes.' })
    .text('minit', 'Middle initial', { max: 1, pattern: /^[A-Za-z]$/, patternMessage: 'Middle initial must be a single letter.', optional: true })
    .text('lname', 'Last name', { max: 40, pattern: NAME, patternMessage: 'Last name can only contain letters, spaces, hyphens and apostrophes.' })
    .text('email', 'Email', { max: 100, pattern: EMAIL, patternMessage: 'Enter a valid email, like name@school.edu.' })
    .date('bdate', 'Birth date', { min: '1920-01-01', max: today })
    .oneOf('class_level', 'Class level', CLASS_LEVELS)
    .text('major_dcode', 'Major', { max: 6, pattern: /^[A-Z]{2,6}$/, patternMessage: 'Pick a major from the list.', optional: true });

  const phones = Array.isArray(body?.phones) ? body.phones.map((p) => String(p ?? '').trim()).filter(Boolean) : [];
  const bad = phones.find((p) => !PHONE.test(p));
  if (bad) c.fail('phones', `"${bad}" is not a valid phone number.`);
  if (new Set(phones).size !== phones.length) c.fail('phones', 'The same phone number is listed twice.');
  if (phones.length > 5) c.fail('phones', 'Enter at most 5 phone numbers.');

  const values = c.done();
  if (values.minit) values.minit = values.minit.toUpperCase();
  values.email = values.email.toLowerCase();
  values.phones = phones;
  return values;
}

export function checkSectionKey(body) {
  return new Checker(body)
    .text('cno', 'Course', { max: 10, pattern: COURSE, patternMessage: 'Course number must look like CS4660.' })
    .oneOf('semester', 'Semester', SEMESTERS)
    .int('year', 'Year', { min: 2000, max: 2100 })
    .text('sec_no', 'Section number', { max: 2, pattern: SEC_NO, patternMessage: 'Section number must be two digits, like 01.' })
    .done();
}

export function checkSid(value) {
  return new Checker({ sid: value }).int('sid', 'Student ID', { min: 100000000, max: 999999999 }).done().sid;
}
