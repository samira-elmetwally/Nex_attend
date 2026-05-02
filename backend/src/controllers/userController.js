const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const adminModel = require("../models/adminModel");

async function listUsers(req, res, next) {
  try {
    const users = await userModel.getAllUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  const { name, email, password, role, level } = req.body;
  const departmentId = Number(req.body.departmentId ?? req.body.department_id);

  try {
    if (
      (role === "Student" || role === "Instructor") &&
      (!Number.isFinite(departmentId) || departmentId < 1)
    ) {
      return res.status(400).json({
        message: "departmentId is required for Student and Instructor",
      });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password || "123456", 10);
    const userId = await adminModel.createManagedUser({
      name,
      email,
      password: hashedPassword,
      role,
      departmentId: role === "Admin" ? undefined : departmentId,
      level,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: await userModel.findById(userId),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  const userId = Number(req.params.userId);
  const { name, email } = req.body;

  try {
    const existing = await userModel.findById(userId);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }
    await userModel.updateUser(userId, { name, email });
    return res.status(200).json({
      message: "User updated successfully",
      user: await userModel.findById(userId),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  const userId = Number(req.params.id || req.params.userId);
  try {
    const existing = await userModel.findById(userId);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }
    const deleted = await adminModel.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Cannot delete this user because related records still reference it",
      });
    }
    return next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
