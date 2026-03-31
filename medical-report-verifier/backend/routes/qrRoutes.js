const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

// POST - Generate QR code for a report
router.post('/generate-qr', qrController.generateQR);

// GET - Verify a report by report hash
router.get('/verify/:reportHash', qrController.verifyReport);

// GET - Get full report details by report hash
router.get('/report/:reportHash', qrController.getReport);

// GET - Check if a lab is authorized
router.get('/lab/:labAddress', qrController.checkLabAuthorization);

// GET - Verification status (alternative endpoint)
router.get('/status/:reportHash', qrController.verifyReport);

// GET - Blockchain health check
router.get('/health', qrController.checkBlockchainConnection);

// GET - Get all reports (requires database storage)
router.get('/all', qrController.getAllReports);

module.exports = router;