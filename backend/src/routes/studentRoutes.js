const express = require("express");
const studentController = require("../controllers/studentController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, studentController.getAllStudents);

module.exports = router;
