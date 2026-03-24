const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "lab", "verifier", "patient", "employer"],
      default: "patient",
    },
    
    // Fields for patients
    patientId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    
    // Fields for labs/hospitals
    labId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    hospitalName: {
      type: String,
      default: null,
    },
    licenseNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    labAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    labPhone: {
      type: String,
      default: null,
    },
    labEmail: {
      type: String,
      default: null,
    },
    registrationNumber: {
      type: String,
      default: null,
    },
    
    // Fields for employers
    employerId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    companyName: {
      type: String,
      default: null,
    },
    companyRegistrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    department: {
      type: String,
      default: null,
    },
    position: {
      type: String,
      default: null,
    },
    companyAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    companyPhone: {
      type: String,
      default: null,
    },
    
    // Fields for all users
    walletAddress: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    
    // Consent management for patients
    consentGivenTo: [{
      employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      employerId: String,
      employerName: String,
      reportIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      }],
      validFrom: {
        type: Date,
        default: Date.now,
      },
      validUntil: {
        type: Date,
        default: () => new Date(+new Date() + 90 * 24 * 60 * 60 * 1000),
      },
      approvedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "active", "expired", "revoked"],
        default: "active",
      },
      purpose: String,
    }],
    
    // Report access requests (for employers)
    accessRequests: [{
      report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      },
      reportHash: String,
      patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "expired"],
        default: "pending",
      },
      message: String,
    }],
    
    // Audit trail
    auditLog: [{
      action: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      performedAt: {
        type: Date,
        default: Date.now,
      },
      details: mongoose.Schema.Types.Mixed,
    }],
  },
  { timestamps: true }
);

// Generate unique IDs for different roles
userSchema.pre("save", async function(next) {
  // Generate patientId for patients
  if (this.role === "patient" && !this.patientId) {
    const count = await mongoose.model("User").countDocuments({ role: "patient" });
    this.patientId = `PAT${String(count + 1).padStart(6, "0")}`;
  }
  
  // Generate labId for labs
  if (this.role === "lab" && !this.labId) {
    const count = await mongoose.model("User").countDocuments({ role: "lab" });
    this.labId = `LAB${String(count + 1).padStart(6, "0")}`;
  }
  
  // Generate employerId for employers
  if (this.role === "employer" && !this.employerId) {
    const count = await mongoose.model("User").countDocuments({ role: "employer" });
    this.employerId = `EMP${String(count + 1).padStart(6, "0")}`;
  }
  
  next();
});

// Ensure that role-specific fields are cleared for other roles
userSchema.pre("save", function(next) {
  if (this.role !== "patient") {
    this.patientId = undefined;
    this.dateOfBirth = null;
    this.emergencyContact = undefined;
  }
  
  if (this.role !== "lab") {
    this.labId = undefined;
    this.hospitalName = null;
    this.licenseNumber = undefined;
    this.labAddress = undefined;
    this.labPhone = null;
    this.registrationNumber = null;
  }
  
  if (this.role !== "employer") {
    this.employerId = undefined;
    this.companyName = null;
    this.companyRegistrationNumber = undefined;
    this.department = null;
    this.position = null;
    this.companyAddress = undefined;
    this.companyPhone = null;
  }
  
  next();
});

// Virtual for full name
userSchema.virtual("fullName").get(function() {
  return this.name;
});

// Method to check if user is active
userSchema.methods.isActiveUser = function() {
  return this.isActive;
};

// Method to get user type specific info
userSchema.methods.getProfileInfo = function() {
  const baseInfo = {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    walletAddress: this.walletAddress,
    isVerified: this.isVerified,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
  
  switch (this.role) {
    case "patient":
      return {
        ...baseInfo,
        patientId: this.patientId,
        dateOfBirth: this.dateOfBirth,
        phoneNumber: this.phoneNumber,
        address: this.address,
      };
    case "lab":
      return {
        ...baseInfo,
        labId: this.labId,
        hospitalName: this.hospitalName,
        licenseNumber: this.licenseNumber,
        labAddress: this.labAddress,
        labPhone: this.labPhone,
      };
    case "employer":
      return {
        ...baseInfo,
        employerId: this.employerId,
        companyName: this.companyName,
        department: this.department,
        position: this.position,
        companyAddress: this.companyAddress,
      };
    default:
      return baseInfo;
  }
};

// Method to add audit log entry
userSchema.methods.addAuditLog = async function(action, performedBy, details = {}) {
  this.auditLog.push({
    action,
    performedBy,
    performedAt: new Date(),
    details,
  });
  await this.save();
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role });
};

// Static method to get user statistics
userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    total: 0,
    patient: 0,
    lab: 0,
    employer: 0,
    admin: 0,
    verifier: 0,
  };
  
  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

module.exports = mongoose.model("User", userSchema);