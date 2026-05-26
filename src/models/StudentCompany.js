const mongoose = require("mongoose");

const studentCompanySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: [
      "applied",
      "shortlisted",
      "selected",
      "rejected",
      "offered",
      "accepted",
      "declined",
    ],
    default: "applied",
  },
  roundCleared: {
    type: String,
    enum: ["application", "aptitude", "technical", "hr", "final"],
    default: "application",
  },
  remarks: String,
  offerLetter: {
    issued: { type: Boolean, default: false },
    issueDate: Date,
    joiningDate: Date,
    package: String,
    location: String,
  },
});

module.exports = mongoose.model("StudentCompany", studentCompanySchema);
