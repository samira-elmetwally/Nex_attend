const express = require("express");
const courseController = require("../controllers/courseController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { uploadCourseFile } = require("../middleware/uploadCourseMaterial");

const router = express.Router();

function handleUpload(req, res, next) {
  uploadCourseFile(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "File upload failed" });
    }
    return next();
  });
}

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
