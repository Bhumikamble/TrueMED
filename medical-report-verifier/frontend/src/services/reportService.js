import api from "./api";

// ==================== REPORT APIs ====================

// Upload report (Lab only) - Traditional upload
export const uploadReportApi = async (formData, onProgress) => {
  const response = await api.post("/reports/upload-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });
  return response.data;
};

// Upload report with QR code generation (Lab only)
export const uploadReportWithQRApi = async (formData, onProgress) => {
  const response = await api.post("/reports/upload-with-qr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });
  return response.data;
};

// Generate QR code for existing report (Lab/Patient/Admin)
export const generateQRForReportApi = async (reportId) => {
  const response = await api.post(`/reports/generate-qr/${reportId}`);
  return response.data;
};

// Verify report by file (Public)
export const verifyReportApi = async (formData) => {
  const response = await api.post("/reports/verify-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Get report by hash (Public with limited info)
export const getReportByHashApi = async (hash) => {
  const response = await api.get(`/reports/report/${hash}`);
  return response.data;
};

// Get my reports (Role-based: Patient, Lab, Employer)
export const getMyReportsApi = async () => {
  const response = await api.get("/reports/my-reports");
  return response.data;
};

// Get report by ID (Private with access control)
export const getReportByIdApi = async (reportId) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data;
};

// Verify report by ID (Private with access control)
export const verifyReportByIdApi = async (reportId) => {
  const response = await api.post(`/reports/verify/${reportId}`);
  return response.data;
};

// Download report file (Private with access control)
export const downloadReportApi = async (hash) => {
  const response = await api.get(`/reports/report-file/${hash}`, {
    responseType: "blob",
  });
  return response.data;
};

// Share report with employer (Patient only)
export const shareReportApi = async (reportId, data) => {
  const response = await api.post(`/reports/share/${reportId}`, data);
  return response.data;
};

// Revoke employer access (Patient only)
export const revokeAccessApi = async (reportId, employerId) => {
  const response = await api.delete(`/reports/share/${reportId}/${employerId}`);
  return response.data;
};

// Get report sharing info (Patient only)
export const getReportSharingInfoApi = async (reportId) => {
  const response = await api.get(`/reports/${reportId}/sharing`);
  return response.data;
};

// Get report statistics (Admin only)
export const getReportStatsApi = async () => {
  const response = await api.get("/reports/stats/overview");
  return response.data;
};

// ==================== PATIENT APIs ====================

// Get patient's own reports
export const getPatientReportsApi = async () => {
  const response = await api.get("/patient/my-reports");
  return response.data;
};

// Get reports shared with patient
export const getSharedWithMeApi = async () => {
  const response = await api.get("/patient/shared-with-me");
  return response.data;
};

// Get patient statistics
export const getPatientStatsApi = async () => {
  const response = await api.get("/patient/stats");
  return response.data;
};

// Get patient consents
export const getPatientConsentsApi = async () => {
  const response = await api.get("/patient/consents");
  return response.data;
};

// Grant consent to employer
export const grantConsentApi = async (data) => {
  const response = await api.post("/patient/grant-consent", data);
  return response.data;
};

// Revoke consent
export const revokeConsentApi = async (consentId) => {
  const response = await api.delete(`/patient/consent/${consentId}`);
  return response.data;
};

// ==================== LAB APIs ====================

// Get lab reports with date range
export const getLabReportsApi = async (range = "week") => {
  const response = await api.get(`/lab/reports?range=${range}`);
  return response.data;
};

// Get lab statistics
export const getLabStatsApi = async () => {
  const response = await api.get("/lab/stats");
  return response.data;
};

// Get lab's uploaded reports
export const getLabMyReportsApi = async () => {
  const response = await api.get("/lab/my-reports");
  return response.data;
};

// ==================== EMPLOYER APIs ====================

// Get reports shared with employer
export const getEmployerSharedReportsApi = async () => {
  const response = await api.get("/employer/shared-reports");
  return response.data;
};

// Verify report as employer
export const employerVerifyReportApi = async (reportId) => {
  const response = await api.post(`/employer/verify-report/${reportId}`);
  return response.data;
};

// Request access to report
export const requestAccessApi = async (data) => {
  const response = await api.post("/employer/request-access", data);
  return response.data;
};

// Get employer statistics
export const getEmployerStatsApi = async () => {
  const response = await api.get("/employer/stats");
  return response.data;
};

// Get employer access requests
export const getAccessRequestsApi = async () => {
  const response = await api.get("/employer/access-requests");
  return response.data;
};

// ==================== ADMIN APIs ====================

// Get all users (Admin only)
export const getUsersApi = async (params = {}) => {
  const { role, search, page = 1, limit = 20 } = params;
  let url = `/admin/users?page=${page}&limit=${limit}`;
  if (role) url += `&role=${role}`;
  if (search) url += `&search=${search}`;
  const response = await api.get(url);
  return response.data;
};

// Get single user (Admin only)
export const getUserByIdApi = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

// Update user role (Admin only)
export const updateUserRoleApi = async (userId, role) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

// Toggle user status (Admin only)
export const toggleUserStatusApi = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/toggle-status`);
  return response.data;
};

// Delete user (Admin only)
export const deleteUserApi = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// Get all reports (Admin only)
export const getAdminReportsApi = async (params = {}) => {
  const { status, page = 1, limit = 20 } = params;
  let url = `/admin/reports?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  const response = await api.get(url);
  return response.data;
};

// Get admin statistics
export const getAdminStatsApi = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

// Get system health
export const getSystemHealthApi = async () => {
  const response = await api.get("/admin/health");
  return response.data;
};

// ==================== AUTH APIs (Additional) ====================

// Update profile
export const updateProfileApi = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

// Change password
export const changePasswordApi = async (currentPassword, newPassword) => {
  const response = await api.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// Forgot password
export const forgotPasswordApi = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// Reset password
export const resetPasswordApi = async (token, password) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

// Get wallet address
export const getWalletAddressApi = async () => {
  const response = await api.get("/auth/wallet");
  return response.data;
};

// Update wallet address
export const updateWalletAddressApi = async (walletAddress) => {
  const response = await api.put("/auth/wallet", { walletAddress });
  return response.data;
};

// Get user stats
export const getUserStatsApi = async () => {
  const response = await api.get("/auth/stats");
  return response.data;
};

// ==================== QR CODE UTILITIES ====================

// Helper function to download QR code
export const downloadQRCode = (qrDataUrl, filename = "qr-code.png") => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = qrDataUrl;
  link.click();
};

// Helper function to get verification URL
export const getVerificationUrl = (reportHash) => {
  return `${window.location.origin}/verify-qr?hash=${reportHash}`;
};

// ==================== UTILITY FUNCTIONS ====================

// Helper function to handle file downloads
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: "blob" });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

