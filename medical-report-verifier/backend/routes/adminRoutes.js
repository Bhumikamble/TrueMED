const express = require("express");

const {
  getDashboardStats,
  listUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  listReports,
  deleteReport,
  getSystemHealth
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, authorize("admin"));

// Dashboard & Statistics
router.get("/stats", getDashboardStats);
router.get("/health", getSystemHealth);

// User Management
router.get("/users", listUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId/role", updateUserRole);
router.put("/users/:userId/toggle-status", toggleUserStatus);
router.delete("/users/:userId", deleteUser);

// Report Management
router.get("/reports", listReports);
router.delete("/reports/:reportId", deleteReport);

module.exports = router;