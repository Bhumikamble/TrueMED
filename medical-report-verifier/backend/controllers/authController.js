const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../mongodb/models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "verifier", labId, walletAddress } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, "name, email and password are required");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return errorResponse(res, 409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      labId: role === "lab" ? labId || `LAB-${Date.now()}` : null,
      walletAddress: walletAddress || null,
    });

    const token = generateToken(user._id);

    return successResponse(res, 201, "User registered", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        labId: user.labId,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    const token = generateToken(user._id);

    return successResponse(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        labId: user.labId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res) => {
  return successResponse(res, 200, "Profile fetched", { user: req.user });
};

module.exports = {
  register,
  login,
  profile,
};
