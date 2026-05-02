const express = require("express");
const { body, param } = require("express-validator");
const sessionController = require("../controllers/sessionController");
const validateRequest = require("../middleware/validateRequest");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("Instructor"),
  [
    body().custom((value, { req }) => {
      const id = req.body.courseId ?? req.body.course_id;
      if (id === undefined || id === null || id === "") {
        throw new Error("courseId or course_id is required");
      }
      const n = Number(id);
      if (!Number.isFinite(n) || n < 1) {
        throw new Error("courseId must be a positive integer");
      }
      return true;
    }),
    body("sessionDate").optional().isISO8601().withMessage("sessionDate must be a valid date"),
    body("session_date").optional().isISO8601().withMessage("session_date must be a valid date"),
    validateRequest,
  ],
  sessionController.createSession
);

router.get("/", requireAuth, sessionController.listSessions);

router.post(
  "/verify-token",
  requireAuth,
  requireRole("Student"),
  [
    body("token").trim().notEmpty().withMessage("token is required"),
    body("studentId")
      .isInt({ min: 1 })
      .withMessage("studentId must be a positive integer"),
    validateRequest,
  ],
  sessionController.verifyToken
);

router.patch(
  "/:sessionId/close",
  requireAuth,
  requireRole("Instructor"),
  [
    param("sessionId")
      .isInt({ min: 1 })
      .withMessage("sessionId must be a positive integer"),
    validateRequest,
  ],
  sessionController.closeSession
);

module.exports = router;
