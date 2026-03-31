const Report = require("../mongodb/models/Report");
const User = require("../mongodb/models/User");
const { generateSHA256Hash } = require("../services/hashService");
const {
  addReportOnChain,
  verifyReportOnChain,
  getReportFromChain,
  isBlockchainEnabled,
} = require("../services/blockchainService");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// @desc    Upload report
// @route   POST /api/reports/upload-report
// @access  Private (Lab/Admin only)
const uploadReport = async (req, res, next) => {
  try {
    const { patientId, patientEmail, reportType = "general", reportTitle, findings, diagnosis, doctorName, generateQR = true } = req.body;
    const file = req.file;

    if (!patientId || !file) {
      return errorResponse(res, 400, "patientId and reportFile are required");
    }

    const reportHash = generateSHA256Hash(file.buffer);

    const existingReport = await Report.findOne({ reportHash });
    if (existingReport) {
      return errorResponse(res, 409, "This report already exists in the system");
    }

    const labId = req.user.labId || `LAB-${req.user._id}`;

    // Find patient if exists
    let patient = null;
    if (patientEmail) {
      patient = await User.findOne({ email: patientEmail, role: "patient" });
    } else {
      patient = await User.findOne({ patientId, role: "patient" });
    }

    // Upload to blockchain
    const chainResult = await addReportOnChain({
      reportHash,
      patientId,
      labId,
    });

    // Create report
    const report = await Report.create({
      reportHash,
      reportId: `RPT-${Date.now()}`,
      patientId,
      patient: patient?._id,
      patientName: patient?.name,
      patientEmail: patient?.email,
      labId,
      lab: req.user._id,
      labName: req.user.hospitalName || req.user.name,
      hospitalName: req.user.hospitalName,
      fileName: file.originalname,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: file.buffer,
      fileExtension: file.originalname.split('.').pop(),
      reportType,
      reportTitle: reportTitle || `Medical Report - ${new Date().toLocaleDateString()}`,
      reportDate: new Date(),
      findings,
      diagnosis,
      doctorName,
      blockchainTxHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
      uploadedBy: req.user._id,
      uploadedByRole: req.user.role,
      recordedAt: Date.now(),
      uploadedAt: new Date(),
      status: "active",
      isVerified: true,
    });

    // Generate QR code if requested
    let qrCodeImage = null;
    if (generateQR) {
      const qrData = {
        reportHash: reportHash,
        patientId: patientId,
        patientName: patient?.name || "Unknown",
        labId: labId,
        labName: req.user.hospitalName || req.user.name,
        reportType: reportType,
        reportTitle: reportTitle || "Medical Report",
        contractAddress: process.env.CONTRACT_ADDRESS,
        issuedDate: new Date().toISOString(),
        verificationUrl: `${process.env.FRONTEND_URL}/verify-qr?hash=${reportHash}`
      };
      
      qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2,
        color: { dark: '#1a4d8c', light: '#ffffff' }
      });
      
      // FIXED: Save to sepolia QR folder
      const qrDir = path.join(__dirname, '../../smart-contract/qr-codes-sepolia');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }
      const qrPath = path.join(qrDir, `report-${reportHash.substring(0, 10)}.png`);
      const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(qrPath, base64Data, 'base64');
      
      // Store QR code path in database
      report.qrCodePath = qrPath;
      await report.save();
    }

    // Add audit log
    await report.addAuditLog("upload", req.user._id, req.user.role, { patientId, reportType, qrGenerated: generateQR }, req.ip);

    const responseData = {
      report: {
        id: report._id,
        reportHash: report.reportHash,
        reportId: report.reportId,
        reportType: report.reportType,
        fileName: report.fileName,
        patientId: report.patientId,
        labId: report.labId,
        blockchainTxHash: report.blockchainTxHash,
      },
      chainResult,
    };
    
    if (qrCodeImage) {
      responseData.qrCode = qrCodeImage;
      responseData.qrMessage = "QR code generated successfully! Scan to verify report.";
    }

    return successResponse(res, 201, "Report uploaded and anchored on blockchain", responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload report with QR code (alternative endpoint)
// @route   POST /api/reports/upload-with-qr
// @access  Private (Lab/Admin only)
const uploadReportWithQR = async (req, res, next) => {
  try {
    const { patientId, patientName, patientEmail, reportType = "general", reportTitle, findings, diagnosis, doctorName } = req.body;
    const file = req.file;

    if (!patientId || !file) {
      return errorResponse(res, 400, "patientId and reportFile are required");
    }

    const reportHash = generateSHA256Hash(file.buffer);

    const existingReport = await Report.findOne({ reportHash });
    if (existingReport) {
      return errorResponse(res, 409, "This report already exists in the system");
    }

    const labId = req.user.labId || `LAB-${req.user._id}`;

    // Find patient if exists
    let patient = null;
    if (patientEmail) {
      patient = await User.findOne({ email: patientEmail, role: "patient" });
    } else {
      patient = await User.findOne({ patientId, role: "patient" });
    }

    // Upload to blockchain
    const chainResult = await addReportOnChain({
      reportHash,
      patientId,
      labId,
    });

    // Create report
    const report = await Report.create({
      reportHash,
      reportId: `RPT-${Date.now()}`,
      patientId,
      patient: patient?._id,
      patientName: patient?.name || patientName,
      patientEmail: patient?.email || patientEmail,
      labId,
      lab: req.user._id,
      labName: req.user.hospitalName || req.user.name,
      hospitalName: req.user.hospitalName,
      fileName: file.originalname,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: file.buffer,
      fileExtension: file.originalname.split('.').pop(),
      reportType,
      reportTitle: reportTitle || `Medical Report - ${new Date().toLocaleDateString()}`,
      reportDate: new Date(),
      findings,
      diagnosis,
      doctorName,
      blockchainTxHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
      uploadedBy: req.user._id,
      uploadedByRole: req.user.role,
      recordedAt: Date.now(),
      uploadedAt: new Date(),
      status: "active",
      isVerified: true,
    });

    // Generate QR code
    const qrData = {
      reportHash: reportHash,
      patientId: patientId,
      patientName: patient?.name || patientName || "Unknown",
      labId: labId,
      labName: req.user.hospitalName || req.user.name,
      reportType: reportType,
      reportTitle: reportTitle || "Medical Report",
      contractAddress: process.env.CONTRACT_ADDRESS,
      issuedDate: new Date().toISOString(),
      verificationUrl: `${process.env.FRONTEND_URL}/verify-qr?hash=${reportHash}`
    };
    
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: { dark: '#1a4d8c', light: '#ffffff' }
    });
    
    // FIXED: Save to sepolia QR folder
    const qrDir = path.join(__dirname, '../../smart-contract/qr-codes-sepolia');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    const qrPath = path.join(qrDir, `report-${reportHash.substring(0, 10)}.png`);
    const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(qrPath, base64Data, 'base64');
    
    // Store QR code path in database
    report.qrCodePath = qrPath;
    await report.save();

    // Add audit log
    await report.addAuditLog("upload", req.user._id, req.user.role, { patientId, reportType, qrGenerated: true }, req.ip);

    return successResponse(res, 201, "Report uploaded with QR code", {
      success: true,
      reportHash: reportHash,
      reportId: report.reportId,
      patientId: patientId,
      patientName: patient?.name || patientName,
      labName: req.user.hospitalName || req.user.name,
      qrCode: qrCodeImage,
      verificationUrl: qrData.verificationUrl,
      message: "Report issued successfully with QR code!"
    });
  } catch (error) {
    console.error("Upload with QR error:", error);
    next(error);
  }
};

