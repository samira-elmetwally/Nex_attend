CREATE DATABASE IF NOT EXISTS qr_attendance_system;
USE qr_attendance_system;

CREATE TABLE IF NOT EXISTS Department (
  department_id INT PRIMARY KEY AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(150) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Instructor (
  instructor_id INT PRIMARY KEY,
  department_id INT NOT NULL,
  CONSTRAINT fk_instructor_user FOREIGN KEY (instructor_id) REFERENCES Users(user_id),
  CONSTRAINT fk_instructor_department FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

CREATE TABLE IF NOT EXISTS Student (
  student_id INT PRIMARY KEY,
  department_id INT NOT NULL,
  Level INT,
  CONSTRAINT fk_student_user FOREIGN KEY (student_id) REFERENCES Users(user_id),
  CONSTRAINT fk_student_department FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

CREATE TABLE IF NOT EXISTS Course (
  course_id INT PRIMARY KEY AUTO_INCREMENT,
  course_name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  instructor_id INT NOT NULL,
  content_path VARCHAR(255) NULL,
  CONSTRAINT fk_course_department FOREIGN KEY (department_id) REFERENCES Department(department_id),
  CONSTRAINT fk_course_instructor FOREIGN KEY (instructor_id) REFERENCES Instructor(instructor_id)
);

CREATE TABLE IF NOT EXISTS Session (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  session_date DATETIME NOT NULL,
  QR_Token VARCHAR(255) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  CONSTRAINT fk_session_course FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

CREATE TABLE IF NOT EXISTS Attendance (
  Attendance_ID INT PRIMARY KEY AUTO_INCREMENT,
  Student_ID INT NOT NULL,
  Session_ID INT NOT NULL,
  Check_in_Time DATETIME DEFAULT CURRENT_TIMESTAMP,
  Status VARCHAR(50),
  CONSTRAINT fk_attendance_student FOREIGN KEY (Student_ID) REFERENCES Student(student_id),
  CONSTRAINT fk_attendance_session FOREIGN KEY (Session_ID) REFERENCES Session(session_id),
  CONSTRAINT uq_attendance UNIQUE (Student_ID, Session_ID)
);

INSERT INTO Department (department_name)
VALUES ('Computer Science'), ('Information Systems');

INSERT INTO Users (Name, Email, Password, Role)
VALUES
  ('Ahmed Ali', 'ahmed@mail.com', '123', 'Student'),
  ('Sara Mohamed', 'sara@mail.com', '123', 'Student'),
  ('Dr Hassan', 'hassan@mail.com', '123', 'Instructor');

INSERT INTO Student (student_id, department_id, Level)
VALUES (1, 1, 2), (2, 1, 3);

INSERT INTO Instructor (instructor_id, department_id)
VALUES (3, 1);

INSERT INTO Course (course_name, department_id, instructor_id)
VALUES ('Database Systems', 1, 3);

INSERT INTO Session (course_id, session_date, QR_Token)
VALUES (1, '2026-04-01 10:00:00', 'QR123');

INSERT INTO Attendance (Student_ID, Session_ID, Status)
VALUES (1, 1, 'Present'), (2, 1, 'Present');

-- Existing database: add course material column if missing
-- ALTER TABLE Course ADD COLUMN content_path VARCHAR(255) NULL AFTER instructor_id;
