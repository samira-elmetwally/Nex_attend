const pool = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.query(
    "SELECT user_id, Name, Email, Password, Role FROM `Users` WHERE Email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
}

async function createUser({ name, email, password, role }, connection = pool) {
  const [result] = await connection.query(
    "INSERT INTO `Users` (Name, Email, Password, Role) VALUES (?, ?, ?, ?)",
    [name, email, password, role]
  );

  return result.insertId;
}

async function findById(userId) {
  const [rows] = await pool.query(
    `SELECT
      U.user_id,
      U.Name AS name,
      U.Email AS email,
      U.Role AS role,
      COALESCE(ST.department_id, INS.department_id) AS department_id,
      ST.Level AS level
    FROM Users U
    LEFT JOIN Student ST ON ST.student_id = U.user_id
    LEFT JOIN Instructor INS ON INS.instructor_id = U.user_id
    WHERE U.user_id = ?
    LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function getAllUsers() {
  const [rows] = await pool.query(
    `SELECT
      U.user_id,
      U.Name AS name,
      U.Email AS email,
      U.Role AS role,
      COALESCE(ST.department_id, INS.department_id) AS department_id,
      ST.Level AS level
    FROM Users U
    LEFT JOIN Student ST ON ST.student_id = U.user_id
    LEFT JOIN Instructor INS ON INS.instructor_id = U.user_id
    ORDER BY U.user_id ASC`
  );

  return rows;
}

async function updateUser(userId, { name, email }) {
  await pool.query("UPDATE Users SET Name = ?, Email = ? WHERE user_id = ?", [
    name,
    email,
    userId,
  ]);
}

module.exports = {
  findByEmail,
  createUser,
  findById,
  getAllUsers,
  updateUser,
};
