const jwt = require("jsonwebtoken");
const User = require("../mongodb/models/User");
const { errorResponse } = require("../utils/apiResponse");

// Protect routes - verify token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Not authorized, token missing");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both 'userId' and 'id' in token
    const userId = decoded.userId || decoded.id;
    
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return errorResponse(res, 401, "Not authorized, user not found");
    }

    // Check if account is active
    if (user.isActive === false) {
      return errorResponse(res, 401, "Account is disabled. Please contact support.");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return errorResponse(res, 401, "Not authorized, invalid token");
  }
};

// Authorize based on roles (alias for authorizeRoles for backward compatibility)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Not authorized");
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, `Access denied. Role '${req.user.role}' is not authorized to access this route. Allowed roles: ${allowedRoles.join(", ")}`);
    }

    next();
  };
};

// Alias for authorize (for backward compatibility)
const authorizeRoles = (...allowedRoles) => {
  return authorize(...allowedRoles);
};

// Check if user has specific permissions
const hasPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Not authorized");
    }

    // Admin has all permissions
    if (req.user.role === "admin") {
      return next();
    }

    // Role-based permissions mapping
    const rolePermissions = {
      patient: ["view_own_reports", "share_reports", "manage_consent", "view_reports"],
      lab: ["upload_reports", "view_own_reports", "verify_reports", "view_reports"],
      employer: ["verify_reports", "view_shared_reports", "request_access", "view_reports"],
      verifier: ["verify_reports", "view_reports"],
      admin: ["*"], // Admin has all permissions
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    // Check if user has all required permissions
    const hasRequiredPermissions = permissions.every(perm => 
      userPermissions.includes(perm) || userPermissions.includes("*")
    );

    if (!hasRequiredPermissions) {
      return errorResponse(res, 403, `You don't have permission to perform this action. Required: ${permissions.join(", ")}`);
    }

    next();
  };
};

// Check if user owns the resource (for patient-specific resources)
const checkOwnership = (getResourceId, resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = getResourceId(req);
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return errorResponse(res, 404, "Resource not found");
      }
      
      // Check if user owns the resource (for patients)
      if (req.user.role === "patient" && resource.patientId !== req.user.patientId) {
        return errorResponse(res, 403, "You don't own this resource");
      }
      
      // Check if user owns the resource (for labs)
      if (req.user.role === "lab" && resource.labId !== req.user.labId) {
        return errorResponse(res, 403, "You don't own this resource");
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      return errorResponse(res, 500, "Error checking ownership");
    }
  };
};

// Optional: Check if user is verified
const isVerified = (req, res, next) => {
  if (req.user && req.user.isVerified === false && req.user.role !== "admin") {
    return errorResponse(res, 403, "Please verify your email address to access this feature");
  }
  next();
};

// Optional: Rate limiting per user (simplified)
const userRateLimit = new Map();

const rateLimit = (windowMs = 60 * 1000, max = 60) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    const userRequests = userRateLimit.get(userId) || [];
    
    // Filter requests within the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= max) {
      return errorResponse(res, 429, `Too many requests. Please try again later.`);
    }
    
    recentRequests.push(now);
    userRateLimit.set(userId, recentRequests);
    
    next();
  };
};

// Get user role display name
const getRoleDisplayName = (role) => {
  const roleNames = {
    patient: "Patient",
    lab: "Laboratory",
    employer: "Employer",
    admin: "Administrator",
    verifier: "Verifier",
  };
  return roleNames[role] || role;
};

module.exports = {
  protect,
  authorize,
  authorizeRoles, // Kept for backward compatibility
  hasPermission,
  checkOwnership,
  isVerified,
  rateLimit,
  getRoleDisplayName,
};