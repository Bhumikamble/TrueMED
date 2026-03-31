const QRCode = require('qrcode');
const { ethers } = require('ethers');

// Contract ABI - EXACT match from your contract (verified via hardhat console)
const CONTRACT_ABI = [
  "function addReport(string memory reportHash, string memory patientId, string memory labId) external",
  "function getReport(string memory reportHash) external view returns (tuple(string reportHash, string patientId, string labId, uint256 timestamp, bool exists))",
  "function verifyReport(string memory reportHash) external view returns (bool)",
  "function setLabAuthorization(address lab, bool isAuthorized) external",
  "function authorizedLabs(address) external view returns (bool)",
  "function owner() external view returns (address)",
  "function renounceOwnership() external",
  "function transferOwnership(address newOwner) external"
];

// Helper to ensure hash has 0x prefix
const ensureHashPrefix = (hash) => {
  if (!hash) return null;
  if (hash.startsWith('0x')) return hash;
  if (/^[0-9a-fA-F]{64}$/.test(hash)) {
    return '0x' + hash;
  }
  return hash;
};

// Generate QR code for a report
exports.generateQR = async (req, res) => {
  try {
    const { reportHash, patientId, patientName, labId, labName, reportType, reportTitle } = req.body;
    
    const formattedHash = ensureHashPrefix(reportHash);
    
    const qrData = {
      reportHash: formattedHash || reportHash,
      patientId: patientId,
      patientName: patientName,
      labId: labId,
      labName: labName,
      reportType: reportType,
      reportTitle: reportTitle,
      contractAddress: process.env.CONTRACT_ADDRESS,
      issuedDate: new Date().toISOString(),
      verificationUrl: `${process.env.FRONTEND_URL}/verify-qr?hash=${formattedHash || reportHash}`
    };
    
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: {
        dark: '#1a4d8c',
        light: '#ffffff'
      }
    });
    
    res.json({ 
      success: true, 
      qrCode,
      qrData 
    });
  } catch (error) {
    console.error("QR Generation Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify a report using its report hash
exports.verifyReport = async (req, res) => {
  try {
    let { reportHash } = req.params;
    
    reportHash = ensureHashPrefix(reportHash);
    
    if (!reportHash) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid report hash format",
        isValid: false 
      });
    }
    
    console.log(`🔍 Verifying report with hash: ${reportHash}`);
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia.publicnode.com");
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Check if report is valid
    const isValid = await contract.verifyReport(reportHash);
    console.log(`   isValid: ${isValid}`);
    
    if (isValid) {
      // Get full report details - returns a tuple/struct
      const report = await contract.getReport(reportHash);
      
      // Access the struct properties (by index or by name)
      const reportHash_result = report.reportHash || report[0];
      const patientId_result = report.patientId || report[1];
      const labId_result = report.labId || report[2];
      const timestamp_result = report.timestamp || report[3];
      const exists_result = report.exists || report[4];
      
      console.log(`✅ Report verified! Patient: ${patientId_result}, Lab: ${labId_result}`);
      
      res.json({
        success: true,
        isValid: true,
        report: {
          reportHash: reportHash_result,
          patientId: patientId_result,
          labId: labId_result,
          timestamp: new Date(Number(timestamp_result) * 1000).toISOString(),
          exists: exists_result
        }
      });
    } else {
      console.log(`❌ Report not found: ${reportHash}`);
      res.json({
        success: true,
        isValid: false,
        report: null,
        message: "Report not found on blockchain"
      });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      isValid: false 
    });
  }
};

// Get report details by hash
exports.getReport = async (req, res) => {
  try {
    let { reportHash } = req.params;
    
    reportHash = ensureHashPrefix(reportHash);
    
    if (!reportHash) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid report hash format" 
      });
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia.publicnode.com");
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const report = await contract.getReport(reportHash);
    
    const exists = report.exists || report[4];
    
    res.json({
      success: true,
      exists: exists,
      report: exists ? {
        reportHash: report.reportHash || report[0],
        patientId: report.patientId || report[1],
        labId: report.labId || report[2],
        timestamp: new Date(Number(report.timestamp || report[3]) * 1000).toISOString()
      } : null
    });
  } catch (error) {
    console.error("Get Report Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Check if an address is an authorized lab
exports.checkLabAuthorization = async (req, res) => {
  try {
    const { labAddress } = req.params;
    
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia.publicnode.com");
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const isAuthorized = await contract.authorizedLabs(labAddress);
    
    res.json({
      success: true,
      isAuthorized: isAuthorized
    });
  } catch (error) {
    console.error("Lab Authorization Check Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Health check for blockchain connection
exports.checkBlockchainConnection = async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia.publicnode.com");
    const blockNumber = await provider.getBlockNumber();
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const owner = await contract.owner();
    
    res.json({
      success: true,
      connected: true,
      blockNumber: blockNumber,
      contractAddress: process.env.CONTRACT_ADDRESS,
      contractOwner: owner,
      network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia.publicnode.com"
    });
  } catch (error) {
    console.error("Blockchain Connection Error:", error);
    res.status(500).json({ 
      success: false, 
      connected: false,
      error: error.message 
    });
  }
};

// Get all reports (requires storing hashes separately)
exports.getAllReports = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "To get all reports, store report hashes in a database when issuing reports",
      note: "Use the getReport endpoint with specific report hashes"
    });
  } catch (error) {
    console.error("Get All Reports Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};