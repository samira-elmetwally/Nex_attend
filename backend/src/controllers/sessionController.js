const crypto = require("crypto");
const sessionModel = require("../models/sessionModel");
const courseModel = require("../models/courseModel");
const attendanceModel = require("../models/attendanceModel");
const studentModel = require("../models/studentModel");

function generateQrToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function createSession(req, res, next) {
  const courseId = Number(req.body.courseId ?? req.body.course_id);
  const sessionDateRaw = req.body.sessionDate ?? req.body.session_date;
  const sessionDate = sessionDateRaw
    ? new Date(sessionDateRaw).toISOString().slice(0, 19).replace("T", " ")
    : new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    if (!Number.isFinite(courseId) || courseId < 1) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const exists = await courseModel.courseExists(courseId);
    if (!exists) {
      return res.status(404).json({ message: "Course not found" });
    }

    const ownerId = await courseModel.getInstructorIdForCourse(courseId);
    if (ownerId !== req.user.userId) {
      return res.status(403).json({ message: "You can only create sessions for your own courses" });
    }

    let qrToken = generateQrToken();
    let sessionId;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        sessionId = await sessionModel.createSession({
          courseId,
          sessionDate,
          qrToken,
          isActive: 1,
        });
        break;
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          qrToken = generateQrToken();
          continue;
        }
        throw error;
      }
    }

    if (!sessionId) {
      return res.status(500).json({ message: "Could not allocate a unique session token" });
    }

    return res.status(201).json({
      message: "Session created successfully",
      session: {
        id: sessionId,
        session_id: sessionId,
        course_id: courseId,
        session_date: sessionDate,
        qr_token: qrToken,
        is_active: 1,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listSessions(req, res, next) {
  try {
    const sessions = await sessionModel.getAllSessions();
    return res.status(200).json({ sessions });
  } catch (error) {
    return next(error);
  }
}

async function closeSession(req, res, next) {
  const sessionId = Number(req.params.sessionId);

  try {
    const existing = await sessionModel.findSessionById(sessionId);
    if (!existing) {
      return res.status(404).json({ message: "Session not found" });
    }

    const ownerId = await courseModel.getInstructorIdForCourse(existing.course_id);
    if (ownerId !== req.user.userId) {
      return res.status(403).json({ message: "You can only close sessions for your own courses" });
    }

    await sessionModel.closeSession(sessionId);
    return res.status(200).json({ message: "Session closed successfully" });
  } catch (error) {
    return next(error);
  }
}

async function verifyToken(req, res, next) {
  const { token } = req.body;
  const studentId = Number(req.body.studentId);

  try {
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "token is required" });
    }
    if (!Number.isFinite(studentId) || studentId < 1) {
      return res.status(400).json({ message: "studentId must be a positive integer" });
    }

    if (Number(req.user.userId) !== studentId) {
      return res.status(403).json({ message: "You can only verify attendance for your own account" });
    }

    const studentExists = await studentModel.studentExists(studentId);
    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const session = await sessionModel.findByToken(token.trim());
    const active = session && Number(session.is_active) === 1;
    if (!session || !active) {
      return res.status(400).json({ message: "Invalid or inactive token" });
    }

    await attendanceModel.markAttendance({
      studentId,
      sessionId: session.session_id,
      status: "Present",
    });

    return res.status(200).json({
      message: "Token verified successfully",
      session: {
        session_id: session.session_id,
        course_id: session.course_id,
        session_date: session.session_date,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSession,
  listSessions,
  closeSession,
  verifyToken,
};
