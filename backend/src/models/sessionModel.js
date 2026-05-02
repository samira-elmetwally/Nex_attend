const pool = require("../config/db");

async function createSession({ courseId, sessionDate, qrToken, isActive = 1 }) {
  const [result] = await pool.query(
    "INSERT INTO Session (course_id, session_date, QR_Token, is_active) VALUES (?, ?, ?, ?)",
    [courseId, sessionDate, qrToken, isActive]
  );

  return result.insertId;
}

async function findSessionById(sessionId) {
  const [rows] = await pool.query(
    "SELECT session_id, course_id, session_date, QR_Token, is_active FROM `Session` WHERE session_id = ? LIMIT 1",
    [sessionId]
  );

  return rows[0] || null;
}

async function findByToken(qrToken) {
  const [rows] = await pool.query(
    "SELECT session_id, course_id, session_date, QR_Token, is_active FROM `Session` WHERE QR_Token = ? LIMIT 1",
    [qrToken]
  );
  return rows[0] || null;
}

async function getAllSessions() {
  const [rows] = await pool.query(
    `SELECT
      S.session_id AS id,
      S.course_id,
      S.session_date AS date,
      S.QR_Token AS token,
      S.is_active
    FROM Session S
    ORDER BY S.session_date DESC`
  );
  return rows;
}

async function closeSession(sessionId) {
  await pool.query("UPDATE Session SET is_active = 0 WHERE session_id = ?", [
    sessionId,
  ]);
}

module.exports = {
  createSession,
  findSessionById,
  findByToken,
  getAllSessions,
  closeSession,
};
