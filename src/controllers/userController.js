const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");

// @desc    Get user dashboard
// @route   GET /api/user/dashboard
// @access  Private/User
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get enrolled courses
    const enrollments = await Enrollment.find({ user: userId })
      .populate("course")
      .sort("-enrollmentDate");

    // Get available courses (not enrolled)
    const enrolledCourseIds = enrollments.map((e) => e.course._id);
    const availableCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
    });

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        studentId: req.user.studentId,
        department: req.user.department,
        semester: req.user.semester,
      },
      enrolledCourses: enrollments,
      availableCourses,
      totalEnrolled: enrollments.length,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Enroll in course
// @route   POST /api/user/enroll/:courseId
// @access  Private/User
const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.enrolled >= course.capacity) {
      return res.status(400).json({ message: "Course is full" });
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: course._id,
    });

    course.enrolled += 1;
    await course.save();

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Drop course
// @route   DELETE /api/user/drop/:enrollmentId
// @access  Private/User
const dropCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const course = await Course.findById(enrollment.course);
    course.enrolled -= 1;
    await course.save();

    await enrollment.deleteOne();

    res.json({ message: "Course dropped successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.department = req.body.department || user.department;
    user.semester = req.body.semester || user.semester;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      department: updatedUser.department,
      semester: updatedUser.semester,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getUserDashboard,
  enrollCourse,
  dropCourse,
  getUserProfile,
  updateUserProfile,
};
