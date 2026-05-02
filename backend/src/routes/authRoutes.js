const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("valid email is required"),
    body("password").notEmpty().withMessage("password is required"),
    validateRequest,
  ],
  authController.login
);

router.get("/me", requireAuth, authController.me);

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("password must be at least 6 characters"),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("role is required")
      .isIn(["Student", "Instructor", "Admin"])
      .withMessage("role must be Student, Instructor, or Admin"),
    body().custom((value, { req }) => {
      const role = req.body.role;
      if (role !== "Student" && role !== "Instructor") {
        return true;
      }
      const raw = req.body.departmentId ?? req.body.department_id;
      if (raw === undefined || raw === null || raw === "") {
        throw new Error(
          "departmentId or department_id is required for Student and Instructor"
        );
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 1) {
        throw new Error("departmentId must be a positive integer");
      }
      return true;
    }),
    body("level")
      .optional({ values: "falsy" })
      .isInt({ min: 1 })
      .withMessage("level must be a positive integer"),
    validateRequest,
  ],
  authController.register
);

module.exports = router;
