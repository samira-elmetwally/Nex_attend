const pool = require("../config/db");

async function getAllCourses() {
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
    ORDER BY C.course_id ASC`
  );

  return rows;
}

module.exports = {
  getAllCourses,
};
