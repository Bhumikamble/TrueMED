const express = require("express");

const {
  uploadReport,
  verifyReport,
  getReportByHash,
  downloadReportFile,
  listMyReports,
} = require("../controllers/reportController");
const upload = require("../middleware/uploadMiddleware");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/upload-report",
  protect,
  authorizeRoles("lab", "admin"),
  upload.single("reportFile"),
  uploadReport
);
router.post("/verify-report", upload.single("reportFile"), verifyReport);
router.get("/report/:hash", getReportByHash);
router.get("/report-file/:hash", downloadReportFile);
router.get("/my-reports", protect, listMyReports);

module.exports = router;
