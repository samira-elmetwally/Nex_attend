const express = require("express");
const { body, param } = require("express-validator");
const attendanceController = require("../controllers/attendanceController");
const validateRequest = require("../middleware/validateRequest");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/mark",
  requireAuth,
  [
    body("studentId").isInt({ min: 1 }).withMessage("studentId is required"),
    body("sessionId").isInt({ min: 1 }).withMessage("sessionId is required"),
    body("status")
      .trim()
      .notEmpty()
      .withMessage("status is required (example: Present or Absent)"),
    validateRequest,
  ],
  attendanceController.markAttendance
);

router.post(
  "/mark-by-token",
  requireAuth,
  [
    body("studentId").isInt({ min: 1 }).withMessage("studentId is required"),
    body("qrToken").trim().notEmpty().withMessage("qrToken is required"),
    validateRequest,
  ],
  attendanceController.markAttendanceByToken
);

router.get(
  "/session/:sessionId",
  requireAuth,
  [
    param("sessionId")
      .isInt({ min: 1 })
      .withMessage("sessionId must be a positive integer"),
    validateRequest,
  ],
  attendanceController.getAttendanceBySession
);

router.get(
  "/student/:studentId",
  requireAuth,
  [
    param("studentId")
      .isInt({ min: 1 })
      .withMessage("studentId must be a positive integer"),
    validateRequest,
  ],
  attendanceController.getAttendanceByStudent
);

module.exports = router;
