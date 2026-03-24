import api from "./api";

// Register user with role-specific data
export const registerUser = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

// Login user
export const loginUser = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

// Fetch current user profile
export const fetchProfile = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Update user profile
export const updateProfile = async (payload) => {
  const response = await api.put("/auth/profile", payload);
  return response.data;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// Forgot password - request reset
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// Reset password with token
export const resetPassword = async (token, password) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

// Logout (optional - mostly client-side)
export const logoutUser = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    // Even if server logout fails, clear local data
    console.error("Logout error:", error);
    return { success: true };
  }
};

// Verify email
export const verifyEmail = async (token) => {
  const response = await api.post("/auth/verify-email", { token });
  return response.data;
};

// Resend verification email
export const resendVerification = async (email) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
};

// Get user's wallet address
export const getWalletAddress = async () => {
  const response = await api.get("/auth/wallet");
  return response.data;
};

// Update wallet address
export const updateWalletAddress = async (walletAddress) => {
  const response = await api.put("/auth/wallet", { walletAddress });
  return response.data;
};

// Get user statistics
export const getUserStats = async () => {
  const response = await api.get("/auth/stats");
  return response.data;
};

export default {
  registerUser,
  loginUser,
  fetchProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  verifyEmail,
  resendVerification,
  getWalletAddress,
  updateWalletAddress,
  getUserStats,
};