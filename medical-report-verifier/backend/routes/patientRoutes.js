const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Report = require('../mongodb/models/Report');
const User = require('../mongodb/models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get patient's own reports
router.get('/my-reports', protect, authorize('patient'), async (req, res) => {
  try {
    console.log("Fetching reports for patient:", req.user.patientId);
    
    const reports = await Report.find({ patientId: req.user.patientId })
      .sort({ createdAt: -1 });
    
    successResponse(res, 200, "Reports fetched", reports);
  } catch (error) {
    console.error("Error fetching patient reports:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get reports shared with patient
router.get('/shared-with-me', protect, authorize('patient'), async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.user.patientId })
      .populate('lab', 'hospitalName email name')
      .sort({ createdAt: -1 });
    
    successResponse(res, 200, "Shared reports fetched", reports);
  } catch (error) {
    console.error("Error fetching shared reports:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get patient stats
router.get('/stats', protect, authorize('patient'), async (req, res) => {
  try {
    const totalReports = await Report.countDocuments({ patientId: req.user.patientId });
    const sharedReports = await Report.countDocuments({ 
      patientId: req.user.patientId,
      'sharedWith.0': { $exists: true }
    });
    const totalVerifications = await Report.aggregate([
      { $match: { patientId: req.user.patientId } },
      { $group: { _id: null, total: { $sum: "$verifiedCount" } } }
    ]);
    
    successResponse(res, 200, "Stats fetched", {
      totalReports,
      sharedReports,
      totalVerifications: totalVerifications[0]?.total || 0
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get consents
router.get('/consents', protect, authorize('patient'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('consentGivenTo.employer', 'name companyName email');
    successResponse(res, 200, "Consents fetched", user.consentGivenTo || []);
  } catch (error) {
    console.error("Error fetching consents:", error);
    errorResponse(res, 500, error.message);
  }
});

// Grant consent
router.post('/grant-consent', protect, authorize('patient'), async (req, res) => {
  try {
    const { employerEmail, reportIds, validDays = 30 } = req.body;
    
    if (!employerEmail) {
      return errorResponse(res, 400, "Employer email is required");
    }
    
    const employer = await User.findOne({ email: employerEmail, role: 'employer' });
    
    if (!employer) {
      return errorResponse(res, 404, "Employer not found with this email. Please make sure the employer is registered.");
    }
    
    // Check if consent already exists
    const existingConsent = req.user.consentGivenTo?.find(
      c => c.employer?.toString() === employer._id.toString()
    );
    
    if (existingConsent) {
      // Update existing consent
      existingConsent.validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
      existingConsent.status = "active";
      if (reportIds) existingConsent.reportIds = reportIds;
    } else {
      // Add new consent
      req.user.consentGivenTo = req.user.consentGivenTo || [];
      req.user.consentGivenTo.push({
        employer: employer._id,
        employerId: employer._id,
        employerName: employer.companyName || employer.name,
        reportIds: reportIds || [],
        validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        status: 'active'
      });
    }
    
    await req.user.save();
    successResponse(res, 200, "Consent granted successfully");
  } catch (error) {
    console.error("Error granting consent:", error);
    errorResponse(res, 500, error.message);
  }
});

// Revoke consent
router.delete('/consent/:consentId', protect, authorize('patient'), async (req, res) => {
  try {
    const consentIndex = req.user.consentGivenTo?.findIndex(
      c => c._id.toString() === req.params.consentId
    );
    
    if (consentIndex === -1 || consentIndex === undefined) {
      return errorResponse(res, 404, "Consent not found");
    }
    
    req.user.consentGivenTo[consentIndex].status = "revoked";
    await req.user.save();
    
    successResponse(res, 200, "Consent revoked successfully");
  } catch (error) {
    console.error("Error revoking consent:", error);
    errorResponse(res, 500, error.message);
  }
});

// Share report with employer (UPDATED WITH BETTER DEBUGGING)
router.post('/share-report/:reportId', protect, authorize('patient'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { employerEmail, validDays = 30 } = req.body;
    
    console.log("========================================");
    console.log("Share Report Request:");
    console.log("Report ID:", reportId);
    console.log("Employer Email:", employerEmail);
    console.log("Valid Days:", validDays);
    console.log("Patient ID:", req.user.patientId);
    console.log("========================================");
    
    if (!reportId) {
      return errorResponse(res, 400, "Report ID is required");
    }
    
    if (!employerEmail) {
      return errorResponse(res, 400, "Employer email is required");
    }
    
    // Find the report by ID
    const report = await Report.findById(reportId);
    
    if (!report) {
      console.log("❌ Report not found with ID:", reportId);
      return errorResponse(res, 404, "Report not found. Please make sure the report exists.");
    }
    
    console.log("✅ Report found:", report._id);
    console.log("Report patientId:", report.patientId);
    console.log("Current user patientId:", req.user.patientId);
    
    // Verify ownership - check if this report belongs to the logged-in patient
    if (report.patientId !== req.user.patientId) {
      console.log("❌ Access denied. Report belongs to different patient.");
      return errorResponse(res, 403, "You can only share your own reports");
    }
    
    // Find employer
    const employer = await User.findOne({ email: employerEmail, role: "employer" });
    
    if (!employer) {
      console.log("❌ Employer not found with email:", employerEmail);
      return errorResponse(res, 404, "Employer not found with this email. Please make sure the employer is registered.");
    }
    
    console.log("✅ Employer found:", employer._id, employer.companyName);
    
    // Check if already shared
    const existingShare = report.sharedWith?.find(
      s => s.employer?.toString() === employer._id.toString()
    );
    
    if (existingShare) {
      console.log("Updating existing share...");
      existingShare.status = "active";
      existingShare.expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
      existingShare.sharedAt = new Date();
    } else {
      console.log("Adding new share...");
      report.sharedWith = report.sharedWith || [];
      report.sharedWith.push({
        employer: employer._id,
        employerId: employer._id,
        employerName: employer.companyName || employer.name,
        sharedAt: new Date(),
        expiresAt: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        status: "active"
      });
    }
    
    await report.save();
    console.log("✅ Report saved successfully");
    
    // Also add to patient's consent record
    const patient = await User.findById(req.user._id);
    const existingConsent = patient.consentGivenTo?.find(
      c => c.employer?.toString() === employer._id.toString()
    );
    
    if (!existingConsent) {
      console.log("Adding to patient consent record...");
      patient.consentGivenTo = patient.consentGivenTo || [];
      patient.consentGivenTo.push({
        employer: employer._id,
        employerId: employer._id,
        employerName: employer.companyName || employer.name,
        reportIds: [report._id],
        validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        status: "active"
      });
      await patient.save();
    }
    
    console.log("✅ Report shared successfully!");
    console.log("========================================");
    
    successResponse(res, 200, "Report shared successfully", { 
      report,
      sharedWith: report.sharedWith
    });
  } catch (error) {
    console.error("❌ Share error:", error);
    errorResponse(res, 500, error.message);
  }
});

module.exports = router;