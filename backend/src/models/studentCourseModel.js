const pool = require("../config/db");

/**
 * @param {{ studentId: number, courseId: number }} param0
 * @param {import("mysql2/promise").Pool|import("mysql2/promise").PoolConnection} [connection]
 * @returns {Promise<"inserted" | "duplicate">}
 */
async function enrollInCourse({ studentId, courseId }, connection = pool) {
  const [result] = await connection.query(
    `INSERT IGNORE INTO Student_Course (student_id, course_id) VALUES (?, ?)`,
    [studentId, courseId]
  );
  if (result.affectedRows > 0) {
    return "inserted";
  }
  return "duplicate";
}

async function getEnrolledCoursesForStudent(studentId) {
  const [rows] = await pool.query(
    `SELECT
      C.course_id AS id,
      C.course_name AS name,
      C.department_id,
      C.instructor_id,
      C.content_path,
      U.Name AS instructor_name,
      SC.enrolled_at
    FROM Student_Course SC
    INNER JOIN Course C ON C.course_id = SC.course_id
    LEFT JOIN Users U ON U.user_id = C.instructor_id
    WHERE SC.student_id = ?
    ORDER BY SC.enrolled_at DESC, C.course_id ASC`,
    [studentId]
  );
  return rows;
}

module.exports = {
  enrollInCourse,
  getEnrolledCoursesForStudent,
};
