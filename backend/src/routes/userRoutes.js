const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/userController");
const validateRequest = require("../middleware/validateRequest");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, userController.listUsers);

router.post(
  "/",
  requireAuth,
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email is required"),
    body("role")
      .isIn(["Student", "Instructor", "Admin"])
      .withMessage("role must be Student, Instructor, or Admin"),
    body().custom((value, { req }) => {
      const role = req.body.role;
      if (role !== "Student" && role !== "Instructor") {
        return true;
      }
      const raw = req.body.departmentId ?? req.body.department_id;
      if (raw === undefined || raw === null || raw === "") {
        throw new Error("departmentId or department_id is required for Student and Instructor");
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
      .withMessage("level must be positive integer"),
    validateRequest,
  ],
  userController.createUser
);

router.put(
  "/:userId",
  requireAuth,
  [
    param("userId").isInt({ min: 1 }).withMessage("valid userId is required"),
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email is required"),
    validateRequest,
  ],
  userController.updateUser
);

router.delete(
  "/:id",
  requireAuth,
  [param("id").isInt({ min: 1 }).withMessage("valid user id is required"), validateRequest],
  userController.deleteUser
);

module.exports = router;
