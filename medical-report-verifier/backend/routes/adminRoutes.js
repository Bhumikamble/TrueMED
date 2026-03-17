const express = require("express");

const { getDashboardStats, listUsers } = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);
router.get("/users", protect, authorizeRoles("admin"), listUsers);

module.exports = router;
