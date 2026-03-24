const User = require("../mongodb/models/User");
const Report = require("../mongodb/models/Report");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalLabs,
      totalEmployers,
      totalAdmins,
      totalReports,
      totalVerifications,
      activeReports,
      recentReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "lab" }),
      User.countDocuments({ role: "employer" }),
      User.countDocuments({ role: "admin" }),
      Report.countDocuments(),
      Report.aggregate([{ $group: { _id: null, total: { $sum: "$verifiedCount" } } }]),
      Report.countDocuments({ status: "active" }),
      Report.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("reportHash patientId labId reportType createdAt")
        .populate("patient", "name email")
        .populate("lab", "name hospitalName")
    ]);

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

    return successResponse(res, 200, "Admin dashboard stats", {
      users: {
        total: totalUsers,
        patients: totalPatients,
        labs: totalLabs,
        employers: totalEmployers,
        admins: totalAdmins
      },
      reports: {
        total: totalReports,
        verifications: totalVerifications[0]?.total || 0,
        active: activeReports
      },
      reportsByType,
      reportsByMonth,
      recentReports
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const listUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let query = {};

    // Filter by role
    if (role && role !== "all") {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return successResponse(res, 200, "Users fetched", {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:userId
// @access  Private (Admin only)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    
    // Get user's reports count
    let reportsCount = 0;
    if (user.role === "patient") {
      reportsCount = await Report.countDocuments({ patientId: user.patientId });
    } else if (user.role === "lab") {
      reportsCount = await Report.countDocuments({ labId: user.labId });
    }
    
    return successResponse(res, 200, "User fetched", {
      user,
      stats: {
        reportsCount
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:userId/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    
    if (!role || !["patient", "lab", "employer", "admin", "verifier"].includes(role)) {
      return errorResponse(res, 400, "Invalid role");
    }
    
    // Prevent changing own role if you're the only admin
    if (req.user._id.toString() === userId && role !== "admin") {
      return errorResponse(res, 403, "You cannot change your own admin role");
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    
    const oldRole = user.role;
    user.role = role;
    await user.save();
    
    // Add audit log
    await user.addAuditLog("role_change", req.user._id, {
      oldRole,
      newRole: role,
      changedBy: req.user.email
    });
    
    return successResponse(res, 200, "User role updated successfully", {
      user: user.getProfileInfo()
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:userId/toggle-status
// @access  Private (Admin only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Prevent disabling your own account
    if (req.user._id.toString() === userId) {
      return errorResponse(res, 403, "You cannot disable your own account");
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    // Add audit log
    await user.addAuditLog("status_toggle", req.user._id, {
      newStatus: user.isActive ? "active" : "disabled",
      changedBy: req.user.email
    });
    
    return successResponse(res, 200, `User ${user.isActive ? "enabled" : "disabled"} successfully`, {
      user: user.getProfileInfo()
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Prevent deleting your own account
    if (req.user._id.toString() === userId) {
      return errorResponse(res, 403, "You cannot delete your own account");
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    
    // Delete associated reports if user is lab or patient
    if (user.role === "lab") {
      await Report.deleteMany({ labId: user.labId });
    } else if (user.role === "patient") {
      await Report.deleteMany({ patientId: user.patientId });
    }
    
    await User.findByIdAndDelete(userId);
    
    return successResponse(res, 200, "User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    next(error);
  }
};

// @desc    Get all reports (admin view)
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const listReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reports = await Report.find(query)
      .populate("patient", "name email patientId")
      .populate("lab", "name hospitalName labId")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(query);
    
    return successResponse(res, 200, "Reports fetched", {
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    next(error);
  }
};

// @desc    Delete report
// @route   DELETE /api/admin/reports/:reportId
// @access  Private (Admin only)
const deleteReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId);
    if (!report) {
      return errorResponse(res, 404, "Report not found");
    }
    
    await Report.findByIdAndDelete(reportId);
    
    return successResponse(res, 200, "Report deleted successfully");
  } catch (error) {
    console.error("Error deleting report:", error);
    next(error);
  }
};

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin only)
const getSystemHealth = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    // Get recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = await Report.countDocuments({ createdAt: { $gte: last24Hours } });
    const recentUsers = await User.countDocuments({ createdAt: { $gte: last24Hours } });
    
    return successResponse(res, 200, "System health", {
      status: "healthy",
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      activity: {
        reportsLast24h: recentReports,
        usersLast24h: recentUsers
      }
    });
  } catch (error) {
    console.error("Error fetching system health:", error);
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  listUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  listReports,
  deleteReport,
  getSystemHealth
};