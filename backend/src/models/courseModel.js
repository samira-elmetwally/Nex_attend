const pool = require("../config/db");

async function createCourse({ courseName, departmentId, instructorId, contentPath }) {
  const [result] = await pool.query(
    "INSERT INTO Course (course_name, department_id, instructor_id, content_path) VALUES (?, ?, ?, ?)",
    [courseName, departmentId, instructorId, contentPath]
  );

  return result.insertId;
}

async function courseExists(courseId) {
  const [rows] = await pool.query(
    "SELECT course_id FROM Course WHERE course_id = ? LIMIT 1",
    [courseId]
  );

  return rows.length > 0;
}

async function getCourseById(courseId) {
  const [rows] = await pool.query(
    `SELECT
      C.course_id AS id,
      C.course_name AS name,
      C.department_id,
      C.instructor_id,
      C.content_path,
      U.Name AS instructor_name
    FROM Course C
    LEFT JOIN Users U ON U.user_id = C.instructor_id
    WHERE C.course_id = ?
    LIMIT 1`,
    [courseId]
  );

  return rows[0] || null;
}

async function getInstructorIdForCourse(courseId) {
  const course = await getCourseById(courseId);
  return course ? course.instructor_id : null;
}

module.exports = {
  createCourse,
  courseExists,
  getCourseById,
  getInstructorIdForCourse,
};
