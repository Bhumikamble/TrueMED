const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const connectDB = require("./mongodb/config/db");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const patientRoutes = require("./routes/patientRoutes");
const employerRoutes = require("./routes/employerRoutes");
const labRoutes = require("./routes/labRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== CORS CONFIGURATION (MUST COME FIRST) ====================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CORS_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Length", "X-Requested-With"],
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Log CORS configuration in development
if (process.env.NODE_ENV !== "production") {
  console.log("✅ CORS enabled for origins:", allowedOrigins);
}

// ==================== OTHER MIDDLEWARE ====================
// Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable for development
}));

// Compression for better performance
app.use(compression());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing with increased limits for file uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware (for development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });
}

// ==================== HEALTH ENDPOINTS ====================
// Simple health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin,
    },
  });
});

// Detailed health check with database status
app.get("/api/health/detailed", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      blockchain: {
        enabled: process.env.BLOCKCHAIN_ENABLED === "true",
        network: "sepolia",
        contract: process.env.CONTRACT_ADDRESS ? "deployed" : "not deployed",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// API version info
app.get("/api/version", (req, res) => {
  res.status(200).json({
    success: true,
    version: "1.0.0",
    name: "TrueMED Blockchain Medical Report Verifier",
    description: "Tamper-evident verification platform for medical reports",
  });
});

// ==================== API ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/lab", labRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to TrueMED API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      version: "/api/version",
      auth: "/api/auth",
      reports: "/api/reports",
      patient: "/api/patient",
      employer: "/api/employer",
      lab: "/api/lab",
      admin: "/api/admin",
    },
    documentation: "https://github.com/yourusername/medical-report-verifier",
  });
});

// ==================== ERROR HANDLING ====================
// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== SERVER STARTUP ====================
// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log("\n🛑 Received shutdown signal, closing server...");
  
  // Close server
  if (server) {
    server.close(() => {
      console.log("✅ Server closed");
      
      // Close database connection
      const mongoose = require("mongoose");
      mongoose.connection.close(false, () => {
        console.log("✅ MongoDB connection closed");
        process.exit(0);
      });
    });
  }
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error("❌ Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

// Start server with connection handling
let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ MongoDB connected successfully");
    
    // Start listening
    server = app.listen(PORT, () => {
      console.log("\n========================================");
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 CORS origin: ${allowedOrigins.join(", ")}`);
      console.log(`⛓️  Blockchain mode: ${process.env.BLOCKCHAIN_ENABLED === "true" ? "ENABLED" : "DISABLED"}`);
      if (process.env.BLOCKCHAIN_ENABLED === "true") {
        console.log(`📜 Contract address: ${process.env.CONTRACT_ADDRESS || "Not deployed"}`);
      }
      console.log("========================================\n");
    });
    
    // Handle graceful shutdown
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
    
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});

startServer();

module.exports = { app, server };