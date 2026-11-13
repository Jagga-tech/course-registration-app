-- University Course Registration System
-- Schema creation script (MySQL 8.0.16+)
-- Recreates the database from scratch, including every constraint.

DROP DATABASE IF EXISTS course_registration;
CREATE DATABASE course_registration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE course_registration;

CREATE TABLE department (
    dcode            VARCHAR(6)   NOT NULL,
    dname            VARCHAR(60)  NOT NULL,
    office           VARCHAR(40),
    phone            VARCHAR(20),
    chair_iid        INT,
    chair_start_date DATE,
    CONSTRAINT pk_department PRIMARY KEY (dcode),
    CONSTRAINT uq_department_dname UNIQUE (dname),
    CONSTRAINT chk_department_dcode CHECK (dcode REGEXP '^[A-Za-z]{2,6}$' AND CAST(dcode AS BINARY) = CAST(UPPER(dcode) AS BINARY))
);

CREATE TABLE instructor (
    iid        INT          NOT NULL,
    name       VARCHAR(80)  NOT NULL,
    email      VARCHAR(100) NOT NULL,
    office     VARCHAR(40),
    instr_rank VARCHAR(20)  NOT NULL,
    dcode      VARCHAR(6)   NOT NULL,
    CONSTRAINT pk_instructor PRIMARY KEY (iid),
    CONSTRAINT uq_instructor_email UNIQUE (email),
    CONSTRAINT chk_instructor_rank CHECK (instr_rank IN ('Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor')),
    CONSTRAINT fk_instructor_department FOREIGN KEY (dcode) REFERENCES department (dcode)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

ALTER TABLE department
    ADD CONSTRAINT fk_department_chair FOREIGN KEY (chair_iid) REFERENCES instructor (iid)
        ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE student (
    sid         INT          NOT NULL,
    fname       VARCHAR(40)  NOT NULL,
    minit       CHAR(1),
    lname       VARCHAR(40)  NOT NULL,
    email       VARCHAR(100) NOT NULL,
    bdate       DATE         NOT NULL,
    class_level VARCHAR(10)  NOT NULL,
    major_dcode VARCHAR(6),
    CONSTRAINT pk_student PRIMARY KEY (sid),
    CONSTRAINT uq_student_email UNIQUE (email),
    CONSTRAINT chk_student_sid CHECK (sid BETWEEN 100000000 AND 999999999),
    CONSTRAINT chk_student_class CHECK (class_level IN ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate')),
    CONSTRAINT chk_student_bdate CHECK (bdate >= '1920-01-01'),
    CONSTRAINT fk_student_major FOREIGN KEY (major_dcode) REFERENCES department (dcode)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE student_phone (
    sid   INT         NOT NULL,
    phone VARCHAR(20) NOT NULL,
    CONSTRAINT pk_student_phone PRIMARY KEY (sid, phone),
    CONSTRAINT fk_phone_student FOREIGN KEY (sid) REFERENCES student (sid)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE course (
    cno         VARCHAR(10)  NOT NULL,
    title       VARCHAR(100) NOT NULL,
    units       TINYINT      NOT NULL,
    description VARCHAR(500),
    dcode       VARCHAR(6)   NOT NULL,
    CONSTRAINT pk_course PRIMARY KEY (cno),
    CONSTRAINT chk_course_units CHECK (units BETWEEN 1 AND 6),
    CONSTRAINT fk_course_department FOREIGN KEY (dcode) REFERENCES department (dcode)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE prerequisite (
    cno        VARCHAR(10) NOT NULL,
    prereq_cno VARCHAR(10) NOT NULL,
    CONSTRAINT pk_prerequisite PRIMARY KEY (cno, prereq_cno),
    CONSTRAINT chk_prereq_not_self CHECK (cno <> prereq_cno),
    CONSTRAINT fk_prereq_course FOREIGN KEY (cno) REFERENCES course (cno),
    CONSTRAINT fk_prereq_required FOREIGN KEY (prereq_cno) REFERENCES course (cno)
);

CREATE TABLE classroom (
    building VARCHAR(20) NOT NULL,
    room_no  VARCHAR(10) NOT NULL,
    seats    SMALLINT    NOT NULL,
    CONSTRAINT pk_classroom PRIMARY KEY (building, room_no),
    CONSTRAINT chk_classroom_seats CHECK (seats > 0)
);

CREATE TABLE section (
    cno        VARCHAR(10) NOT NULL,
    semester   VARCHAR(6)  NOT NULL,
    year       SMALLINT    NOT NULL,
    sec_no     CHAR(2)     NOT NULL,
    days       VARCHAR(5),
    start_time TIME,
    end_time   TIME,
    capacity   SMALLINT    NOT NULL,
    iid        INT         NOT NULL,
    building   VARCHAR(20),
    room_no    VARCHAR(10),
    CONSTRAINT pk_section PRIMARY KEY (cno, semester, year, sec_no),
    CONSTRAINT chk_section_semester CHECK (semester IN ('Spring', 'Summer', 'Fall')),
    CONSTRAINT chk_section_year CHECK (year BETWEEN 2000 AND 2100),
    CONSTRAINT chk_section_capacity CHECK (capacity BETWEEN 1 AND 500),
    CONSTRAINT chk_section_times CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time),
    CONSTRAINT fk_section_course FOREIGN KEY (cno) REFERENCES course (cno)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_section_instructor FOREIGN KEY (iid) REFERENCES instructor (iid)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_section_classroom FOREIGN KEY (building, room_no) REFERENCES classroom (building, room_no)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE grade_scale (
    grade         VARCHAR(2)   NOT NULL,
    points        DECIMAL(2,1),
    counts_in_gpa BOOLEAN      NOT NULL,
    is_passing    BOOLEAN      NOT NULL,
    CONSTRAINT pk_grade_scale PRIMARY KEY (grade),
    CONSTRAINT chk_grade_points CHECK (points IS NULL OR points BETWEEN 0 AND 4)
);

CREATE TABLE enrollment (
    sid      INT         NOT NULL,
    cno      VARCHAR(10) NOT NULL,
    semester VARCHAR(6)  NOT NULL,
    year     SMALLINT    NOT NULL,
    sec_no   CHAR(2)     NOT NULL,
    reg_date DATE        NOT NULL,
    status   VARCHAR(10) NOT NULL DEFAULT 'Enrolled',
    grade    VARCHAR(2),
    CONSTRAINT pk_enrollment PRIMARY KEY (sid, cno, semester, year, sec_no),
    CONSTRAINT chk_enrollment_status CHECK (status IN ('Enrolled', 'Waitlisted', 'Dropped')),
    CONSTRAINT fk_enrollment_grade FOREIGN KEY (grade) REFERENCES grade_scale (grade),
    CONSTRAINT fk_enrollment_student FOREIGN KEY (sid) REFERENCES student (sid)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_section FOREIGN KEY (cno, semester, year, sec_no) REFERENCES section (cno, semester, year, sec_no)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_student_name ON student (lname, fname);
CREATE INDEX idx_section_term ON section (year, semester);
CREATE INDEX idx_enrollment_section ON enrollment (cno, semester, year, sec_no, status);
