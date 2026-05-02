const express = require("express");
const { body } = require("express-validator");
const courseController = require("../controllers/courseController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { uploadCourseFile } = require("../middleware/uploadCourseMaterial");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

function handleUpload(req, res, next) {
  uploadCourseFile(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "File upload failed" });
    }
    return next();
  });
}

router.post(
  "/enroll",
  requireAuth,
  requireRole("Student"),
  [
    body("courseId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("courseId must be a positive integer"),
    body("course_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("course_id must be a positive integer"),
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
    validateRequest,
  ],
  courseController.enrollInCourse
);

router.get(
  "/saved-courses",
  requireAuth,
  requireRole("Student"),
  courseController.listSavedCoursesForStudent
);

router.get("/", requireAuth, courseController.listCourses);
router.get("/:id/download", requireAuth, courseController.downloadCourse);
router.post(
  "/",
  requireAuth,
  requireRole("Instructor"),
  handleUpload,
  courseController.createCourse
);

module.exports = router;
