const mongoose = require("mongoose");

const interviewScheduleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  round: {
    type: String,
    enum: ["aptitude", "technical", "hr", "managerial", "final"],
    required: true,
  },
  interviewDate: {
    type: Date,
    required: true,
  },
  interviewTime: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["online", "offline", "hybrid"],
    default: "offline",
  },
  meetingLink: String,
  interviewer: {
    name: String,
    designation: String,
    email: String,
  },
  duration: {
    type: Number,
    default: 30, // minutes
  },
  instructions: String,
  status: {
    type: String,
    enum: ["scheduled", "ongoing", "completed", "cancelled"],
    default: "scheduled",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InterviewSchedule", interviewScheduleSchema);
