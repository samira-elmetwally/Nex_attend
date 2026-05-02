const pool = require("../config/db");

async function getInstructorDashboardStats(instructorId) {
  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*)
       FROM Course C
       WHERE C.instructor_id = ?) AS totalCourses,
      (SELECT COUNT(DISTINCT A.Student_ID)
       FROM Attendance A
       INNER JOIN Session S ON S.session_id = A.Session_ID
       INNER JOIN Course C2 ON C2.course_id = S.course_id
       WHERE C2.instructor_id = ?) AS totalStudents,
      (SELECT COUNT(*)
       FROM Session S2
       INNER JOIN Course C3 ON C3.course_id = S2.course_id
       WHERE C3.instructor_id = ?
         AND DATE(S2.session_date) = CURDATE()) AS sessionsToday,
      (SELECT COALESCE(AVG(session_attendance.student_count), 0)
       FROM (
         SELECT S3.session_id, COUNT(DISTINCT A2.Student_ID) AS student_count
         FROM Session S3
         INNER JOIN Course C4 ON C4.course_id = S3.course_id
         LEFT JOIN Attendance A2 ON A2.Session_ID = S3.session_id
         WHERE C4.instructor_id = ?
         GROUP BY S3.session_id
       ) AS session_attendance) AS avgAttendance`,
    [instructorId, instructorId, instructorId, instructorId]
  );

  return rows[0] || null;
}

module.exports = {
  getInstructorDashboardStats,
};
