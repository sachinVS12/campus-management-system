const InterviewSchedule = require("../models/InterviewSchedule");
const Company = require("../models/Company");
const User = require("../models/User");

// @desc    Create interview schedule
// @route   POST /api/manager/interviews
// @access  Private/Manager
const createInterviewSchedule = async (req, res) => {
  try {
    const {
      company,
      students,
      round,
      interviewDate,
      interviewTime,
      venue,
      mode,
      meetingLink,
      interviewer,
      duration,
      instructions,
    } = req.body;

    // Verify company exists
    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Verify students exist
    const studentRecords = await User.find({
      _id: { $in: students },
      role: "user",
    });
    if (studentRecords.length !== students.length) {
      return res.status(400).json({ message: "Some students not found" });
    }

    const interview = await InterviewSchedule.create({
      company,
      students,
      round,
      interviewDate,
      interviewTime,
      venue,
      mode,
      meetingLink,
      interviewer,
      duration,
      instructions,
      createdBy: req.user._id,
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all interviews
// @route   GET /api/manager/interviews
// @access  Private/Manager
const getAllInterviews = async (req, res) => {
  try {
    const interviews = await InterviewSchedule.find()
      .populate("company", "companyName")
      .populate("students", "name email studentId")
      .populate("createdBy", "name")
      .sort("-interviewDate");
    res.json(interviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update interview schedule
// @route   PUT /api/manager/interviews/:id
// @access  Private/Manager
const updateInterviewSchedule = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json(interview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel interview
// @route   PUT /api/manager/interviews/:id/cancel
// @access  Private/Manager
const cancelInterview = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.status = "cancelled";
    await interview.save();

    res.json({ message: "Interview cancelled successfully", interview });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add students to interview
// @route   POST /api/manager/interviews/:id/students
// @access  Private/Manager
const addStudentsToInterview = async (req, res) => {
  try {
    const { students } = req.body;
    const interview = await InterviewSchedule.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const existingStudents = new Set(
      interview.students.map((s) => s.toString()),
    );
    const newStudents = students.filter((s) => !existingStudents.has(s));

    interview.students.push(...newStudents);
    await interview.save();

    res.json({ message: "Students added successfully", interview });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove student from interview
// @route   DELETE /api/manager/interviews/:id/students/:studentId
// @access  Private/Manager
const removeStudentFromInterview = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.students = interview.students.filter(
      (s) => s.toString() !== req.params.studentId,
    );
    await interview.save();

    res.json({ message: "Student removed successfully", interview });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark interview as completed
// @route   PUT /api/manager/interviews/:id/complete
// @access  Private/Manager
const completeInterview = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.status = "completed";
    await interview.save();

    res.json({ message: "Interview marked as completed", interview });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createInterviewSchedule,
  getAllInterviews,
  updateInterviewSchedule,
  cancelInterview,
  addStudentsToInterview,
  removeStudentFromInterview,
  completeInterview,
};
