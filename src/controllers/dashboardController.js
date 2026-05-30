const DashboardConfig = require("../models/DashboardConfig");
const Graph = require("../models/Graph");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Fee = require("../models/Fee");
const StudentCompany = require("../models/StudentCompany");

// @desc    Get manager enhanced dashboard
// @route   GET /api/manager/dashboard/enhanced
// @access  Private/Manager
const getManagerEnhancedDashboard = async (req, res) => {
  try {
    // Get all user graphs (public ones)
    const publicGraphs = await Graph.find({
      isPublic: true,
      userRole: "user",
    }).populate("createdBy", "name");

    // Get manager's own graphs
    const managerGraphs = await Graph.find({
      createdBy: req.user._id,
    });

    // Get all user dashboard configurations
    const userConfigs = await DashboardConfig.find().populate(
      "user",
      "name email studentId",
    );

    // Comprehensive statistics
    const statistics = {
      totalStudents: await User.countDocuments({ role: "user" }),
      totalManagers: await User.countDocuments({ role: "manager" }),
      totalCourses: await Course.countDocuments(),
      totalEnrollments: await Enrollment.countDocuments(),
      totalFeesCollected: await Fee.aggregate([
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      totalApplications: await StudentCompany.countDocuments(),
      placementRate: await calculatePlacementRate(),
      courseCompletionRate: await calculateCourseCompletionRate(),
      revenueByMonth: await getRevenueByMonth(),
      enrollmentByDepartment: await getEnrollmentByDepartment(),
    };

    res.json({
      graphs: [...publicGraphs, ...managerGraphs],
      statistics,
      userConfigs,
      recentActivities: await getRecentActivities(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper functions
const calculatePlacementRate = async () => {
  const totalApplied = await StudentCompany.countDocuments();
  const totalSelected = await StudentCompany.countDocuments({
    status: "selected",
  });
  return totalApplied > 0 ? (totalSelected / totalApplied) * 100 : 0;
};

const calculateCourseCompletionRate = async () => {
  const totalEnrollments = await Enrollment.countDocuments();
  const completedEnrollments = await Enrollment.countDocuments({
    status: "completed",
  });
  return totalEnrollments > 0
    ? (completedEnrollments / totalEnrollments) * 100
    : 0;
};

const getRevenueByMonth = async () => {
  return await Fee.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$paidAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const getEnrollmentByDepartment = async () => {
  return await User.aggregate([
    { $match: { role: "user" } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
  ]);
};

const getRecentActivities = async () => {
  const recentEnrollments = await Enrollment.find()
    .populate("user", "name")
    .populate("course", "courseName")
    .sort("-enrollmentDate")
    .limit(5);

  const recentPayments = await Fee.find({ paidAmount: { $gt: 0 } })
    .populate("user", "name")
    .sort("-updatedAt")
    .limit(5);

  const recentApplications = await StudentCompany.find()
    .populate("user", "name")
    .populate("company", "companyName")
    .sort("-applicationDate")
    .limit(5);

  return {
    recentEnrollments,
    recentPayments,
    recentApplications,
  };
};

module.exports = {
  getManagerEnhancedDashboard,
};
