const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const sessionRoutes = require("./src/routes/sessionRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const userRoutes = require("./src/routes/userRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const instructorRoutes = require("./src/routes/instructorRoutes");
const { notFoundHandler, errorHandler } = require("./src/middleware/errorHandler");
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = Number(process.env.PORT) || 3111;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({"message":"this server is working on port: 3111"})
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
  console.log('view databast =>',`http://localhost/phpmyadmin`);

  // console.log('http://127.0.0.1:5500/frontend/index.html')
});
