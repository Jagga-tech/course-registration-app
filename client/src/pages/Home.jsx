import { Link } from 'react-router-dom';

const tiles = [
  ['/students', 'Students', 'Search students, add a new student, or edit details.'],
  ['/sections', 'Sections', 'Browse sections by term and department and see open seats.'],
  ['/enroll', 'Enroll a student', 'Register a student for a section. Prerequisites and capacity are checked.'],
  ['/reports', 'Reports', 'Enrollment by department, instructor teaching load and grades by course.']
];

export default function Home() {
  return (
    <>
      <h1>University Course Registration</h1>
      <p className="lead">Manage students, sections, registrations and grades. Everything here reads and writes the MySQL database directly.</p>
      <div className="tiles">
        {tiles.map(([to, title, text]) => (
          <Link key={to} to={to} className="tile">
            <h2>{title}</h2>
            <p>{text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
