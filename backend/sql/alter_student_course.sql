-- USE qr_attendance_system;

-- CREATE TABLE IF NOT EXISTS Student_Course (
--   student_id INT NOT NULL,
--   course_id INT NOT NULL,
--   enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (student_id, course_id),
--   CONSTRAINT fk_student_course_student FOREIGN KEY (student_id) REFERENCES Student(student_id),
--   CONSTRAINT fk_student_course_course FOREIGN KEY (course_id) REFERENCES Course(course_id)
-- );
