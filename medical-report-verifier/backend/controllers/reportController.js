const Report = require("../mongodb/models/Report");
const { generateSHA256Hash } = require("../services/hashService");
const {
  addReportOnChain,
  verifyReportOnChain,
  getReportFromChain,
  isBlockchainEnabled,
} = require("../services/blockchainService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const uploadReport = async (req, res, next) => {
  try {
    const { patientId } = req.body;
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

    const chainResult = await addReportOnChain({
      reportHash,
      patientId,
      labId,
    });

    const report = await Report.create({
      reportHash,
      patientId,
      labId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: file.buffer,
      blockchainTxHash: chainResult.txHash,
      uploadedBy: req.user._id,
      recordedAt: Date.now(),
    });

    return successResponse(res, 201, "Report uploaded and anchored on blockchain", {
      report,
      chainResult,
    });
  } catch (error) {
    next(error);
  }
};

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

    return successResponse(res, 200, "Verification completed", {
      reportHash,
      isAuthentic,
      blockchainRecord: chainReport,
      databaseRecord: dbReport,
      fileStoredInDatabase: Boolean(dbReport),
      verificationSource: blockchainEnabled ? "blockchain+database" : "database-only-local-mode",
    });
  } catch (error) {
    next(error);
  }
};

const getReportByHash = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const blockchainEnabled = isBlockchainEnabled();
    const [dbReport, chainReport] = await Promise.all([
      Report.findOne({ reportHash: hash }).populate("uploadedBy", "name email role"),
      getReportFromChain(hash),
    ]);

    if (!dbReport && !(chainReport && chainReport.exists)) {
      return errorResponse(res, 404, "Report not found");
    }

    return successResponse(res, 200, "Report fetched", {
      databaseRecord: dbReport,
      blockchainRecord: chainReport,
      fileStoredInDatabase: Boolean(dbReport),
      mode: blockchainEnabled ? "blockchain" : "local-no-deploy",
    });
  } catch (error) {
    next(error);
  }
};

const downloadReportFile = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const report = await Report.findOne({ reportHash: hash }).select(
      "+fileData fileName mimeType"
    );

    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }

    res.setHeader("Content-Type", report.mimeType);
    res.setHeader("Content-Disposition", `inline; filename=\"${report.fileName}\"`);
    return res.send(report.fileData);
  } catch (error) {
    next(error);
  }
};

const listMyReports = async (req, res, next) => {
  try {
    const query = req.user.role === "lab" ? { uploadedBy: req.user._id } : {};
    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(100);

    return successResponse(res, 200, "Reports fetched", { reports });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadReport,
  verifyReport,
  getReportByHash,
  downloadReportFile,
  listMyReports,
};
