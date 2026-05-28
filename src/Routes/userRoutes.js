const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getUserDashboard,
  enrollCourse,
  dropCourse,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

const {
  getUserFeeDashboard,
  payFee,
  getUserReceipts,
  getReceiptById,
} = require("../controllers/feeController");

const {
  getStudentCompanies,
  applyToCompany,
  getStudentApplications,
  getStudentInterviews,
} = require("../controllers/companyController");

const {
  createGraph,
  getUserGraphs,
  getGraphById,
  downloadGraph,
  updateGraph,
  deleteGraph,
  bulkDeleteGraphs,
  shareGraph,
  getGraphStatistics,
} = require("../controllers/graphController");

const {
  getEnhancedDashboard,
  updateDashboardConfig,
  addWidget,
  removeWidget,
  toggleWidgetVisibility,
  exportDashboardData,
} = require("../controllers/dashboardController");

const router = express.Router();

router.use(protect);
router.use(roleMiddleware("user"));

// Dashboard (Enhanced)
router.get("/dashboard/enhanced", getEnhancedDashboard);
router.put("/dashboard/config", updateDashboardConfig);
router.post("/dashboard/widgets", addWidget);
router.delete("/dashboard/widgets/:widgetId", removeWidget);
router.put("/dashboard/widgets/:widgetId/toggle", toggleWidgetVisibility);
router.get("/dashboard/export", exportDashboardData);

// Original dashboard
router.get("/dashboard", getUserDashboard);

// Profile
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

// Courses
router.post("/enroll/:courseId", enrollCourse);
router.delete("/drop/:enrollmentId", dropCourse);

// Fees
router.get("/fees/dashboard", getUserFeeDashboard);
router.post("/fees/pay/:feeId", payFee);
router.get("/fees/receipts", getUserReceipts);
router.get("/fees/receipt/:id", getReceiptById);

// Companies
router.get("/companies", getStudentCompanies);
router.post("/companies/apply/:companyId", applyToCompany);
router.get("/companies/applications", getStudentApplications);
router.get("/companies/interviews", getStudentInterviews);

// Graph Management
router.post("/graphs", createGraph);
router.get("/graphs", getUserGraphs);
router.get("/graphs/statistics", getGraphStatistics);
router.get("/graphs/:id", getGraphById);
router.get("/graphs/:id/download/:format", downloadGraph);
router.put("/graphs/:id", updateGraph);
router.delete("/graphs/:id", deleteGraph);
router.delete("/graphs/bulk-delete", bulkDeleteGraphs);
router.put("/graphs/:id/share", shareGraph);

module.exports = router;
