# University Course Registration System

A web application for the university course registration database we designed in the ER assignment. Users can search students and sections, add and edit students, enroll students in sections, record grades, view a student's courses (a multi-table join) and run summary reports (GROUP BY). Everything goes through a browser. No SQL or command line is needed after startup.

**Demo video:** _add link here_

**Stack:** MySQL 8 · Node.js + Express (backend, parameterized SQL) · React + Vite (frontend) · HTML/CSS

## Prerequisites

| Tool | Version | Check with |
| --- | --- | --- |
| Node.js | 18 or newer | `node -v` |
| MySQL Server | 8.0.16 or newer (needed for CHECK constraints) | `mysql --version` |
| A modern browser | Chrome, Safari, Edge or Firefox | |

## Setup (about 5 minutes)

**1. Get the code**

```bash
git clone <this repo URL>
cd course-registration-app
```

**2. Tell the app how to log in to MySQL**

```bash
cp .env.example .env
```

Open `.env` and set `DB_USER` and `DB_PASSWORD` to your local MySQL login (often `root` and the password you chose when installing MySQL).

**3. Install dependencies and build the frontend**

```bash
npm run setup
```

**4. Create the database and load the sample data**

```bash
npm run db:init
```

This runs `db/schema.sql` (tables and constraints) and then `db/seed.sql` (sample data). It drops and recreates the `course_registration` database, so you can run it again any time to reset to the demo data. You can also run the scripts yourself:

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p < db/seed.sql
```

**5. Start the app**

```bash
npm start
```

Open **http://localhost:3000** in your browser, or use the GitHub Pages link below.

### Using the GitHub Pages version

The interface is also published at **https://jagga-tech.github.io/course-registration-app/**. GitHub Pages can only host static files, so that page has no database of its own. It sends every request to the server running on your computer at `http://localhost:3000`, and the data stays in your local MySQL.

1. Finish steps 1–4 above, then run `npm start`.
2. Open the Pages link in Chrome or Edge. If the browser asks to let the site access devices on your local network, click **Allow**.
3. If the server isn't running, the page shows a yellow "Connect to your local server" box. Start the server and click **Save and retry**. You can also change the address there if you use a different port.

The server only accepts browser requests from the origins listed in `CORS_ORIGINS` in `.env`. The default is `https://jagga-tech.github.io`. Safari may block a secure (https) page from calling `http://localhost`, so use Chrome or Edge for the Pages version, or just open http://localhost:3000.

Every push to `main` rebuilds the interface and publishes it to the `gh-pages` branch, which GitHub Pages serves (`.github/workflows/pages.yml`).

### Opening it on a phone

Connect the phone to the same Wi-Fi as the computer and open `http://<your-computer's-IP>:3000`. Find the IP with `ipconfig getifaddr en0` on macOS or `ipconfig` on Windows.

## What you can do

| Page | Feature | Tables touched |
| --- | --- | --- |
| Students | Search by name, email or ID, filtered by major and class level | SELECT on student, department, student_phone |
| Students → Add student | Insert a new student with phone numbers | INSERT student, student_phone |
| Students → Edit | Update one student's details | UPDATE student, student_phone |
| Students → Courses | A student's courses, grades and GPA | JOIN enrollment, section, course, instructor, grade_scale |
| Sections | Browse sections by term, department and course, with seats left | JOIN + GROUP BY section, course, instructor, enrollment |
| Section roster | List of students in a section, plus updates to status and grade | SELECT / UPDATE enrollment |
| Enroll | Register a student for a section. Checks prerequisites and capacity, with waitlisting | INSERT enrollment |
| Reports | Enrollment by department, instructor load, grades by course | GROUP BY with COUNT, SUM, AVG |

## Things to try in the demo

- **Duplicate key:** add a student with ID `220100148`, which already exists.
- **Invalid foreign key:** student and section pickers only offer valid values, so this is shown by the API tests (`major_dcode = 'XYZ'`).
- **Business rule:** enroll a new student in CS4660 for Spring 2027. They get blocked because they haven't passed the prerequisite CS2360.
- **Capacity:** CS4660-01 in Fall 2026 is full (8/8). Enrolling another student puts them on the waitlist, and promoting a waitlisted student to Enrolled is refused.
- **Persistence:** after any insert or update, the app shows the saved record from MySQL. You can also check it with `SELECT * FROM course_registration.student WHERE sid = ...;`

## Tests

With the app running (`npm start`) in one terminal, run this in another:

```bash
npm test
```

The suite has 18 API tests covering searches, inserts, updates, missing input, invalid values, duplicate keys, a bad foreign key, prerequisites, capacity and the reports. Run `npm run db:init` afterwards to reset the data.

## Project layout

```
db/
  schema.sql          tables, keys, foreign keys, NOT NULL / UNIQUE / CHECK constraints
  seed.sql            sample data (generated)
  generate_seed.py    script that generates seed.sql (fixed random seed)
server/
  index.js            Express app, error handling, serves the built frontend
  db.js               MySQL connection pool and transaction helper
  validate.js         backend input validation
  errors.js           turns MySQL errors into clear messages
  routes/             students, sections, enrollments, reports, lookups
client/
  src/pages/          React pages (Students, StudentForm, Transcript, Sections, Roster, Enroll, Reports)
  src/components/     shared UI pieces (messages, fields)
scripts/init-db.js    loads schema.sql and seed.sql
tests/api.test.js     automated tests
docs/
  report/             PDF report and its source
  diagrams/           ER and schema diagrams (draw.io files and the scripts that drew them)
```

## Development mode

Run `npm run dev` (API with auto-restart) and `npm run dev:client` (Vite on http://localhost:5173 with hot reload) in two terminals.

## Troubleshooting

- **"The database is not reachable"**: MySQL isn't running, or `.env` has the wrong user or password.
- **`ER_NOT_SUPPORTED_AUTH_MODE` or access denied**: check the password in `.env`. On MySQL 8 the default `caching_sha2_password` login works with this app.
- **CHECK constraint errors when loading the schema**: you are on MySQL older than 8.0.16. Upgrade MySQL.
- **Port 3000 in use**: set `PORT=3001` in `.env`.

## Credits

Built with [Express](https://expressjs.com/), [mysql2](https://github.com/sidorares/node-mysql2), [React](https://react.dev/), [React Router](https://reactrouter.com/) and [Vite](https://vitejs.dev/). The ER notation follows Elmasri & Navathe, *Fundamentals of Database Systems*. Sample data is fictional.
