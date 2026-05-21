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

const router = express.Router();

// All routes require authentication and user role
router.use(protect);
router.use(roleMiddleware("user"));

router.get("/dashboard", getUserDashboard);
router.post("/enroll/:courseId", enrollCourse);
router.delete("/drop/:enrollmentId", dropCourse);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

module.exports = router;
