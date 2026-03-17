const jwt = require("jsonwebtoken");
const User = require("../mongodb/models/User");
const { errorResponse } = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Not authorized, token missing");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return errorResponse(res, 401, "Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, "Not authorized, invalid token");
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, "Access denied for this role");
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
