const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Report = require('../mongodb/models/Report');

// Get lab reports
router.get('/reports', protect, authorize('lab'), async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    let dateFilter = {};
    
    if (range === 'day') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
    } else if (range === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (range === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }
    
    const reports = await Report.find({ labId: req.user.labId, ...dateFilter })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get lab stats
router.get('/stats', protect, authorize('lab'), async (req, res) => {
  try {
    const totalReports = await Report.countDocuments({ labId: req.user.labId });
    const monthlyReports = await Report.countDocuments({
      labId: req.user.labId,
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    const uniquePatients = await Report.distinct('patientId', { labId: req.user.labId });
    
    res.json({ success: true, data: {
      totalReports,
      monthlyReports,
      uniquePatients: uniquePatients.length
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;