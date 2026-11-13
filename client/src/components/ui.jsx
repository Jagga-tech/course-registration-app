import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

export function Message({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`msg ${msg.type}`} role={msg.type === 'error' ? 'alert' : 'status'}>
      <span>{msg.text}</span>
      {onClose && <button type="button" className="msg-close" onClick={onClose} aria-label="Dismiss message">×</button>}
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor, required }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}{required && <span className="req" aria-hidden="true"> *</span>}</label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="field-error" role="alert">{error}</small>}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}

export function Loading() {
  return <p className="loading">Loading…</p>;
}

const LookupContext = createContext(null);

export function LookupProvider({ children }) {
  const [lookups, setLookups] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api('/lookups').then((r) => (r.ok ? setLookups(r.data) : setError(r.error)));
  }, []);
  return <LookupContext.Provider value={{ lookups, error }}>{children}</LookupContext.Provider>;
}

export const useLookups = () => useContext(LookupContext);

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status?.toLowerCase()}`}>{status}</span>;
}
