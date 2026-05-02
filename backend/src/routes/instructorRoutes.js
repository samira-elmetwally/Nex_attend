const express = require("express");
const instructorController = require("../controllers/instructorController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  requireAuth,
  requireRole("Instructor"),
  instructorController.getDashboard
);

module.exports = router;
