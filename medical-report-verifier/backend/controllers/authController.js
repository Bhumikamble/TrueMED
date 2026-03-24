const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../mongodb/models/User");
const Report = require("../mongodb/models/Report");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role = "patient", 
      labId, 
      walletAddress,
      // Patient fields
      patientId,
      dateOfBirth,
      phoneNumber,
      address,
      // Lab fields
      hospitalName,
      licenseNumber,
      labPhone,
      labAddress,
      // Employer fields
      employerId,
      companyName,
      department,
      position,
      companyPhone,
      companyAddress,
    } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, "name, email and password are required");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return errorResponse(res, 409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data based on role
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      walletAddress: walletAddress || null,
      isVerified: false,
      isActive: true,
    };

    // Add role-specific fields
    if (role === "patient") {
      userData.patientId = patientId || null;
      userData.dateOfBirth = dateOfBirth || null;
      userData.phoneNumber = phoneNumber || null;
      if (address) userData.address = address;
    } else if (role === "lab") {
      userData.labId = labId || `LAB-${Date.now()}`;
      userData.hospitalName = hospitalName || null;
      userData.licenseNumber = licenseNumber || null;
      userData.labPhone = labPhone || null;
      if (labAddress) userData.labAddress = labAddress;
    } else if (role === "employer") {
      userData.employerId = employerId || `EMP-${Date.now()}`;
      userData.companyName = companyName || null;
      userData.department = department || null;
      userData.position = position || null;
      userData.companyPhone = companyPhone || null;
      if (companyAddress) userData.companyAddress = companyAddress;
    } else if (role === "verifier") {
      userData.role = "verifier";
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    return successResponse(res, 201, "User registered successfully", {
      token,
      user: user.getProfileInfo(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    // Check if account is active
    if (user.isActive === false) {
      return errorResponse(res, 401, "Account is disabled. Please contact support.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return successResponse(res, 200, "Login successful", {
      token,
      user: user.getProfileInfo(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const profile = async (req, res) => {
  return successResponse(res, 200, "Profile fetched", { user: req.user.getProfileInfo() });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, address, dateOfBirth, ...roleSpecific } = req.body;

    // Update basic info
    if (name) req.user.name = name;
    if (phoneNumber) req.user.phoneNumber = phoneNumber;
    if (address) req.user.address = address;

    // Update role-specific fields
    if (req.user.role === "patient") {
      if (dateOfBirth) req.user.dateOfBirth = dateOfBirth;
      if (roleSpecific.patientId) req.user.patientId = roleSpecific.patientId;
    } else if (req.user.role === "lab") {
      if (roleSpecific.hospitalName) req.user.hospitalName = roleSpecific.hospitalName;
      if (roleSpecific.labPhone) req.user.labPhone = roleSpecific.labPhone;
      if (roleSpecific.labAddress) req.user.labAddress = roleSpecific.labAddress;
      if (roleSpecific.licenseNumber) req.user.licenseNumber = roleSpecific.licenseNumber;
    } else if (req.user.role === "employer") {
      if (roleSpecific.companyName) req.user.companyName = roleSpecific.companyName;
      if (roleSpecific.department) req.user.department = roleSpecific.department;
      if (roleSpecific.position) req.user.position = roleSpecific.position;
      if (roleSpecific.companyPhone) req.user.companyPhone = roleSpecific.companyPhone;
      if (roleSpecific.companyAddress) req.user.companyAddress = roleSpecific.companyAddress;
    }

    await req.user.save();
    return successResponse(res, 200, "Profile updated successfully", { user: req.user.getProfileInfo() });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, "Current password and new password are required");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return errorResponse(res, 401, "Current password is incorrect");
    }

    // Hash new password
    req.user.password = await bcrypt.hash(newPassword, 10);
    await req.user.save();

    return successResponse(res, 200, "Password updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist for security
      return successResponse(res, 200, "If an account exists, a reset link has been sent");
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // In production, send email with reset link
    // For now, just return the token in development
    const response = { message: "Password reset link sent" };
    if (process.env.NODE_ENV === "development") {
      response.resetToken = resetToken;
    }

    return successResponse(res, 200, "Password reset email sent", response);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return errorResponse(res, 400, "Token and new password are required");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired reset token");
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return successResponse(res, 200, "Password reset successfully");
  } catch (error) {
    return errorResponse(res, 400, "Invalid or expired reset token");
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return errorResponse(res, 400, "Verification token is required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 400, "Invalid verification token");
    }

    user.isVerified = true;
    await user.save();

    return successResponse(res, 200, "Email verified successfully");
  } catch (error) {
    return errorResponse(res, 400, "Invalid or expired verification token");
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return successResponse(res, 200, "If an account exists, a verification link has been sent");
    }

    if (user.isVerified) {
      return successResponse(res, 200, "Email already verified");
    }

    // Generate verification token
    const verifyToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // In production, send email with verification link
    const response = { message: "Verification email sent" };
    if (process.env.NODE_ENV === "development") {
      response.verifyToken = verifyToken;
    }

    return successResponse(res, 200, "Verification email sent", response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet address
// @route   GET /api/auth/wallet
// @access  Private
const getWalletAddress = async (req, res) => {
  return successResponse(res, 200, "Wallet address fetched", { 
    walletAddress: req.user.walletAddress 
  });
};

// @desc    Update wallet address
// @route   PUT /api/auth/wallet
// @access  Private
const updateWalletAddress = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return errorResponse(res, 400, "Wallet address is required");
    }

    req.user.walletAddress = walletAddress;
    await req.user.save();

    return successResponse(res, 200, "Wallet address updated successfully", { 
      walletAddress: req.user.walletAddress 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
const getUserStats = async (req, res, next) => {
  try {
    let stats = {};

    if (req.user.role === "patient") {
      stats.totalReports = await Report.countDocuments({ patientId: req.user.patientId });
      stats.sharedReports = await Report.countDocuments({ 
        patientId: req.user.patientId,
        "sharedWith.0": { $exists: true }
      });
      stats.verifiedReports = await Report.countDocuments({ 
        patientId: req.user.patientId,
        verifiedCount: { $gt: 0 }
      });
    } else if (req.user.role === "lab") {
      stats.totalReports = await Report.countDocuments({ labId: req.user.labId });
      const uniquePatients = await Report.distinct("patientId", { labId: req.user.labId });
      stats.uniquePatientsCount = uniquePatients.length;
      stats.monthlyReports = await Report.countDocuments({ 
        labId: req.user.labId,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });
    } else if (req.user.role === "employer") {
      stats.sharedReports = await Report.countDocuments({
        "sharedWith.employer": req.user._id,
        "sharedWith.status": "active"
      });
      stats.verifiedReports = await Report.countDocuments({
        "sharedWith.employer": req.user._id,
        verifiedCount: { $gt: 0 }
      });
    }

    return successResponse(res, 200, "User stats fetched", stats);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (optional)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  return successResponse(res, 200, "Logged out successfully");
};

module.exports = {
  register,
  login,
  profile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getWalletAddress,
  updateWalletAddress,
  getUserStats,
  logout,
};