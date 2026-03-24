const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Report = require('../mongodb/models/Report');
const User = require('../mongodb/models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get reports shared with employer
router.get('/shared-reports', protect, authorize('employer'), async (req, res) => {
  try {
    console.log("Fetching shared reports for employer:", req.user._id);
    
    const reports = await Report.find({
      'sharedWith.employer': req.user._id,
      'sharedWith.status': 'active'
    })
    .populate('patient', 'name email patientId')
    .populate('lab', 'name hospitalName')
    .sort({ createdAt: -1 });
    
    successResponse(res, 200, "Shared reports fetched", reports);
  } catch (error) {
    console.error("Error fetching shared reports:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get employer statistics
router.get('/stats', protect, authorize('employer'), async (req, res) => {
  try {
    const activeReports = await Report.countDocuments({
      'sharedWith.employer': req.user._id,
      'sharedWith.status': 'active'
    });
    
    const verifications = await Report.aggregate([
      { $match: { 'sharedWith.employer': req.user._id } },
      { $group: { _id: null, total: { $sum: "$verifiedCount" } } }
    ]);
    
    const pendingRequests = req.user.accessRequests?.filter(r => r.status === 'pending').length || 0;
    
    successResponse(res, 200, "Stats fetched", {
      activeReports,
      verifications: verifications[0]?.total || 0,
      pendingRequests
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get pending access requests (for employer to see status)
router.get('/pending-requests', protect, authorize('employer'), async (req, res) => {
  try {
    // Find all patients where this employer has pending requests
    const patients = await User.find({
      'accessRequests.employer': req.user._id,
      'accessRequests.status': 'pending'
    }).select('name email accessRequests');
    
    const pendingRequests = [];
    patients.forEach(patient => {
      patient.accessRequests.forEach(request => {
        if (request.employer.toString() === req.user._id.toString() && request.status === 'pending') {
          pendingRequests.push({
            _id: request._id,
            reportHash: request.reportHash,
            patientName: patient.name,
            patientEmail: patient.email,
            requestedAt: request.requestedAt,
            status: request.status,
            message: request.message
          });
        }
      });
    });
    
    successResponse(res, 200, "Pending requests fetched", pendingRequests);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get all access requests (for employer to see all requests)
router.get('/access-requests', protect, authorize('employer'), async (req, res) => {
  try {
    // Find all patients where this employer has access requests
    const patients = await User.find({
      'accessRequests.employer': req.user._id
    }).select('name email accessRequests');
    
    const allRequests = [];
    patients.forEach(patient => {
      patient.accessRequests.forEach(request => {
        if (request.employer.toString() === req.user._id.toString()) {
          allRequests.push({
            _id: request._id,
            reportHash: request.reportHash,
            patientName: patient.name,
            patientEmail: patient.email,
            requestedAt: request.requestedAt,
            status: request.status,
            message: request.message,
            approvedAt: request.approvedAt,
            expiresAt: request.expiresAt
          });
        }
      });
    });
    
    // Sort by most recent first
    allRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    
    successResponse(res, 200, "Access requests fetched", allRequests);
  } catch (error) {
    console.error("Error fetching access requests:", error);
    errorResponse(res, 500, error.message);
  }
});

// Request access to report
router.post('/request-access', protect, authorize('employer'), async (req, res) => {
  try {
    const { reportHash, message } = req.body;
    
    if (!reportHash) {
      return errorResponse(res, 400, "Report hash is required");
    }
    
    const report = await Report.findOne({ reportHash });
    
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }
    
    // Find the patient
    const patient = await User.findOne({ patientId: report.patientId });
    
    if (!patient) {
      return errorResponse(res, 404, "Patient not found");
    }
    
    // Check if request already exists
    const existingRequest = patient.accessRequests?.find(
      r => r.employer?.toString() === req.user._id.toString() && 
           r.reportHash === reportHash && 
           r.status === 'pending'
    );
    
    if (existingRequest) {
      return errorResponse(res, 400, "Access request already pending");
    }
    
    // Create access request
    patient.accessRequests = patient.accessRequests || [];
    patient.accessRequests.push({
      report: report._id,
      reportHash: report.reportHash,
      employer: req.user._id,
      employerName: req.user.companyName || req.user.name,
      requestedAt: new Date(),
      status: 'pending',
      message: message || ''
    });
    
    await patient.save();
    
    successResponse(res, 200, "Access request sent to patient");
  } catch (error) {
    console.error("Error requesting access:", error);
    errorResponse(res, 500, error.message);
  }
});

// Verify a shared report
router.post('/verify-report/:reportId', protect, authorize('employer'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }
    
    // Check if employer has access
    const hasAccess = report.sharedWith?.some(
      share => share.employer?.toString() === req.user._id.toString() && share.status === 'active'
    );
    
    if (!hasAccess) {
      return errorResponse(res, 403, "You don't have access to this report");
    }
    
    // Update verification count
    report.verifiedCount += 1;
    report.verificationHistory = report.verificationHistory || [];
    report.verificationHistory.push({
      verifiedBy: req.user._id,
      verifiedByRole: 'employer',
      result: 'authentic',
      verifiedAt: new Date()
    });
    report.lastVerifiedAt = new Date();
    
    await report.save();
    
    successResponse(res, 200, "Report verified successfully", {
      isValid: true,
      verifiedCount: report.verifiedCount,
      reportHash: report.reportHash
    });
  } catch (error) {
    console.error("Error verifying report:", error);
    errorResponse(res, 500, error.message);
  }
});

// Get a specific shared report by ID
router.get('/report/:reportId', protect, authorize('employer'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('lab', 'name hospitalName labId')
      .populate('uploadedBy', 'name email');
    
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }
    
    // Check if employer has access
    const hasAccess = report.sharedWith?.some(
      share => share.employer?.toString() === req.user._id.toString() && share.status === 'active'
    );
    
    if (!hasAccess) {
      return errorResponse(res, 403, "You don't have access to this report");
    }
    
    // Return limited info for employer (hide patient personal details)
    const limitedReport = {
      _id: report._id,
      reportHash: report.reportHash,
      reportType: report.reportType,
      reportTitle: report.reportTitle,
      reportDate: report.reportDate,
      labName: report.labName,
      hospitalName: report.hospitalName,
      fileName: report.fileName,
      blockchainTxHash: report.blockchainTxHash,
      verifiedCount: report.verifiedCount,
      verificationHistory: report.verificationHistory,
      status: report.status
    };
    
    successResponse(res, 200, "Report fetched", limitedReport);
  } catch (error) {
    console.error("Error fetching report:", error);
    errorResponse(res, 500, error.message);
  }
});

module.exports = router;