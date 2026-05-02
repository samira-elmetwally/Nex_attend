const pool = require("../config/db");

async function getAllStudents() {
  const [rows] = await pool.query(
    `SELECT 
      S.student_id,
      U.Name AS name,
      U.Email AS email,
      U.Role AS role,
      S.department_id,
      D.department_name,
      S.Level AS level
    FROM Student S
    INNER JOIN Users U ON U.user_id = S.student_id
    INNER JOIN Department D ON D.department_id = S.department_id
    ORDER BY U.Name ASC`
  );

  return rows;
}

async function createStudentProfile(
  { studentId, departmentId, level },
  connection = pool
) {
  await connection.query(
    "INSERT INTO Student (student_id, department_id, Level) VALUES (?, ?, ?)",
    [studentId, departmentId, level]
  );
}

async function studentExists(studentId) {
  const [rows] = await pool.query(
    "SELECT student_id FROM Student WHERE student_id = ? LIMIT 1",
    [studentId]
  );

  return rows.length > 0;
}

module.exports = {
  getAllStudents,
  createStudentProfile,
  studentExists,
};
