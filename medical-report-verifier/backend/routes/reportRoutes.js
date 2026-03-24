const express = require("express");

const {
  uploadReport,
  verifyReport,
  getReportByHash,
  downloadReportFile,
  listMyReports,
  getReportById,
  verifyReportById,
  getReportStats,
  getReportSharingInfo,
  shareReport,
  revokeReportAccess,
} = require("../controllers/reportController");
const upload = require("../middleware/uploadMiddleware");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== PUBLIC ROUTES (no auth required) ====================
// These must come before protected routes to avoid auth requirement

// Verify report by file upload (public)
router.post("/verify-report", upload.single("reportFile"), verifyReport);

// Get report by hash (public with limited info)
router.get("/report/:hash", getReportByHash);

// ==================== PROTECTED ROUTES (auth required) ====================
// All routes below this line require authentication
router.use(protect);

// ==================== ADMIN ONLY ROUTES ====================
// Report statistics (admin only)
router.get("/stats/overview", authorize("admin"), getReportStats);

// ==================== LAB/ADMIN ROUTES ====================
// Upload report (Lab/Admin only)
router.post(
  "/upload-report",
  authorize("lab", "admin"),
  upload.single("reportFile"),
  uploadReport
);

// ==================== PATIENT ROUTES ====================
// Share report with employer (Patient only)
router.post(
  "/share/:reportId",
  authorize("patient"),
  shareReport
);

// Revoke employer access to report (Patient only)
router.delete(
  "/share/:reportId/:employerId",
  authorize("patient"),
  revokeReportAccess
);

// Get report sharing information (Patient only)
router.get(
  "/:reportId/sharing",
  authorize("patient"),
  getReportSharingInfo
);

// ==================== ALL AUTHENTICATED USERS ROUTES ====================
// These routes have access control logic inside the controller

// Get my reports (Patient, Lab, Employer - role-specific)
router.get("/my-reports", listMyReports);

// Download report file (with access control)
router.get("/report-file/:hash", downloadReportFile);

// Get report by ID (with access control)
router.get("/:reportId", getReportById);

// Verify report by ID (with access control)
router.post("/verify/:reportId", verifyReportById);

module.exports = router;