import subprocess

FONT = "Liberation Sans, Arial, sans-serif"
COLORS = ["#455a64", "#1f5fbf", "#b3261e", "#1b7f3b", "#8a4fbf", "#c46a00", "#0f7f86", "#5d4037", "#c2185b", "#3949ab", "#6d7a00", "#00796b", "#7b1fa2"]

rels = [
    ("DEPARTMENT", ["Dcode", "Dname", "Office", "Phone", "Chair_iid", "Chair_start_date"], ["Dcode"]),
    ("INSTRUCTOR", ["Iid", "Name", "Email", "Office", "Instr_rank", "Dcode"], ["Iid"]),
    ("STUDENT", ["Sid", "Fname", "Minit", "Lname", "Email", "Bdate", "Class_level", "Major_dcode"], ["Sid"]),
    ("STUDENT_PHONE", ["Sid", "Phone"], ["Sid", "Phone"]),
    ("COURSE", ["Cno", "Title", "Units", "Description", "Dcode"], ["Cno"]),
    ("PREREQUISITE", ["Cno", "Prereq_cno"], ["Cno", "Prereq_cno"]),
    ("CLASSROOM", ["Building", "Room_no", "Seats"], ["Building", "Room_no"]),
    ("SECTION", ["Cno", "Semester", "Year", "Sec_no", "Days", "Start_time", "End_time", "Capacity", "Iid", "Building", "Room_no"], ["Cno", "Semester", "Year", "Sec_no"]),
    ("GRADE_SCALE", ["Grade", "Points", "Counts_in_gpa", "Is_passing"], ["Grade"]),
    ("ENROLLMENT", ["Sid", "Cno", "Semester", "Year", "Sec_no", "Reg_date", "Status", "Grade"], ["Sid", "Cno", "Semester", "Year", "Sec_no"]),
]

fks = [
    ("DEPARTMENT", ["Chair_iid"], "INSTRUCTOR", ["Iid"]),
    ("INSTRUCTOR", ["Dcode"], "DEPARTMENT", ["Dcode"]),
    ("STUDENT", ["Major_dcode"], "DEPARTMENT", ["Dcode"]),
    ("STUDENT_PHONE", ["Sid"], "STUDENT", ["Sid"]),
    ("COURSE", ["Dcode"], "DEPARTMENT", ["Dcode"]),
    ("PREREQUISITE", ["Cno"], "COURSE", ["Cno"]),
    ("PREREQUISITE", ["Prereq_cno"], "COURSE", ["Cno"]),
    ("SECTION", ["Cno"], "COURSE", ["Cno"]),
    ("SECTION", ["Iid"], "INSTRUCTOR", ["Iid"]),
    ("SECTION", ["Building", "Room_no"], "CLASSROOM", ["Building", "Room_no"]),
    ("ENROLLMENT", ["Sid"], "STUDENT", ["Sid"]),
    ("ENROLLMENT", ["Cno", "Semester", "Year", "Sec_no"], "SECTION", ["Cno", "Semester", "Year", "Sec_no"]),
    ("ENROLLMENT", ["Grade"], "GRADE_SCALE", ["Grade"]),
]

X0 = 380
ROW = 120
Y0 = 110
CH = 30
cells = {}
out = []
W = 0
for i, (name, attrs, pk) in enumerate(rels):
    y = Y0 + i * ROW
    x = X0
    out.append(f'<text x="{X0-12}" y="{y+20}" text-anchor="end" font-size="14" font-weight="700">{name}</text>')
    for a in attrs:
        w = len(a) * 7.4 + 22
        cells[(name, a)] = (x, y, w)
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{CH}" fill="#fff" stroke="#111" stroke-width="1.3"/>')
        out.append(f'<text x="{x+w/2}" y="{y+20}" text-anchor="middle" font-size="13">{a}</text>')
        if a in pk:
            tw = len(a) * 7.0
            out.append(f'<line x1="{x+w/2-tw/2}" y1="{y+23}" x2="{x+w/2+tw/2}" y2="{y+23}" stroke="#111" stroke-width="1.2"/>')
        x += w
    W = max(W, x)
rowy = {name: Y0 + i * ROW for i, (name, _, _) in enumerate(rels)}

gut_count = {}
arrows = []
for k, (src, sa, dst, da) in enumerate(fks):
    c = COLORS[k % len(COLORS)]
    lane = 30 + k * 15
    sx0 = cells[(src, sa[0])][0]
    sx1 = cells[(src, sa[-1])][0] + cells[(src, sa[-1])][2]
    tx0 = cells[(dst, da[0])][0]
    tx1 = cells[(dst, da[-1])][0] + cells[(dst, da[-1])][2]
    sx = (sx0 + sx1) / 2
    tx = (tx0 + tx1) / 2
    sy, ty = rowy[src], rowy[dst]
    up = ty < sy
    sg = ("above", src) if up else ("below", src)
    tg = ("below", dst) if up else ("above", dst)
    gs = gut_count.get(sg, 0); gut_count[sg] = gs + 1
    gt = gut_count.get(tg, 0); gut_count[tg] = gt + 1
    if up:
        y1 = sy - 30 - gs * 9
        y2 = ty + CH + 12 + gt * 9
        p = [(sx, sy), (sx, y1), (lane, y1), (lane, y2), (tx, y2), (tx, ty + CH)]
    else:
        y1 = sy + CH + 12 + gs * 9
        y2 = ty - 30 - gt * 9
        p = [(sx, sy + CH), (sx, y1), (lane, y1), (lane, y2), (tx, y2), (tx, ty)]
    if len(sa) > 1:
        yb = sy - 5 if up else sy + CH + 5
        out.append(f'<path d="M{sx0+4},{yb} L{sx1-4},{yb}" stroke="{c}" stroke-width="2.5"/>')
        p[0] = (sx, yb)
    if len(da) > 1:
        yb = ty + CH + 5 if up else ty - 5
        out.append(f'<path d="M{tx0+4},{yb} L{tx1-4},{yb}" stroke="{c}" stroke-width="2.5"/>')
        p[-1] = (tx, yb)
    d = "M" + " L".join(f"{a},{b}" for a, b in p)
    arrows.append(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="1.7" marker-end="url(#a{k})"/>')
    arrows.append(f'<defs><marker id="a{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="{c}"/></marker></defs>')

W = int(W + 30)
H = Y0 + len(rels) * ROW - 30
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}" fill="#111">'
       f'<rect width="{W}" height="{H}" fill="#fff"/>'
       f'<text x="24" y="36" font-size="20" font-weight="700">Relational Schema with Referential Integrity Constraints</text>'
       f'<text x="24" y="58" font-size="13" fill="#555">Underlined = primary key.  Each arrow runs from a foreign key to the primary key it references.</text>'
       + "".join(arrows) + "".join(out) + "</svg>")
open("updated_schema.svg", "w").write(svg)
subprocess.run(["rsvg-convert", "-z", "2", "-o", "updated_schema.png", "updated_schema.svg"], check=True)
print(W, H)
