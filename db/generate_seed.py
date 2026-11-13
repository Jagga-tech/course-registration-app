import random
from datetime import date, timedelta

random.seed(4660)

departments = [
    ("CS", "Computer Science", "Science North 202", "510-555-0120"),
    ("MATH", "Mathematics", "Science North 301", "510-555-0130"),
    ("STAT", "Statistics", "Science North 315", "510-555-0140"),
    ("BUS", "Business Administration", "Valley Business 110", "510-555-0150"),
]

instructors = [
    (5001, "Maria Delgado", "maria.delgado@univ.edu", "SN 210", "Professor", "CS"),
    (5002, "Kevin Osei", "kevin.osei@univ.edu", "SN 212", "Associate Professor", "CS"),
    (5003, "Priya Raman", "priya.raman@univ.edu", "SN 214", "Assistant Professor", "CS"),
    (5004, "Daniel Kim", "daniel.kim@univ.edu", "SN 216", "Lecturer", "CS"),
    (5005, "Helen Brooks", "helen.brooks@univ.edu", "SN 305", "Professor", "MATH"),
    (5006, "Omar Haddad", "omar.haddad@univ.edu", "SN 307", "Associate Professor", "MATH"),
    (5007, "Lucy Chen", "lucy.chen@univ.edu", "SN 309", "Lecturer", "MATH"),
    (5008, "Rafael Ortiz", "rafael.ortiz@univ.edu", "SN 318", "Professor", "STAT"),
    (5009, "Grace Liu", "grace.liu@univ.edu", "SN 320", "Assistant Professor", "STAT"),
    (5010, "Samuel Adeyemi", "samuel.adeyemi@univ.edu", "VB 115", "Professor", "BUS"),
    (5011, "Nina Patel", "nina.patel@univ.edu", "VB 117", "Lecturer", "BUS"),
]
chairs = {"CS": (5001, "2022-07-01"), "MATH": (5005, "2021-07-01"), "STAT": (5008, "2023-07-01"), "BUS": (5010, "2020-07-01")}

courses = [
    ("CS1160", "Introduction to Computer Science I", 4, "Problem solving and programming in a high-level language.", "CS"),
    ("CS2360", "Data Structures", 4, "Lists, stacks, queues, trees, hashing and their analysis.", "CS"),
    ("CS2430", "Discrete Structures", 4, "Logic, sets, relations, graphs and proof techniques.", "CS"),
    ("CS3110", "Algorithm Design and Analysis", 4, "Divide and conquer, greedy and dynamic programming algorithms.", "CS"),
    ("CS3240", "Computer Organization", 4, "Machine-level representation, assembly language and memory.", "CS"),
    ("CS4560", "Operating Systems", 4, "Processes, threads, scheduling, memory and file systems.", "CS"),
    ("CS4660", "Database Systems", 4, "ER modeling, relational design, SQL and normalization.", "CS"),
    ("CS4310", "Software Engineering", 4, "Requirements, design, testing and team software projects.", "CS"),
    ("MATH1304", "Calculus I", 4, "Limits, derivatives and their applications.", "MATH"),
    ("MATH1305", "Calculus II", 4, "Integration techniques, sequences and series.", "MATH"),
    ("MATH2101", "Linear Algebra", 4, "Vectors, matrices, linear transformations and eigenvalues.", "MATH"),
    ("STAT1000", "Elements of Statistics", 4, "Descriptive statistics, probability and inference.", "STAT"),
    ("STAT3601", "Statistical Methods", 4, "Regression, ANOVA and nonparametric methods.", "STAT"),
    ("BUS2100", "Principles of Management", 4, "Planning, organizing, leading and controlling organizations.", "BUS"),
    ("BUS3800", "Information Systems in Business", 4, "How organizations use information systems and data.", "BUS"),
]

prereqs = [
    ("CS2360", "CS1160"), ("CS2430", "CS1160"), ("CS3110", "CS2360"), ("CS3110", "CS2430"),
    ("CS3240", "CS2360"), ("CS4560", "CS3240"), ("CS4660", "CS2360"), ("CS4310", "CS2360"),
    ("MATH1305", "MATH1304"), ("MATH2101", "MATH1305"), ("STAT3601", "STAT1000"), ("BUS3800", "BUS2100"),
]

classrooms = [
    ("Science North", "101", 60), ("Science North", "120", 40), ("Science North", "233", 35),
    ("Valley Business", "105", 50), ("Valley Business", "210", 30), ("Library", "L2077", 24),
]

terms = [("Fall", 2025), ("Spring", 2026), ("Fall", 2026), ("Spring", 2027)]
slots = [("MW", "08:00", "09:50"), ("MW", "10:00", "11:50"), ("TR", "10:00", "11:50"),
         ("TR", "14:00", "15:50"), ("MW", "14:00", "15:50"), ("F", "09:00", "12:50")]
