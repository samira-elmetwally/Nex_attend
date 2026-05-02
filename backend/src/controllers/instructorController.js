const instructorDashboardModel = require("../models/instructorDashboardModel");

async function getDashboard(req, res, next) {
  try {
    const instructorId = req.user.userId;
    const stats = await instructorDashboardModel.getInstructorDashboardStats(
      instructorId
    );

    return res.status(200).json({
      totalCourses: Number(stats?.totalCourses || 0),
      totalStudents: Number(stats?.totalStudents || 0),
      sessionsToday: Number(stats?.sessionsToday || 0),
      avgAttendance: Number(Number(stats?.avgAttendance || 0).toFixed(2)),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboard,
};
