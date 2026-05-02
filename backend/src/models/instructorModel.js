const pool = require("../config/db");

async function createInstructorProfile(
  { instructorId, departmentId },
  connection = pool
) {
  await connection.query(
    "INSERT INTO Instructor (instructor_id, department_id) VALUES (?, ?)",
    [instructorId, departmentId]
  );
}

module.exports = {
  createInstructorProfile,
};
