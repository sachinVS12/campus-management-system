const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// @desc    Get manager dashboard
// @route   GET /api/manager/dashboard
// @access  Private/Manager
const getManagerDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "user" });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    const recentEnrollments = await Enrollment.find()
      .populate("user", "name email")
      .populate("course", "courseName courseCode")
      .sort("-enrollmentDate")
      .limit(10);

    const coursesWithEnrollment = await Course.aggregate([
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "course",
          as: "enrollments",
        },
      },
      {
        $project: {
          courseCode: 1,
          courseName: 1,
          enrolledCount: { $size: "$enrollments" },
          capacity: 1,
        },
      },
    ]);

    res.json({
      stats: {
        totalStudents,
        totalCourses,
        totalEnrollments,
      },
      recentEnrollments,
      coursesWithEnrollment,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all users (students)
// @route   GET /api/manager/users
// @access  Private/Manager
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all courses
// @route   GET /api/manager/courses
// @access  Private/Manager
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create course
// @route   POST /api/manager/courses
// @access  Private/Manager
const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/manager/courses/:id
// @access  Private/Manager
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/manager/courses/:id
// @access  Private/Manager
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await Enrollment.deleteMany({ course: course._id });
    await course.deleteOne();

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/manager/users/:id/role
// @access  Private/Manager
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      user: { _id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get enrollment statistics
// @route   GET /api/manager/statistics/enrollments
// @access  Private/Manager
const getEnrollmentStatistics = async (req, res) => {
  try {
    const stats = await Enrollment.aggregate([
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: "$courseDetails",
      },
      {
        $project: {
          courseCode: "$courseDetails.courseCode",
          courseName: "$courseDetails.courseName",
          enrolledStudents: "$count",
          capacity: "$courseDetails.capacity",
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getManagerDashboard,
  getAllUsers,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  updateUserRole,
  getEnrollmentStatistics,
};
