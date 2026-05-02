const pool = require("../config/db");

async function markAttendance({ studentId, sessionId, status }) {
  const [result] = await pool.query(
    `INSERT INTO Attendance (Student_ID, Session_ID, Status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
        Status = VALUES(Status),
        Check_in_Time = CURRENT_TIMESTAMP`,
    [studentId, sessionId, status]
  );

  return result;
}

async function getAttendanceBySession(sessionId) {
  const [rows] = await pool.query(
    `SELECT
      A.Attendance_ID AS attendance_id,
      A.Student_ID AS student_id,
      U.Name AS student_name,
      U.Email AS student_email,
      A.Session_ID AS session_id,
      A.Check_in_Time AS check_in_time,
      A.Status AS status
    FROM Attendance A
    INNER JOIN Student ST ON ST.student_id = A.Student_ID
    INNER JOIN Users U ON U.user_id = ST.student_id
    WHERE A.Session_ID = ?
    ORDER BY A.Check_in_Time ASC`,
    [sessionId]
  );

  return rows;
}

async function getAttendanceByStudent(studentId) {
  const [rows] = await pool.query(
    `SELECT
      A.Attendance_ID AS attendance_id,
      A.Student_ID AS student_id,
      A.Session_ID AS session_id,
      A.Check_in_Time AS check_in_time,
      A.Status AS status
    FROM Attendance A
    WHERE A.Student_ID = ?
    ORDER BY A.Check_in_Time DESC`,
    [studentId]
  );
  return rows;
}

module.exports = {
  markAttendance,
  getAttendanceBySession,
  getAttendanceByStudent,
};
