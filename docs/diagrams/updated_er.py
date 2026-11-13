from chen import Diagram

d = Diagram(1080, 1290, "Updated ER Diagram — University Course Registration System (web app version)")

d.entity("dept", 540, 200, "DEPARTMENT", w=150)
d.entity("inst", 190, 480, "INSTRUCTOR", w=140)
d.entity("course", 540, 480, "COURSE", w=130)
d.entity("stu", 900, 480, "STUDENT", w=130)
d.entity("sec", 540, 830, "SECTION", weak=True, w=140)
d.entity("room", 540, 1130, "CLASSROOM", w=150)

d.rel("chairs", 300, 200, "CHAIRS")
d.rel("works", 330, 300, "WORKS_IN", w=120)
d.rel("offers", 540, 340, "OFFERS")
d.rel("major", 790, 200, "MAJORS_IN", w=124)
d.rel("prereq", 740, 620, "PREREQUISITE", w=150)
d.rel("hassec", 540, 680, "HAS_SECTION", ident=True, w=150)
d.rel("teaches", 300, 830, "TEACHES")
d.rel("enrolls", 780, 830, "ENROLLS")
d.rel("meets", 540, 990, "MEETS_IN", w=120)

d.link("chairs", "dept", total=True)
d.link("chairs", "inst", via=[(150, 200), (150, 480)])
d.link("works", "dept", via=[(476, 300), (476, 200)])
d.link("works", "inst", total=True, via=[(230, 300), (230, 480)])
d.link("offers", "dept")
d.link("offers", "course", total=True)
d.link("major", "dept")
d.link("major", "stu", via=[(900, 200)])
d.link("prereq", "course", via=[(740, 480)])
d.link("prereq", "course", via=[(590, 620), (590, 480)])
d.link("hassec", "course")
d.link("hassec", "sec", total=True)
d.link("teaches", "inst", via=[(190, 830)])
d.link("teaches", "sec", total=True)
d.link("enrolls", "stu", via=[(900, 830)])
d.link("enrolls", "sec")
d.link("meets", "sec")
d.link("meets", "room")

d.attr("d_code", 400, 105, "Dcode", "key", "dept")
d.attr("d_name", 500, 92, "Dname", "", "dept")
d.attr("d_off", 600, 92, "Office", "", "dept")
d.attr("d_ph", 690, 112, "Phone", "", "dept")
d.attr("c_start", 300, 112, "Start_date", "", "chairs")

d.attr("i_id", 62, 395, "Iid", "key", "inst")
d.attr("i_name", 58, 470, "Name", "", "inst")
d.attr("i_email", 66, 548, "Email", "", "inst")
d.attr("i_off", 120, 615, "Office", "", "inst")
d.attr("i_rank", 300, 590, "Instr_rank", "", "inst")

d.attr("c_no", 420, 420, "Cno", "key", "course")
d.attr("c_title", 400, 495, "Title", "", "course")
d.attr("c_units", 420, 565, "Units", "", "course")
d.attr("c_desc", 660, 395, "Description", "", "course")

d.attr("s_name", 790, 380, "Name", "", "stu")
d.attr("s_f", 660, 300, "Fname", "", "s_name")
d.attr("s_m", 765, 295, "Minit", "", "s_name")
d.attr("s_l", 855, 320, "Lname", "", "s_name")
d.attr("s_id", 1015, 380, "Sid", "key", "stu")
d.attr("s_email", 1025, 450, "Email", "", "stu")
d.attr("s_bd", 1025, 520, "Bdate", "", "stu")
d.attr("s_class", 1010, 590, "Class_level", "", "stu")
d.attr("s_ph", 805, 555, "Phone", "multi", "stu")
d.attr("s_gpa", 990, 665, "GPA", "derived", "stu")

d.attr("x_sec", 430, 728, "Sec_no", "partial", "sec")
d.attr("x_sem", 640, 745, "Semester", "partial", "sec")
d.attr("x_year", 305, 745, "Year", "partial", "sec")
d.attr("x_days", 360, 905, "Days", "", "sec")
d.attr("x_st", 385, 995, "Start_time", "", "sec")
d.attr("x_et", 680, 1010, "End_time", "", "sec")
d.attr("x_cap", 670, 925, "Capacity", "", "sec")

d.attr("e_grade", 795, 935, "Grade", "", "enrolls")
d.attr("e_status", 895, 950, "Status", "", "enrolls")
d.attr("e_date", 985, 890, "Reg_date", "", "enrolls")

d.attr("r_room", 540, 1220, "Room_id", "key", "room")
d.attr("r_b", 420, 1250, "Building", "", "r_room")
d.attr("r_no", 660, 1250, "Room_no", "", "r_room")
d.attr("r_seats", 700, 1140, "Seats", "", "room")

d.card(375, 192, "1")
d.card(163, 300, "1")
d.card(462, 262, "1")
d.card(243, 400, "N")
d.card(552, 280, "1")
d.card(552, 418, "N")
d.card(650, 192, "1")
d.card(860, 192, "")
d.card(912, 300, "N")
d.card(668, 472, "M")
d.card(600, 560, "N")
d.card(552, 535, "1")
d.card(552, 770, "N")
d.card(204, 760, "1")
d.card(395, 822, "N")
d.card(912, 760, "M")
d.card(680, 822, "N")
d.card(552, 925, "N")
d.card(552, 1075, "1")

d.text(748, 470, "prerequisite", 11.5, italic=True, color="#555", anchor="start")
d.text(600, 600, "course", 11.5, italic=True, color="#555", anchor="start")

lx, ly = 24, 1085
d.labels.append(f'<rect x="{lx}" y="{ly}" width="330" height="190" fill="#fff" stroke="#999" stroke-width="1"/>')
d.text(lx+14, ly+24, "Notation (Chen / Elmasri-Navathe)", 13, 700, "start")
rows = ["Rectangle = entity;  double rectangle = weak entity",
        "Diamond = relationship;  double = identifying",
        "Underlined = key;  dashed underline = partial key",
        "Double oval = multivalued;  dashed oval = derived",
        "Double line = total participation (mandatory)",
        "Single line = partial participation (optional)",
        "1 / N / M = cardinality ratio (maximum)"]
for i, r in enumerate(rows):
    d.text(lx+14, ly+50+i*20, r, 12, 400, "start", "#333")

d.save("updated_er")
