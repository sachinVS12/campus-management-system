const DashboardConfig = require("../models/DashboardConfig");
const Graph = require("../models/Graph");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Fee = require("../models/Fee");
const StudentCompany = require("../models/StudentCompany");
const InterviewSchedule = require("../models/InterviewSchedule");

// @desc    Get enhanced dashboard with graphs
// @route   GET /api/user/dashboard/enhanced
// @access  Private
const getEnhancedDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get dashboard configuration
    let dashboardConfig = await DashboardConfig.findOne({ user: userId });
    if (!dashboardConfig) {
      dashboardConfig = await createDefaultDashboard(userId);
    }

    // Get saved graphs
    const graphs = await Graph.find({
      $or: [{ createdBy: userId }, { isPublic: true }],
    }).sort("-createdAt");

    // Get real-time statistics based on role
    let statistics = {};

    if (userRole === "user") {
      // Student statistics
      const enrolledCourses = await Enrollment.countDocuments({ user: userId });
      const totalFees = await Fee.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            paid: { $sum: "$paidAmount" },
          },
        },
      ]);
      const applications = await StudentCompany.countDocuments({
        user: userId,
      });
      const interviews = await InterviewSchedule.countDocuments({
        students: userId,
      });

      statistics = {
        enrolledCourses,
        totalFees: totalFees[0]?.total || 0,
        paidFees: totalFees[0]?.paid || 0,
        pendingFees: (totalFees[0]?.total || 0) - (totalFees[0]?.paid || 0),
        applications,
        interviews,
        performance: {
          attendance: 85,
          averageGrade: 78.5,
        },
      };
    } else {
      // Manager statistics
      const totalStudents = await User.countDocuments({ role: "user" });
      const totalCourses = await Course.countDocuments();
      const totalEnrollments = await Enrollment.countDocuments();
      const totalCompaniesResult = await StudentCompany.aggregate([
        { $group: { _id: "$company" } },
        { $count: "total" },
      ]);
      const revenueData = await Fee.aggregate([
        { $group: { _id: null, totalCollected: { $sum: "$paidAmount" } } },
      ]);

      statistics = {
        totalStudents,
        totalCourses,
        totalEnrollments,
        totalCompanies: totalCompaniesResult[0]?.total || 0,
        totalRevenue: revenueData[0]?.totalCollected || 0,
        placementRate: 65.5,
      };
    }

    res.json({
      config: dashboardConfig,
      graphs,
      statistics,
      userInfo: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        studentId: req.user.studentId,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper to create default dashboard
const createDefaultDashboard = async (userId) => {
  const defaultConfig = {
    user: userId,
    layout: {
      widgets: [
        {
          widgetId: "stats",
          type: "statistics",
          title: "Key Statistics",
          position: { x: 0, y: 0, w: 6, h: 2 },
          isVisible: true,
          refreshInterval: 30000,
          settings: {},
        },
        {
          widgetId: "enrollment",
          type: "chart",
          title: "Enrollment Trends",
          position: { x: 6, y: 0, w: 6, h: 3 },
          isVisible: true,
          refreshInterval: 60000,
          settings: {},
        },
        {
          widgetId: "fees",
          type: "chart",
          title: "Fee Status",
          position: { x: 0, y: 2, w: 6, h: 3 },
          isVisible: true,
          refreshInterval: 60000,
          settings: {},
        },
        {
          widgetId: "performance",
          type: "chart",
          title: "Performance Metrics",
          position: { x: 6, y: 3, w: 6, h: 3 },
          isVisible: true,
          refreshInterval: 300000,
          settings: {},
        },
      ],
    },
    theme: {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      darkMode: false,
    },
    preferences: {
      defaultView: "grid",
      showNotifications: true,
      autoRefresh: true,
    },
  };

  return await DashboardConfig.create(defaultConfig);
};

// @desc    Update dashboard configuration
// @route   PUT /api/user/dashboard/config
// @access  Private
const updateDashboardConfig = async (req, res) => {
  try {
    const { layout, theme, preferences } = req.body;

    let config = await DashboardConfig.findOne({ user: req.user._id });

    if (!config) {
      config = await createDefaultDashboard(req.user._id);
    }

    if (layout) config.layout = layout;
    if (theme) config.theme = theme;
    if (preferences) config.preferences = preferences;

    await config.save();

    res.json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add widget to dashboard
// @route   POST /api/user/dashboard/widgets
// @access  Private
const addWidget = async (req, res) => {
  try {
    const { type, title, position } = req.body;

    let config = await DashboardConfig.findOne({ user: req.user._id });
    if (!config) {
      config = await createDefaultDashboard(req.user._id);
    }

    const newWidget = {
      widgetId: `widget_${Date.now()}`,
      type,
      title,
      position: position || {
        x: 0,
        y: config.layout.widgets.length,
        w: 4,
        h: 2,
      },
      isVisible: true,
      refreshInterval: 30000,
      settings: {},
    };

    config.layout.widgets.push(newWidget);
    await config.save();

    res.json(newWidget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove widget from dashboard
// @route   DELETE /api/user/dashboard/widgets/:widgetId
// @access  Private
const removeWidget = async (req, res) => {
  try {
    const config = await DashboardConfig.findOne({ user: req.user._id });

    if (!config) {
      return res.status(404).json({ message: "Dashboard config not found" });
    }

    config.layout.widgets = config.layout.widgets.filter(
      (w) => w.widgetId !== req.params.widgetId,
    );
    await config.save();

    res.json({ message: "Widget removed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle widget visibility
// @route   PUT /api/user/dashboard/widgets/:widgetId/toggle
// @access  Private
const toggleWidgetVisibility = async (req, res) => {
  try {
    const config = await DashboardConfig.findOne({ user: req.user._id });

    if (!config) {
      return res.status(404).json({ message: "Dashboard config not found" });
    }

    const widget = config.layout.widgets.find(
      (w) => w.widgetId === req.params.widgetId,
    );
    if (widget) {
      widget.isVisible = !widget.isVisible;
      await config.save();
    }

    res.json({ message: "Widget visibility toggled", widget });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Export dashboard data
// @route   GET /api/user/dashboard/export
// @access  Private
const exportDashboardData = async (req, res) => {
  try {
    const format = req.query.format || "json";

    const dashboardData = {
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      statistics: await getDashboardStats(req.user._id, req.user.role),
      graphs: await Graph.find({ createdBy: req.user._id }),
      config: await DashboardConfig.findOne({ user: req.user._id }),
    };

    switch (format) {
      case "json":
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=dashboard_export.json",
        );
        res.json(dashboardData);
        break;

      case "csv":
        let csvData = "Metric,Value\n";
        Object.entries(dashboardData.statistics).forEach(([key, value]) => {
          csvData += `${key},${typeof value === "object" ? JSON.stringify(value) : value}\n`;
        });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=dashboard_export.csv",
        );
        res.send(csvData);
        break;

      default:
        res.status(400).json({ message: "Unsupported format" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper to get dashboard statistics
const getDashboardStats = async (userId, userRole) => {
  if (userRole === "user") {
    const enrolledCourses = await Enrollment.countDocuments({ user: userId });
    const applications = await StudentCompany.countDocuments({ user: userId });
    const feeData = await Fee.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          paid: { $sum: "$paidAmount" },
        },
      },
    ]);

    return {
      enrolledCourses,
      applications,
      totalFees: feeData[0]?.total || 0,
      paidFees: feeData[0]?.paid || 0,
    };
  } else {
    const totalStudents = await User.countDocuments({ role: "user" });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const revenueData = await Fee.aggregate([
      { $group: { _id: null, totalCollected: { $sum: "$paidAmount" } } },
    ]);

    return {
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalRevenue: revenueData[0]?.totalCollected || 0,
    };
  }
};

module.exports = {
  getEnhancedDashboard,
  updateDashboardConfig,
  addWidget,
  removeWidget,
  toggleWidgetVisibility,
  exportDashboardData,
};
