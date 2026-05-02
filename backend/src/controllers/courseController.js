const path = require("path");
const fs = require("fs");
const courseViewModel = require("../models/courseViewModel");
const courseModel = require("../models/courseModel");

async function listCourses(req, res, next) {
  try {
    const courses = await courseViewModel.getAllCourses();
    return res.status(200).json({ courses });
  } catch (error) {
    return next(error);
  }
}

async function createCourse(req, res, next) {
  const courseName = (req.body.course_name || req.body.courseName || "").trim();
  const departmentId = Number(req.body.department_id || req.body.departmentId);
  const instructorId = Number(req.user?.userId);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "A course file (.zip, .pdf, or .docx) is required" });
    }

    if (!courseName || !Number.isFinite(departmentId) || departmentId < 1) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        message: "course_name and department_id are required",
      });
    }

    const contentPath = path
      .join("uploads", "courses", req.file.filename)
      .replace(/\\/g, "/");

    const createdId = await courseModel.createCourse({
      courseName,
      departmentId,
      instructorId,
      contentPath,
    });

    return res.status(201).json({
      message: "Course created successfully",
      courseId: createdId,
      content_path: contentPath,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Instructor profile or department is invalid" });
    }
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message:
          "Database is missing content_path on Course. Run: ALTER TABLE Course ADD COLUMN content_path VARCHAR(255) NULL;",
      });
    }
    return next(error);
  }
}

async function downloadCourse(req, res, next) {
  const courseId = Number(req.params.id);

  try {
    if (!Number.isFinite(courseId) || courseId < 1) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await courseModel.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!course.content_path) {
      return res.status(404).json({ message: "This course has no uploaded file" });
    }

    const absPath = path.join(__dirname, "../..", course.content_path);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: "File is missing on server" });
    }

    const downloadName = path.basename(absPath);
    return res.download(absPath, downloadName, (err) => {
      if (err) {
        return next(err);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCourses,
  createCourse,
  downloadCourse,
};
