USE QR_Attendance_System;
CREATE TABLE Department (
    department_id INT PRIMARY KEY IDENTITY(1,1),
    department_name NVARCHAR(100) NOT NULL
);
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL
);
CREATE TABLE Instructor (
    instructor_id INT PRIMARY KEY,
    department_id INT NOT NULL,

    FOREIGN KEY (instructor_id)
        REFERENCES Users(user_id),

    FOREIGN KEY (department_id)
        REFERENCES Department(department_id)
);
CREATE TABLE Student (
    student_id INT PRIMARY KEY,
    department_id INT NOT NULL,
    Level INT,

    FOREIGN KEY (student_id)
        REFERENCES Users(user_id),

    FOREIGN KEY (department_id)
        REFERENCES Department(department_id)
);
CREATE TABLE Course (
    course_id INT PRIMARY KEY IDENTITY(1,1),
    course_name NVARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    instructor_id INT NOT NULL,

    FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    FOREIGN KEY (instructor_id)
        REFERENCES Instructor(instructor_id)
);
CREATE TABLE Session (
    session_id INT PRIMARY KEY IDENTITY(1,1),
    course_id INT NOT NULL,
    session_date DATETIME NOT NULL,
    QR_Token NVARCHAR(255) UNIQUE NOT NULL,
    is_active BIT DEFAULT 1,

    FOREIGN KEY (course_id)
        REFERENCES Course(course_id)
);
CREATE TABLE Attendance (
    Attendance_ID INT PRIMARY KEY IDENTITY(1,1),

    Student_ID INT NOT NULL,
    Session_ID INT NOT NULL,

    Check_in_Time DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50),

    FOREIGN KEY (Student_ID)
        REFERENCES Student(student_id),

    FOREIGN KEY (Session_ID)
        REFERENCES Session(session_id),

    CONSTRAINT UQ_Attendance 
        UNIQUE (Student_ID, Session_ID)
);
INSERT INTO Department (department_name)
VALUES
('Computer Science'),
('Information Systems');
INSERT INTO Users (Name, Email, Password, Role)
VALUES
('Ahmed Ali','ahmed@mail.com','123','Student'),
('Sara Mohamed','sara@mail.com','123','Student'),
('Dr Hassan','hassan@mail.com','123','Instructor');
INSERT INTO Student (student_id, department_id, Level)
VALUES
(1,1,2),
(2,1,3);
INSERT INTO Instructor (instructor_id, department_id)
VALUES
(3,1);
INSERT INTO Course 
(course_name, department_id, instructor_id)
VALUES
('Database Systems',1,3);
INSERT INTO Session
(course_id, session_date, QR_Token)
VALUES
(1,'2026-04-01 10:00:00','QR123');
INSERT INTO Attendance
(Student_ID, Session_ID, Status)
VALUES
(1,1,'Present'),
(2,1,'Present');

SELECT
    U.Name,
    C.course_name,
    S.session_date,
    A.Check_in_Time,
    A.Status
FROM Attendance A

JOIN Student ST
ON A.Student_ID = ST.student_id

JOIN Users U
ON ST.student_id = U.user_id

JOIN Session S
ON A.Session_ID = S.session_id

JOIN Course C
ON S.course_id = C.course_id;