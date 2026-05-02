const attendanceModel = require("../models/attendanceModel");
const studentModel = require("../models/studentModel");
const sessionModel = require("../models/sessionModel");

async function markAttendance(req, res, next) {
  const { studentId, sessionId, status } = req.body;

  try {
    const studentExists = await studentModel.studentExists(studentId);
    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const sessionExists = await sessionModel.findSessionById(sessionId);
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found" });
    }

    await attendanceModel.markAttendance({ studentId, sessionId, status });

    return res.status(200).json({
      message: "Attendance saved successfully",
    });
  } catch (error) {
    return next(error);
  }
}

async function getAttendanceBySession(req, res, next) {
  const sessionId = Number(req.params.sessionId);

  try {
    const sessionExists = await sessionModel.findSessionById(sessionId);
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found" });
    }

    const attendance = await attendanceModel.getAttendanceBySession(sessionId);
    return res.status(200).json({
      session_id: sessionId,
      attendance,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAttendanceByStudent(req, res, next) {
  const studentId = Number(req.params.studentId);

  try {
    const studentExists = await studentModel.studentExists(studentId);
    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendance = await attendanceModel.getAttendanceByStudent(studentId);
    return res.status(200).json({ student_id: studentId, attendance });
  } catch (error) {
    return next(error);
  }
}

async function markAttendanceByToken(req, res, next) {
  const { studentId, qrToken } = req.body;

  try {
    const studentExists = await studentModel.studentExists(studentId);
    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const session = await sessionModel.findByToken(qrToken);
    if (!session) {
      return res.status(404).json({ message: "Invalid QR token" });
    }

    if (Number(session.is_active) !== 1) {
      return res.status(400).json({ message: "This session is closed" });
    }

    await attendanceModel.markAttendance({
      studentId,
      sessionId: session.session_id,
      status: "Present",
    });

    return res.status(200).json({
      message: "Attendance saved successfully",
      session_id: session.session_id,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  markAttendance,
  getAttendanceBySession,
  getAttendanceByStudent,
  markAttendanceByToken,
};
