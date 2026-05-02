const studentModel = require("../models/studentModel");

async function getAllStudents(req, res, next) {
  try {
    const students = await studentModel.getAllStudents();
    return res.status(200).json({ students });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllStudents,
};
