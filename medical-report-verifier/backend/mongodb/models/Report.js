const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Core identification
    reportHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // Patient information
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    patientName: {
      type: String,
    },
    patientEmail: {
      type: String,
    },
    
    // Lab/Hospital information
    labId: {
      type: String,
      required: true,
      index: true,
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    labName: {
      type: String,
    },
    hospitalName: {
      type: String,
    },
    
    // File metadata
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileData: {
      type: Buffer,
      required: true,
      select: false,
    },
    fileExtension: {
      type: String,
    },
    
    // Report details
    reportType: {
      type: String,
      enum: [
        "blood_test",
        "urine_test",
        "xray",
        "mri",
        "ct_scan",
        "ultrasound",
        "ecg",
        "prescription",
        "vaccination",
        "covid_test",
        "physical_exam",
        "pathology",
        "radiology",
        "general",
        "other"
      ],
      default: "general",
    },
    reportTitle: {
      type: String,
      default: "Medical Report",
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    
    // Test results (for structured data)
    testResults: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    findings: {
      type: String,
    },
    diagnosis: {
      type: String,
    },
    prescription: {
      type: String,
    },
    doctorName: {
      type: String,
    },
    doctorId: {
      type: String,
    },
    
    // Blockchain data
    blockchainTxHash: {
      type: String,
      required: true,
      index: true,
    },
    blockNumber: {
      type: Number,
    },
    blockHash: {
      type: String,
    },
    transactionIndex: {
      type: Number,
    },
    blockchainVerified: {
      type: Boolean,
      default: true,
    },
    verifiedAt: {
      type: Date,
    },
    
    // Verification tracking
    verifiedCount: {
      type: Number,
      default: 0,
    },
    lastVerifiedAt: {
      type: Date,
    },
    verificationHistory: [{
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedByRole: {
        type: String,
        enum: ["patient", "lab", "employer", "admin", "verifier"],
      },
      verifiedAt: {
        type: Date,
        default: Date.now,
      },
      result: {
        type: String,
        enum: ["authentic", "tampered", "pending"],
      },
      ipAddress: String,
      userAgent: String,
    }],
    
    // Sharing permissions
    sharedWith: [{
      employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      employerId: String,
      employerName: String,
      sharedAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      },
      status: {
        type: String,
        enum: ["pending", "active", "expired", "revoked"],
        default: "pending",
      },
      accessCount: {
        type: Number,
        default: 0,
      },
      lastAccessedAt: Date,
      purpose: String,
    }],
    
    // Access control
    isPublic: {
      type: Boolean,
      default: false,
    },
    requiresConsent: {
      type: Boolean,
      default: true,
    },
    
    // Upload metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ["admin", "lab", "verifier", "patient", "employer"],
    },
    recordedAt: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Status flags
    status: {
      type: String,
      enum: ["active", "archived", "deleted", "expired", "disputed"],
      default: "active",
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isTampered: {
      type: Boolean,
      default: false,
    },
    
    // Dispute handling
    dispute: {
      raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      raisedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
      resolution: String,
      status: {
        type: String,
        enum: ["pending", "resolved", "dismissed"],
      },
    },
    
    // Audit trail
    auditLog: [{
      action: {
        type: String,
        enum: ["upload", "view", "verify", "share", "revoke", "archive", "dispute"],
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      performedByRole: String,
      performedAt: {
        type: Date,
        default: Date.now,
      },
      details: mongoose.Schema.Types.Mixed,
      ipAddress: String,
    }],
    
    // Additional metadata
    tags: [{
      type: String,
    }],
    notes: {
      type: String,
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate unique report ID before saving
reportSchema.pre("save", async function(next) {
  if (!this.reportId) {
    const count = await mongoose.model("Report").countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    this.reportId = `RPT${year}${month}${String(count + 1).padStart(6, "0")}`;
  }
  
  // Set expiry date if not set (default 1 year from report date)
  if (!this.expiryDate && this.reportDate) {
    this.expiryDate = new Date(this.reportDate);
    this.expiryDate.setFullYear(this.expiryDate.getFullYear() + 1);
  }
  
  next();
});

// Indexes for better query performance
reportSchema.index({ patientId: 1, reportDate: -1 });
reportSchema.index({ labId: 1, createdAt: -1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ "sharedWith.employer": 1, "sharedWith.status": 1 });

// Virtual for report age in days
reportSchema.virtual("ageInDays").get(function() {
  const days = (Date.now() - this.reportDate) / (1000 * 60 * 60 * 24);
  return Math.floor(days);
});

// Virtual for is expired
reportSchema.virtual("isExpired").get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Virtual for formatted hash
reportSchema.virtual("shortHash").get(function() {
  return this.reportHash ? `${this.reportHash.substring(0, 20)}...` : null;
});

// Method to check if employer has access
reportSchema.methods.hasEmployerAccess = function(employerId) {
  const share = this.sharedWith.find(
    s => s.employer.toString() === employerId.toString() && s.status === "active"
  );
  if (!share) return false;
  
  // Check if expired
  if (share.expiresAt && new Date() > share.expiresAt) {
    share.status = "expired";
    return false;
  }
  
  return true;
};

// Method to grant access to employer
reportSchema.methods.grantEmployerAccess = async function(employerId, employerName, durationDays = 30) {
  const existingShare = this.sharedWith.find(
    s => s.employer.toString() === employerId.toString()
  );
  
  if (existingShare) {
    existingShare.status = "active";
    existingShare.expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      employer: employerId,
      employerId: employerId,
      employerName: employerName,
      sharedAt: new Date(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      status: "active",
    });
  }
  
  await this.save();
  return this;
};

// Method to revoke employer access
reportSchema.methods.revokeEmployerAccess = async function(employerId) {
  const share = this.sharedWith.find(
    s => s.employer.toString() === employerId.toString()
  );
  
  if (share) {
    share.status = "revoked";
    await this.save();
  }
  
  return this;
};

// Method to record verification
reportSchema.methods.recordVerification = async function(userId, userRole, result, ipAddress = null, userAgent = null) {
  this.verifiedCount += 1;
  this.lastVerifiedAt = new Date();
  
  this.verificationHistory.push({
    verifiedBy: userId,
    verifiedByRole: userRole,
    verifiedAt: new Date(),
    result,
    ipAddress,
    userAgent,
  });
  
  await this.save();
  return this;
};

// Method to add audit log entry
reportSchema.methods.addAuditLog = async function(action, userId, userRole, details = {}, ipAddress = null) {
  this.auditLog.push({
    action,
    performedBy: userId,
    performedByRole: userRole,
    performedAt: new Date(),
    details,
    ipAddress,
  });
  
  await this.save();
  return this;
};

// Static method to find reports by patient
reportSchema.statics.findByPatient = function(patientId, includeExpired = false) {
  const query = { patientId };
  if (!includeExpired) {
    query.status = "active";
    query.expiryDate = { $gt: new Date() };
  }
  return this.find(query).sort({ reportDate: -1 });
};

// Static method to find reports shared with employer
reportSchema.statics.findSharedWithEmployer = function(employerId) {
  return this.find({
    "sharedWith.employer": employerId,
    "sharedWith.status": "active",
    status: "active",
  }).sort({ createdAt: -1 });
};

// Static method to get report statistics
reportSchema.statics.getStatistics = async function(labId = null) {
  const match = labId ? { labId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalVerifications: { $sum: "$verifiedCount" },
        averageVerifications: { $avg: "$verifiedCount" },
        uniquePatients: { $addToSet: "$patientId" },
        reportsByType: { $push: "$reportType" },
      },
    },
    {
      $project: {
        totalReports: 1,
        totalVerifications: 1,
        averageVerifications: { $round: ["$averageVerifications", 2] },
        uniquePatientsCount: { $size: "$uniquePatients" },
        reportsByType: "$reportsByType",
      },
    },
  ]);
  
  return stats[0] || {
    totalReports: 0,
    totalVerifications: 0,
    averageVerifications: 0,
    uniquePatientsCount: 0,
    reportsByType: [],
  };
};

module.exports = mongoose.model("Report", reportSchema);