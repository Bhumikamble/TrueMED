const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Protected routes (require authentication)
router.get("/me", protect, profile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

// Wallet routes
router.get("/wallet", protect, getWalletAddress);
router.put("/wallet", protect, updateWalletAddress);

// User statistics
router.get("/stats", protect, getUserStats);

// Admin-only routes
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const User = require("../mongodb/models/User");
    const users = await User.find({}).select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/users/:userId/role", protect, authorize("admin"), async (req, res) => {
  try {
    const User = require("../mongodb/models/User");
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/users/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const User = require("../mongodb/models/User");
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;