const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, "Please add course code"],
    unique: true,
  },
  courseName: {
    type: String,
    required: [true, "Please add course name"],
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  instructor: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  schedule: {
    day: String,
    time: String,
    room: String,
  },
  capacity: {
    type: Number,
    default: 30,
  },
  enrolled: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
