import api from "./api";

export const uploadReportApi = async (formData) => {
  const response = await api.post("/reports/upload-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const verifyReportApi = async (formData) => {
  const response = await api.post("/reports/verify-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getReportByHashApi = async (hash) => {
  const response = await api.get(`/reports/report/${hash}`);
  return response.data;
};

export const getMyReportsApi = async () => {
  const response = await api.get("/reports/my-reports");
  return response.data;
};

export const getAdminStatsApi = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

export const getUsersApi = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};
