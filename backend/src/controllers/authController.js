const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const userModel = require("../models/userModel");
const studentModel = require("../models/studentModel");
const instructorModel = require("../models/instructorModel");

function parseDepartmentId(body) {
  const raw = body.departmentId ?? body.department_id;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function register(req, res, next) {
  const { name, email, password, level } = req.body;
  const role = req.body.role;

  if (typeof role !== "string" || !role.trim()) {
    return res.status(400).json({ message: "role is required" });
  }

  const roleTrimmed = role.trim();
  const departmentId = parseDepartmentId(req.body);

  try {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    if (roleTrimmed === "Student" || roleTrimmed === "Instructor") {
      if (!departmentId) {
        return res.status(400).json({
          message: "departmentId is required for Student and Instructor registration",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const userId = await userModel.createUser(
        {
          name,
          email,
          password: hashedPassword,
          role: roleTrimmed,
        },
        connection
      );

      if (roleTrimmed === "Student") {
        await studentModel.createStudentProfile(
          {
            studentId: userId,
            departmentId,
            level: level ?? null,
          },
          connection
        );
      } else if (roleTrimmed === "Instructor") {
        await instructorModel.createInstructorProfile(
          {
            instructorId: userId,
            departmentId,
          },
          connection
        );
      } else if (roleTrimmed === "Admin") {
        // Users row only; no Instructor/Student profile row in schema
      } else {
        await connection.rollback();
        return res.status(400).json({ message: "Unsupported role" });
      }

      await connection.commit();

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          user_id: userId,
          name,
          email,
          role: roleTrimmed,
        },
      });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.Password);
    if (!passwordMatches && password !== user.Password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const profile = await userModel.findById(user.user_id);
    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.Role,
      },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: profile,
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const profile = await userModel.findById(req.user.userId);
    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user: profile });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  me,
};
