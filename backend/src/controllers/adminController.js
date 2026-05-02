const pool = require("../config/db");

async function getDashboard(req, res, next) {
  try {
    const [usersResult, coursesResult, sessionsResult, instructorsResult] =
      await Promise.all([
        pool.query(
          "SELECT user_id, Name AS name, Email AS email, Role AS role FROM Users ORDER BY user_id ASC"
        ),
        pool.query(
          "SELECT course_id AS id, course_name AS name, department_id, instructor_id FROM Course ORDER BY course_id ASC"
        ),
        pool.query(
          "SELECT session_id AS id, course_id, session_date AS date, QR_Token AS token, is_active FROM Session ORDER BY session_date DESC"
        ),
        pool.query(
          "SELECT user_id, Name AS name, Email AS email, Role AS role FROM Users WHERE Role = 'Instructor' ORDER BY user_id ASC"
        ),
      ]);

    const users = usersResult[0];
    const courses = coursesResult[0];
    const sessions = sessionsResult[0];
    const instructors = instructorsResult[0];

    const stats = {
      students: users.filter((u) => u.role === "Student").length,
      instructors: instructors.length,
      courses: courses.length,
      sessions: sessions.length,
    };

    return res.status(200).json({
      users,
      courses,
      sessions,
      instructors,
      stats,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboard,
};
