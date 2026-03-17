const User = require("../mongodb/models/User");
const Report = require("../mongodb/models/Report");
const { successResponse } = require("../utils/apiResponse");

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalLabs, totalReports, latestReports] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "lab" }),
      Report.countDocuments(),
      Report.find().sort({ createdAt: -1 }).limit(5).select("reportHash patientId labId createdAt"),
    ]);

    return successResponse(res, 200, "Admin dashboard stats", {
      totalUsers,
      totalLabs,
      totalReports,
      latestReports,
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return successResponse(res, 200, "Users fetched", { users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  listUsers,
};
