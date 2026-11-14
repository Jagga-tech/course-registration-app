import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { LookupProvider, useLookups, Message } from './components/ui.jsx';
import { IS_STATIC_HOST, getApiBase, setApiBase } from './api.js';
import Home from './pages/Home.jsx';
import Students from './pages/Students.jsx';
import StudentForm from './pages/StudentForm.jsx';
import Transcript from './pages/Transcript.jsx';
import Sections from './pages/Sections.jsx';
import Roster from './pages/Roster.jsx';
import Enroll from './pages/Enroll.jsx';
import Reports from './pages/Reports.jsx';

const links = [
  ['/', 'Home'],
  ['/students', 'Students'],
  ['/sections', 'Sections'],
  ['/enroll', 'Enroll'],
  ['/reports', 'Reports']
];

function ServerHelp() {
  const [url, setUrl] = useState(getApiBase());
  const save = (e) => {
    e.preventDefault();
    setApiBase(url.trim());
    window.location.reload();
  };
  return (
    <form className="card server-help" onSubmit={save}>
      <h2>Connect to your local server</h2>
      <p>This page is hosted on GitHub Pages, but the data lives in MySQL on your computer. In the project folder run <code>npm start</code>, then reload this page. If your browser asks to let this site access devices on your local network, choose Allow.</p>
      <div className="server-row">
        <label htmlFor="apibase">Server address</label>
        <input id="apibase" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:3000" />
        <button className="btn primary" type="submit">Save and retry</button>
      </div>
    </form>
  );
}

function LookupError() {
  const { error, offline } = useLookups();
  if (!error) return null;
  if (IS_STATIC_HOST && offline) return <ServerHelp />;
  return <Message msg={{ type: 'error', text: `Could not load lists from the database: ${error}` }} />;
}

export default function App() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <LookupProvider>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
            <span>Course Registration</span>
          </NavLink>
          <button className="menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
            {open ? 'Close' : 'Menu'}
          </button>
          <nav id="main-nav" className={open ? 'nav open' : 'nav'} aria-label="Main">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container">
        <LookupError />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/new" element={<StudentForm />} />
          <Route path="/students/:sid/edit" element={<StudentForm />} />
          <Route path="/students/:sid/transcript" element={<Transcript />} />
          <Route path="/sections" element={<Sections />} />
          <Route path="/sections/:cno/:semester/:year/:secNo" element={<Roster />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <footer className="footer">University Course Registration System · Database course project</footer>
    </LookupProvider>
  );
}
