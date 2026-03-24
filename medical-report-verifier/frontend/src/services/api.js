import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For file uploads, don't set Content-Type (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network error - no response from server");
      return Promise.reject({
        message: "Network error. Please check your connection.",
        status: 0,
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      console.warn("Authentication error - logging out");
      localStorage.removeItem("token");
      // Optional: Redirect to login page if not already there
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }

    // Handle forbidden errors
    if (error.response.status === 403) {
      console.warn("Forbidden access");
      return Promise.reject({
        message: "You don't have permission to perform this action.",
        status: 403,
      });
    }

    // Handle rate limiting
    if (error.response.status === 429) {
      console.warn("Rate limit exceeded");
      return Promise.reject({
        message: "Too many requests. Please try again later.",
        status: 429,
      });
    }

    // Handle server errors
    if (error.response.status >= 500) {
      console.error("Server error:", error.response.status);
      return Promise.reject({
        message: "Server error. Please try again later.",
        status: error.response.status,
      });
    }

    return Promise.reject(error);
  }
);

// Helper methods for common API calls
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (currentPassword, newPassword) =>
    api.put("/auth/change-password", { currentPassword, newPassword }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),
};

export const reportAPI = {
  upload: (formData) => api.post("/reports/upload-report", formData),
  verify: (formData) => api.post("/reports/verify-report", formData),
  getByHash: (hash) => api.get(`/reports/report/${hash}`),
  getMyReports: () => api.get("/reports/my-reports"),
  download: (hash) => api.get(`/reports/report-file/${hash}`, { responseType: "blob" }),
  getStats: () => api.get("/reports/stats"),
};

export const patientAPI = {
  getMyReports: () => api.get("/patient/my-reports"),
  getSharedWithMe: () => api.get("/patient/shared-with-me"),
  getStats: () => api.get("/patient/stats"),
  getConsents: () => api.get("/patient/consents"),
  grantConsent: (data) => api.post("/patient/grant-consent", data),
  revokeConsent: (consentId) => api.delete(`/patient/consent/${consentId}`),
  shareReport: (reportId, data) => api.post(`/patient/share-report/${reportId}`, data),
};

export const labAPI = {
  getReports: (range = "week") => api.get(`/lab/reports?range=${range}`),
  getStats: () => api.get("/lab/stats"),
  getLabReports: () => api.get("/lab/my-reports"),
};

export const employerAPI = {
  getSharedReports: () => api.get("/employer/shared-reports"),
  verifyReport: (reportId) => api.post(`/employer/verify-report/${reportId}`),
  requestAccess: (data) => api.post("/employer/request-access", data),
  getStats: () => api.get("/employer/stats"),
  getAccessRequests: () => api.get("/employer/access-requests"),
};

export const adminAPI = {
  getUsers: () => api.get("/admin/users"),
  getStats: () => api.get("/admin/stats"),
  getReports: () => api.get("/admin/reports"),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getSystemHealth: () => api.get("/admin/health"),
};

// Utility function to handle file downloads
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

// Utility function to handle errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data?.message || "An error occurred",
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: "Network error. Please check your connection.",
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || "An unexpected error occurred",
      status: -1,
    };
  }
};

export default api;