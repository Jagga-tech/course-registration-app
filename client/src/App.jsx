import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { LookupProvider, useLookups, Message } from './components/ui.jsx';
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

function LookupError() {
  const { error } = useLookups();
  return error ? <Message msg={{ type: 'error', text: `Could not load lists from the database: ${error}` }} /> : null;
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
            <img src="/favicon.svg" alt="" width="28" height="28" />
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