teachers = {"CS": [5001, 5002, 5003, 5004], "MATH": [5005, 5006, 5007], "STAT": [5008, 5009], "BUS": [5010, 5011]}
course_dept = {c[0]: c[4] for c in courses}

sections = []
offer = {
    ("Fall", 2025): ["CS1160", "CS2360", "CS2430", "MATH1304", "MATH1305", "STAT1000", "BUS2100"],
    ("Spring", 2026): ["CS1160", "CS2360", "CS3110", "CS3240", "MATH1305", "MATH2101", "STAT3601", "BUS3800"],
    ("Fall", 2026): ["CS1160", "CS2360", "CS3110", "CS4560", "CS4660", "CS4310", "MATH1304", "STAT1000", "BUS2100"],
    ("Spring", 2027): ["CS2360", "CS4660", "CS4310", "MATH2101", "STAT3601", "BUS3800"],
}
for term in terms:
    used = set()
    for i, cno in enumerate(offer[term]):
        nsec = 2 if cno in ("CS1160", "CS2360") and term != ("Spring", 2027) else 1
        for s in range(1, nsec + 1):
            for _ in range(50):
                slot = random.choice(slots)
                room = random.choice(classrooms[:5])
                if (slot, room[:2]) not in used:
                    used.add((slot, room[:2]))
                    break
            online = cno == "BUS3800"
            iid = teachers[course_dept[cno]][(i + s) % len(teachers[course_dept[cno]])]
            cap = 8 if (cno == "CS4660" and term == ("Fall", 2026)) else random.choice([15, 20, 24, 30])
            sections.append(dict(cno=cno, semester=term[0], year=term[1], sec_no=f"{s:02d}",
                                 days=None if online else slot[0], start=None if online else slot[1],
                                 end=None if online else slot[2], cap=cap, iid=iid,
                                 building=None if online else room[0], room=None if online else room[1]))

first = ["Aaliyah", "Ben", "Carlos", "Dana", "Ethan", "Fatima", "Gabriel", "Hana", "Isaac", "Jasmine", "Kai", "Leila",
         "Marcus", "Nora", "Owen", "Paola", "Quinn", "Ravi", "Sofia", "Tyler", "Uma", "Victor", "Wen", "Ximena",
         "Yusuf", "Zoe", "Arjun", "Bianca", "Diego", "Emily", "Farah", "Hector"]
last = ["Johnson", "Nguyen", "Garcia", "Singh", "Martinez", "Khan", "Lopez", "Tanaka", "Brown", "Reyes", "Wong", "Ahmed",
        "Davis", "Silva", "Patel", "Romero", "Kowalski", "Iyer", "Rossi", "Murphy", "Sato", "Hernandez", "Zhang", "Flores",
        "Ali", "Thompson", "Mehta", "Costa", "Ramirez", "Clark", "Hassan", "Vargas"]
levels = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
majors = ["CS"] * 14 + ["MATH"] * 5 + ["STAT"] * 4 + ["BUS"] * 6 + [None] * 3
students = []
for i in range(32):
    sid = 220100000 + i * 137 + 11
    lvl = levels[i % 5] if i % 7 else "Senior"
    by = {"Freshman": 2007, "Sophomore": 2006, "Junior": 2005, "Senior": 2004, "Graduate": 2001}[lvl] - random.randint(0, 2)
    bd = date(by, random.randint(1, 12), random.randint(1, 28))
    fn, ln = first[i], last[i]
    mi = random.choice("ABCDEFGHJKLMNPRST") if i % 3 else None
    students.append(dict(sid=sid, fname=fn, minit=mi, lname=ln, email=f"{fn.lower()}.{ln.lower()}@students.univ.edu",
                         bdate=bd.isoformat(), level=lvl, major=majors[i]))

phones = []
for i, s in enumerate(students):
    phones.append((s["sid"], f"510-555-{1000 + i * 7:04d}"))
    if i % 4 == 0:
        phones.append((s["sid"], f"925-555-{2000 + i * 11:04d}"))

grade_pool = ["A", "A", "A-", "A-", "B+", "B+", "B", "B", "B", "B-", "C+", "C", "C", "D", "F", "W"]
reg_start = {("Fall", 2025): date(2025, 4, 14), ("Spring", 2026): date(2025, 11, 10),
             ("Fall", 2026): date(2026, 4, 13), ("Spring", 2027): date(2026, 11, 9)}