// @desc    Generate QR code for existing report
// @route   POST /api/reports/generate-qr/:reportId
// @access  Private (Lab/Patient/Admin)
const generateQRForReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId);
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }
    
    // Check access
    let hasAccess = false;
    if (req.user.role === "patient" && report.patientId === req.user.patientId) hasAccess = true;
    if (req.user.role === "lab" && report.labId === req.user.labId) hasAccess = true;
    if (req.user.role === "admin") hasAccess = true;
    
    if (!hasAccess) {
      return errorResponse(res, 403, "Not authorized to generate QR for this report");
    }
    
    // Get patient info
    const patient = await User.findById(report.patient);
    
    const qrData = {
      reportHash: report.reportHash,
      patientId: report.patientId,
      patientName: report.patientName || patient?.name || "Unknown",
      labId: report.labId,
      labName: report.labName,
      reportType: report.reportType,
      reportTitle: report.reportTitle,
      contractAddress: process.env.CONTRACT_ADDRESS,
      issuedDate: report.reportDate.toISOString(),
      verificationUrl: `${process.env.FRONTEND_URL}/verify-qr?hash=${report.reportHash}`
    };
    
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: { dark: '#1a4d8c', light: '#ffffff' }
    });
    
    // FIXED: Save to sepolia QR folder
    const qrDir = path.join(__dirname, '../../smart-contract/qr-codes-sepolia');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    const qrPath = path.join(qrDir, `report-${report.reportHash.substring(0, 10)}.png`);
    const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(qrPath, base64Data, 'base64');
    
    report.qrCodePath = qrPath;
    await report.save();
    
    await report.addAuditLog("qr_generated", req.user._id, req.user.role, { reportHash: report.reportHash }, req.ip);
    
    return successResponse(res, 200, "QR code generated", {
      qrCode: qrCodeImage,
      qrPath: qrPath,
      verificationUrl: qrData.verificationUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify report by file upload
// @route   POST /api/reports/verify-report
// @access  Public
const verifyReport = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return errorResponse(res, 400, "reportFile is required");
    }

    const reportHash = generateSHA256Hash(file.buffer);
    const blockchainEnabled = isBlockchainEnabled();

    const [existsOnChain, chainReport, dbReport] = await Promise.all([
      verifyReportOnChain(reportHash),
      getReportFromChain(reportHash),
      Report.findOne({ reportHash }),
    ]);

    const isAuthentic = blockchainEnabled
      ? Boolean(existsOnChain && chainReport && chainReport.exists)
      : Boolean(dbReport);

    // If authenticated and dbReport exists, record verification
    if (isAuthentic && dbReport && req.user) {
      dbReport.verifiedCount += 1;
      dbReport.lastVerifiedAt = new Date();
      dbReport.verificationHistory = dbReport.verificationHistory || [];
      dbReport.verificationHistory.push({
        verifiedBy: req.user?._id,
        verifiedByRole: req.user?.role,
        result: "authentic",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      await dbReport.save();
    }

    return successResponse(res, 200, "Verification completed", {
      reportHash,
      isAuthentic,
      blockchainRecord: chainReport,
      databaseRecord: dbReport ? {
        exists: true,
        reportType: dbReport.reportType,
        patientId: dbReport.patientId,
        labId: dbReport.labId,
        reportDate: dbReport.reportDate,
        verifiedCount: dbReport.verifiedCount,
        hasQR: !!dbReport.qrCodePath,
      } : null,
      fileStoredInDatabase: Boolean(dbReport),
      verificationSource: blockchainEnabled ? "blockchain+database" : "database-only-local-mode",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report by hash
// @route   GET /api/reports/report/:hash
// @access  Public (with limited info)
const getReportByHash = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const blockchainEnabled = isBlockchainEnabled();
    
    const [dbReport, chainReport] = await Promise.all([
      Report.findOne({ reportHash: hash })
        .populate("patient", "name email patientId")
        .populate("lab", "name hospitalName labId")
        .populate("uploadedBy", "name email role"),
      getReportFromChain(hash),
    ]);

    if (!dbReport && !(chainReport && chainReport.exists)) {
      return errorResponse(res, 404, "Report not found");
    }

    // Prepare response based on authentication and role
    let reportData = {
      exists: true,
      reportHash: hash,
      mode: blockchainEnabled ? "blockchain" : "local-no-deploy",
    };

    if (dbReport) {
      reportData = {
        ...reportData,
        id: dbReport._id,
        reportId: dbReport.reportId,
        reportType: dbReport.reportType,
        reportTitle: dbReport.reportTitle,
        reportDate: dbReport.reportDate,
        patientId: dbReport.patientId,
        labId: dbReport.labId,
        labName: dbReport.labName,
        hospitalName: dbReport.hospitalName,
        fileName: dbReport.fileName,
        fileSize: dbReport.fileSize,
        verifiedCount: dbReport.verifiedCount,
        blockchainTxHash: dbReport.blockchainTxHash,
        createdAt: dbReport.createdAt,
        hasQR: !!dbReport.qrCodePath,
      };

      // Include patient info if authenticated and has access
      if (req.user) {
        let hasAccess = false;
        if (req.user.role === "patient" && dbReport.patientId === req.user.patientId) hasAccess = true;
        if (req.user.role === "lab" && dbReport.labId === req.user.labId) hasAccess = true;
        if (req.user.role === "employer") {
          hasAccess = dbReport.sharedWith?.some(
            share => share.employer?.toString() === req.user._id.toString() && share.status === "active"
          );
        }
        if (req.user.role === "admin") hasAccess = true;

        if (hasAccess) {
          reportData.patient = dbReport.patient;
          reportData.lab = dbReport.lab;
          reportData.findings = dbReport.findings;
          reportData.diagnosis = dbReport.diagnosis;
          reportData.doctorName = dbReport.doctorName;
          reportData.verificationHistory = dbReport.verificationHistory;
          reportData.sharedWith = dbReport.sharedWith;
        }
      }
    }

    return successResponse(res, 200, "Report fetched", reportData);
  } catch (error) {
    next(error);
  }
};

// @desc    Download report file
// @route   GET /api/reports/report-file/:hash
// @access  Private (with access control)
const downloadReportFile = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const report = await Report.findOne({ reportHash: hash }).select(
      "+fileData fileName mimeType patientId labId sharedWith"
    );

    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    // Check access based on role
    let hasAccess = false;
    
    if (req.user.role === "patient" && report.patientId === req.user.patientId) {
      hasAccess = true;
    } else if (req.user.role === "lab" && report.labId === req.user.labId) {
      hasAccess = true;
    } else if (req.user.role === "employer") {
      hasAccess = report.sharedWith?.some(
        share => share.employer?.toString() === req.user._id.toString() && share.status === "active"
      );
    } else if (req.user.role === "admin") {
      hasAccess = true;
    }

    if (!hasAccess) {
      return errorResponse(res, 403, "Access denied. You don't have permission to download this report.");
    }

    // Add audit log
    await report.addAuditLog("download", req.user._id, req.user.role, {}, req.ip);

    res.setHeader("Content-Type", report.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${report.fileName}"`);
    return res.send(report.fileData);
  } catch (error) {
    next(error);
  }
};

// @desc    List my reports (role-based)
// @route   GET /api/reports/my-reports
// @access  Private
const listMyReports = async (req, res, next) => {
  try {
    let query = {};
    
    if (req.user.role === "patient") {
      query.patientId = req.user.patientId;
    } else if (req.user.role === "lab") {
      query.labId = req.user.labId;
    } else if (req.user.role === "employer") {
      query["sharedWith.employer"] = req.user._id;
      query["sharedWith.status"] = "active";
    }

    const reports = await Report.find(query)
      .populate("patient", "name email patientId")
      .populate("lab", "name hospitalName labId")
      .sort({ createdAt: -1 })
      .limit(100);

    return successResponse(res, 200, "Reports fetched", { reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report by ID with access control
// @route   GET /api/reports/:reportId
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate("patient", "name email patientId phoneNumber dateOfBirth")
      .populate("lab", "name hospitalName labId labPhone")
      .populate("uploadedBy", "name email");

    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    // Check access based on role
    let hasAccess = false;

    if (req.user.role === "patient" && report.patientId === req.user.patientId) {
      hasAccess = true;
    } else if (req.user.role === "lab" && report.labId === req.user.labId) {
      hasAccess = true;
    } else if (req.user.role === "employer") {
      hasAccess = report.sharedWith?.some(
        share => share.employer?.toString() === req.user._id.toString() && share.status === "active"
      );
    } else if (req.user.role === "admin") {
      hasAccess = true;
    }

    if (!hasAccess) {
      return errorResponse(res, 403, "Access denied. You don't have permission to view this report.");
    }

    // Add audit log
    await report.addAuditLog("view", req.user._id, req.user.role, {}, req.ip);

    successResponse(res, 200, "Report fetched", { report });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify report by ID
// @route   POST /api/reports/verify/:reportId
// @access  Private (with access control)
const verifyReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    // Check if user has access to verify
    let canVerify = false;
    
    if (req.user.role === "patient" && report.patientId === req.user.patientId) {
      canVerify = true;
    } else if (req.user.role === "lab" && report.labId === req.user.labId) {
      canVerify = true;
    } else if (req.user.role === "employer") {
      canVerify = report.sharedWith?.some(
        share => share.employer?.toString() === req.user._id.toString() && share.status === "active"
      );
    } else if (req.user.role === "admin") {
      canVerify = true;
    }

    if (!canVerify) {
      return errorResponse(res, 403, "Not authorized to verify this report");
    }

    // Also verify on blockchain
    const blockchainEnabled = isBlockchainEnabled();
    let blockchainValid = false;
    
    if (blockchainEnabled) {
      blockchainValid = await verifyReportOnChain(report.reportHash);
    }

    const isValid = blockchainEnabled ? blockchainValid : true;

    // Record verification
    report.verifiedCount += 1;
    report.lastVerifiedAt = new Date();
    report.verificationHistory = report.verificationHistory || [];
    report.verificationHistory.push({
      verifiedBy: req.user._id,
      verifiedByRole: req.user.role,
      result: isValid ? "authentic" : "tampered",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    await report.save();

    successResponse(res, 200, "Verification completed", {
      isValid,
      reportHash: report.reportHash,
      verifiedCount: report.verifiedCount,
      lastVerifiedAt: report.lastVerifiedAt,
      blockchainVerified: blockchainValid,
      hasQR: !!report.qrCodePath,
      message: isValid ? "Report is authentic" : "Report may have been tampered with"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Share report with employer
// @route   POST /api/reports/share/:reportId
// @access  Private (Patient only)
const shareReport = async (req, res, next) => {
  try {
    const { employerEmail, validDays = 30, purpose } = req.body;
    
    if (!employerEmail) {
      return errorResponse(res, 400, "Employer email is required");
    }

    const report = await Report.findById(req.params.reportId);
    
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    // Verify ownership
    if (report.patientId !== req.user.patientId) {
      return errorResponse(res, 403, "You can only share your own reports");
    }

    // Find employer
    const employer = await User.findOne({ email: employerEmail, role: "employer" });
    if (!employer) {
      return errorResponse(res, 404, "Employer not found with this email");
    }

    // Check if already shared
    const existingShare = report.sharedWith?.find(
      s => s.employer?.toString() === employer._id.toString()
    );

    if (existingShare) {
      // Update existing share
      existingShare.status = "active";
      existingShare.expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
      existingShare.sharedAt = new Date();
      existingShare.purpose = purpose;
    } else {
      // Add new share
      report.sharedWith = report.sharedWith || [];
      report.sharedWith.push({
        employer: employer._id,
        employerId: employer._id,
        employerName: employer.companyName || employer.name,
        sharedAt: new Date(),
        expiresAt: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        status: "active",
        purpose,
      });
    }

    await report.save();

    // Also add to patient's consent record
    const patient = await User.findById(req.user._id);
    const existingConsent = patient.consentGivenTo?.find(
      c => c.employer?.toString() === employer._id.toString()
    );

    if (!existingConsent) {
      patient.consentGivenTo = patient.consentGivenTo || [];
      patient.consentGivenTo.push({
        employer: employer._id,
        employerId: employer._id,
        employerName: employer.companyName || employer.name,
        reportIds: [report._id],
        validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        status: "active",
        purpose,
      });
      await patient.save();
    }

    // Add audit log
    await report.addAuditLog("share", req.user._id, "patient", { employerEmail, validDays }, req.ip);

    successResponse(res, 200, "Report shared successfully", {
      message: `Report shared successfully with ${employer.companyName || employer.name}`,
      sharedWith: report.sharedWith
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke employer access to report
// @route   DELETE /api/reports/share/:reportId/:employerId
// @access  Private (Patient only)
const revokeReportAccess = async (req, res, next) => {
  try {
    const { reportId, employerId } = req.params;
    
    const report = await Report.findById(reportId);
    
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    // Verify ownership
    if (report.patientId !== req.user.patientId) {
      return errorResponse(res, 403, "You can only revoke access for your own reports");
    }

    // Update share status
    const shareIndex = report.sharedWith?.findIndex(
      s => s.employer?.toString() === employerId
    );

    if (shareIndex !== -1 && shareIndex !== undefined) {
      report.sharedWith[shareIndex].status = "revoked";
      await report.save();
    }

    // Also update patient's consent
    const patient = await User.findById(req.user._id);
    const consentIndex = patient.consentGivenTo?.findIndex(
      c => c.employer?.toString() === employerId
    );

    if (consentIndex !== -1 && consentIndex !== undefined) {
      patient.consentGivenTo[consentIndex].status = "revoked";
      await patient.save();
    }

    // Add audit log
    await report.addAuditLog("revoke", req.user._id, "patient", { employerId }, req.ip);

    successResponse(res, 200, "Access revoked successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get report sharing information
// @route   GET /api/reports/:reportId/sharing
// @access  Private (Patient only)
const getReportSharingInfo = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate("sharedWith.employer", "name companyName email");

    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    // Verify ownership
    if (report.patientId !== req.user.patientId) {
      return errorResponse(res, 403, "You can only view sharing info for your own reports");
    }

    successResponse(res, 200, "Sharing info fetched", {
      reportId: report._id,
      reportHash: report.reportHash,
      reportTitle: report.reportTitle,
      hasQR: !!report.qrCodePath,
      sharedWith: report.sharedWith || []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report statistics (admin only)
// @route   GET /api/reports/stats/overview
// @access  Private (Admin only)
const getReportStats = async (req, res, next) => {
  try {
    const totalReports = await Report.countDocuments();
    const verifiedReports = await Report.countDocuments({ verifiedCount: { $gt: 0 } });
    const reportsWithQR = await Report.countDocuments({ qrCodePath: { $exists: true, $ne: null } });
    const uniquePatients = await Report.distinct("patientId");
    const uniqueLabs = await Report.distinct("labId");
    
    // Reports by type
    const reportsByType = await Report.aggregate([
      { $group: { _id: "$reportType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Reports by month (last 12 months)
    const reportsByMonth = await Report.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    // Total verifications
    const totalVerifications = await Report.aggregate([
      { $group: { _id: null, total: { $sum: "$verifiedCount" } } }
    ]);

    successResponse(res, 200, "Statistics fetched", {
      totalReports,
      verifiedReports,
      reportsWithQR,
      totalVerifications: totalVerifications[0]?.total || 0,
      uniquePatientsCount: uniquePatients.length,
      uniqueLabsCount: uniqueLabs.length,
      reportsByType,
      reportsByMonth
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadReport,
  uploadReportWithQR,
  generateQRForReport,
  verifyReport,
  getReportByHash,
  downloadReportFile,
  listMyReports,
  getReportById,
  verifyReportById,
  shareReport,
  revokeReportAccess,
  getReportSharingInfo,
  getReportStats,
};