// Format report hash for display
export const formatReportHash = (hash) => {
  if (!hash) return "";
  if (hash.length <= 20) return hash;
  return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Export all as default object for convenience
export default {
  // Report APIs
  uploadReportApi,
  uploadReportWithQRApi,
  generateQRForReportApi,
  verifyReportApi,
  getReportByHashApi,
  getMyReportsApi,
  getReportByIdApi,
  verifyReportByIdApi,
  downloadReportApi,
  shareReportApi,
  revokeAccessApi,
  getReportSharingInfoApi,
  getReportStatsApi,
  
  // Patient APIs
  getPatientReportsApi,
  getSharedWithMeApi,
  getPatientStatsApi,
  getPatientConsentsApi,
  grantConsentApi,
  revokeConsentApi,
  
  // Lab APIs
  getLabReportsApi,
  getLabStatsApi,
  getLabMyReportsApi,
  
  // Employer APIs
  getEmployerSharedReportsApi,
  employerVerifyReportApi,
  requestAccessApi,
  getEmployerStatsApi,
  getAccessRequestsApi,
  
  // Admin APIs
  getUsersApi,
  getUserByIdApi,
  updateUserRoleApi,
  toggleUserStatusApi,
  deleteUserApi,
  getAdminReportsApi,
  getAdminStatsApi,
  getSystemHealthApi,
  
  // Auth APIs
  updateProfileApi,
  changePasswordApi,
  forgotPasswordApi,
  resetPasswordApi,
  getWalletAddressApi,
  updateWalletAddressApi,
  getUserStatsApi,
  
  // QR Utilities
  downloadQRCode,
  getVerificationUrl,
  
  // Utilities
  downloadFile,
  formatReportHash,
  formatFileSize,
};