passed = {s["sid"]: set() for s in students}
enroll = []
for term in terms:
    term_secs = [x for x in sections if (x["semester"], x["year"]) == term]
    random.shuffle(students)
    for s in students:
        take = random.randint(2, 3) if term != ("Spring", 2027) else random.randint(0, 1)
        options = [x for x in term_secs if all(p in passed[s["sid"]] for c, p in prereqs if c == x["cno"])
                   and x["cno"] not in passed[s["sid"]]]
        random.shuffle(options)
        chosen, cnos = [], set()
        for x in options:
            if x["cno"] in cnos:
                continue
            count = sum(1 for e in enroll if e["key"] == (x["cno"], x["semester"], x["year"], x["sec_no"]) and e["status"] == "Enrolled")
            status = "Enrolled" if count < x["cap"] else "Waitlisted"
            if status == "Waitlisted" and term in (("Fall", 2025), ("Spring", 2026)):
                continue
            cnos.add(x["cno"])
            chosen.append((x, status))
            if len(chosen) >= take:
                break
        for x, status in chosen:
            rd = reg_start[term] + timedelta(days=random.randint(0, 20))
            grade = None
            if term in (("Fall", 2025), ("Spring", 2026)):
                grade = random.choice(grade_pool)
                if grade not in ("D", "F", "W"):
                    passed[s["sid"]].add(x["cno"])
            if status == "Enrolled" and term == ("Fall", 2026) and random.random() < 0.05:
                status = "Dropped"
            enroll.append(dict(sid=s["sid"], key=(x["cno"], x["semester"], x["year"], x["sec_no"]), rd=rd.isoformat(),
                               status=status, grade=grade))
students.sort(key=lambda s: s["sid"])


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


out = ["-- Sample data for the University Course Registration System", "-- Generated by generate_seed.py (fixed random seed, so it always produces the same data)", "USE course_registration;", ""]
out.append("INSERT INTO department (dcode, dname, office, phone) VALUES")
out.append(",\n".join(f"  ({q(d[0])}, {q(d[1])}, {q(d[2])}, {q(d[3])})" for d in departments) + ";")
out.append("\nINSERT INTO instructor (iid, name, email, office, instr_rank, dcode) VALUES")
out.append(",\n".join("  (" + ", ".join(q(v) for v in i) + ")" for i in instructors) + ";")
out.append("")
for d, (iid, sd) in chairs.items():
    out.append(f"UPDATE department SET chair_iid = {iid}, chair_start_date = {q(sd)} WHERE dcode = {q(d)};")
out.append("\nINSERT INTO student (sid, fname, minit, lname, email, bdate, class_level, major_dcode) VALUES")
out.append(",\n".join(f"  ({s['sid']}, {q(s['fname'])}, {q(s['minit'])}, {q(s['lname'])}, {q(s['email'])}, {q(s['bdate'])}, {q(s['level'])}, {q(s['major'])})" for s in students) + ";")
out.append("\nINSERT INTO student_phone (sid, phone) VALUES")
out.append(",\n".join(f"  ({p[0]}, {q(p[1])})" for p in phones) + ";")
out.append("\nINSERT INTO course (cno, title, units, description, dcode) VALUES")
out.append(",\n".join("  (" + ", ".join(q(v) for v in c) + ")" for c in courses) + ";")
out.append("\nINSERT INTO prerequisite (cno, prereq_cno) VALUES")
out.append(",\n".join(f"  ({q(a)}, {q(b)})" for a, b in prereqs) + ";")
out.append("\nINSERT INTO classroom (building, room_no, seats) VALUES")
out.append(",\n".join(f"  ({q(c[0])}, {q(c[1])}, {c[2]})" for c in classrooms) + ";")
out.append("\nINSERT INTO section (cno, semester, year, sec_no, days, start_time, end_time, capacity, iid, building, room_no) VALUES")
out.append(",\n".join(f"  ({q(x['cno'])}, {q(x['semester'])}, {x['year']}, {q(x['sec_no'])}, {q(x['days'])}, {q(x['start'])}, {q(x['end'])}, {x['cap']}, {x['iid']}, {q(x['building'])}, {q(x['room'])})" for x in sections) + ";")
out.append("\nINSERT INTO grade_scale (grade, points, counts_in_gpa, is_passing) VALUES")
scale = [("A", "4.0", 1, 1), ("A-", "3.7", 1, 1), ("B+", "3.3", 1, 1), ("B", "3.0", 1, 1), ("B-", "2.7", 1, 1),
         ("C+", "2.3", 1, 1), ("C", "2.0", 1, 1), ("C-", "1.7", 1, 1), ("D", "1.0", 1, 0), ("F", "0.0", 1, 0),
         ("CR", None, 0, 1), ("NC", None, 0, 0), ("W", None, 0, 0), ("I", None, 0, 0)]
out.append(",\n".join(f"  ({q(a)}, {b if b else 'NULL'}, {c}, {d})" for a, b, c, d in scale) + ";")
out.append("\nINSERT INTO enrollment (sid, cno, semester, year, sec_no, reg_date, status, grade) VALUES")
out.append(",\n".join(f"  ({e['sid']}, {q(e['key'][0])}, {q(e['key'][1])}, {e['key'][2]}, {q(e['key'][3])}, {q(e['rd'])}, {q(e['status'])}, {q(e['grade'])})" for e in enroll) + ";")
open("seed.sql", "w").write("\n".join(out) + "\n")
print(len(students), "students,", len(sections), "sections,", len(enroll), "enrollments")
