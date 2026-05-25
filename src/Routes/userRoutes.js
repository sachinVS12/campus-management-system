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

const router = express.Router();

// All routes require authentication and user role
router.use(protect);
router.use(roleMiddleware("user"));

// Dashboard and Profile
router.get("/dashboard", getUserDashboard);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

// Course Management
router.post("/enroll/:courseId", enrollCourse);
router.delete("/drop/:enrollmentId", dropCourse);

// Fee Management
router.get("/fees/dashboard", getUserFeeDashboard);
router.post("/fees/pay/:feeId", payFee);
router.get("/fees/receipts", getUserReceipts);
router.get("/fees/receipt/:id", getReceiptById);

module.exports = router;
