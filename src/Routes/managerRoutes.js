const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getManagerDashboard,
  getAllUsers,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  updateUserRole,
  getEnrollmentStatistics,
} = require("../controllers/managerController");

const {
  createFee,
  getAllFees,
  getFeeStatistics,
  getAllReceipts,
  cancelReceipt,
} = require("../controllers/feeController");

const {
  createCompany,
  getAllCompanies,
  updateCompany,
  deleteCompany,
  getAllApplications,
  updateApplicationStatus,
} = require("../controllers/companyController");

const {
  createInterviewSchedule,
  getAllInterviews,
  updateInterviewSchedule,
  cancelInterview,
  addStudentsToInterview,
  removeStudentFromInterview,
  completeInterview,
} = require("../controllers/interviewController");

const router = express.Router();

// All routes require authentication and manager role
router.use(protect);
router.use(roleMiddleware("manager"));

// Dashboard
router.get("/dashboard", getManagerDashboard);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);

// Course Management
router.get("/courses", getAllCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.get("/statistics/enrollments", getEnrollmentStatistics);

// Fee Management
router.post("/fees", createFee);
router.get("/fees", getAllFees);
router.get("/fees/statistics", getFeeStatistics);
router.get("/fees/receipts", getAllReceipts);
router.put("/fees/receipt/:id/cancel", cancelReceipt);

// Company Management
router.post("/companies", createCompany);
router.get("/companies", getAllCompanies);
router.put("/companies/:id", updateCompany);
router.delete("/companies/:id", deleteCompany);
router.get("/companies/applications", getAllApplications);
router.put("/companies/applications/:id", updateApplicationStatus);

// Interview Management
router.post("/interviews", createInterviewSchedule);
router.get("/interviews", getAllInterviews);
router.put("/interviews/:id", updateInterviewSchedule);
router.put("/interviews/:id/cancel", cancelInterview);
router.post("/interviews/:id/students", addStudentsToInterview);
router.delete(
  "/interviews/:id/students/:studentId",
  removeStudentFromInterview,
);
router.put("/interviews/:id/complete", completeInterview);

module.exports = router;
