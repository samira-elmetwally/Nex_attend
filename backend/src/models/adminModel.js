const pool = require("../config/db");
const userModel = require("./userModel");
const studentModel = require("./studentModel");
const instructorModel = require("./instructorModel");

async function createManagedUser({ name, email, password, role, departmentId, level }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = await userModel.createUser(
      { name, email, password, role },
      connection
    );

    if (role === "Student") {
      await studentModel.createStudentProfile(
        {
          studentId: userId,
          departmentId,
          level: level ?? null,
        },
        connection
      );
    } else if (role === "Instructor") {
      await instructorModel.createInstructorProfile(
        {
          instructorId: userId,
          departmentId,
        },
        connection
      );
    }

    await connection.commit();
    return userId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteUser(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1) If this user is an instructor, remove data that depends on their courses first.
    // Session -> Course and Attendance -> Session are foreign key chains.
    const [instructorCourses] = await connection.query(
      "SELECT course_id FROM Course WHERE instructor_id = ?",
      [userId]
    );

    if (instructorCourses.length > 0) {
      const courseIds = instructorCourses.map((course) => course.course_id);
      const placeholders = courseIds.map(() => "?").join(",");

      await connection.query(
        `DELETE FROM Student_Course WHERE course_id IN (${placeholders})`,
        courseIds
      );

      // Delete attendance linked to sessions of instructor courses.
      await connection.query(
        `DELETE A FROM Attendance A
         INNER JOIN Session S ON S.session_id = A.Session_ID
         WHERE S.course_id IN (${placeholders})`,
        courseIds
      );

      // Delete sessions before deleting courses (Session references Course).
      await connection.query(
        `DELETE FROM Session WHERE course_id IN (${placeholders})`,
        courseIds
      );

      // Required by your requested order: delete courses for this instructor first.
      await connection.query(
        `DELETE FROM Course WHERE course_id IN (${placeholders})`,
        courseIds
      );
    }

    // 2) Delete from Instructor table (if exists).
    await connection.query("DELETE FROM Instructor WHERE instructor_id = ?", [userId]);

    // 3) Delete enrollments, student attendance, then Student row (if exists).
    await connection.query("DELETE FROM Student_Course WHERE student_id = ?", [userId]);
    await connection.query("DELETE FROM Attendance WHERE Student_ID = ?", [userId]);
    await connection.query("DELETE FROM Student WHERE student_id = ?", [userId]);

    // 4) Finally, delete from Users.
    const [result] = await connection.query(
      "DELETE FROM Users WHERE user_id = ?",
      [userId]
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createManagedUser,
  deleteUser,
};
