const { ethers } = require("ethers");
const contractABI = require("../blockchain/MedicalReportVerifierABI.json");

let provider;
let wallet;
let contract;

// Cache for contract instance
let cachedContract = null;
let cachedProvider = null;
let cachedWallet = null;

/**
 * Check if blockchain is enabled and configured
 */
const isBlockchainEnabled = () => {
  if (process.env.BLOCKCHAIN_ENABLED === "false") {
    console.log("Blockchain mode: DISABLED (set by environment variable)");
    return false;
  }

  // Use BLOCKCHAIN_RPC_URL instead of RPC_URL
  const isEnabled = Boolean(
    process.env.BLOCKCHAIN_RPC_URL && 
    process.env.PRIVATE_KEY && 
    process.env.CONTRACT_ADDRESS
  );
  
  if (!isEnabled) {
    console.log("Blockchain mode: DISABLED (missing configuration)");
  } else {
    console.log("Blockchain mode: ENABLED");
  }
  
  return isEnabled;
};

/**
 * Get contract instance (singleton pattern)
 */
const getContract = () => {
  if (cachedContract) {
    return cachedContract;
  }

  if (!isBlockchainEnabled()) {
    throw new Error("Blockchain is disabled or not configured. Please check your .env file.");
  }

  const { BLOCKCHAIN_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

  try {
    // Validate configuration
    if (!BLOCKCHAIN_RPC_URL) {
      throw new Error("BLOCKCHAIN_RPC_URL is missing in environment variables");
    }
    if (!PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY is missing in environment variables");
    }
    if (!CONTRACT_ADDRESS) {
      throw new Error("CONTRACT_ADDRESS is missing in environment variables");
    }

    // Validate private key format
    if (!PRIVATE_KEY.startsWith("0x") && PRIVATE_KEY.length !== 64) {
      console.warn("Warning: Private key should start with 0x or be 64 hex characters");
    }

    const normalizedPrivateKey = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
    
    provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    wallet = new ethers.Wallet(normalizedPrivateKey, provider);
    cachedContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    cachedProvider = provider;
    cachedWallet = wallet;
    
    console.log(`✅ Blockchain contract loaded at: ${CONTRACT_ADDRESS}`);
    console.log(`   Connected to: ${BLOCKCHAIN_RPC_URL}`);
    console.log(`   Wallet address: ${wallet.address}`);
    
    return cachedContract;
  } catch (error) {
    console.error("❌ Failed to initialize blockchain contract:", error.message);
    throw new Error(`Blockchain initialization failed: ${error.message}`);
  }
};

/**
 * Add report to blockchain
 */
const addReportOnChain = async ({ reportHash, patientId, labId }) => {
  if (!isBlockchainEnabled()) {
    console.log("📝 Blockchain disabled - simulating transaction");
    return {
      txHash: `LOCAL-${Date.now()}`,
      blockNumber: null,
      mode: "local-no-deploy",
      simulated: true,
    };
  }

  try {
    console.log(`⛓️  Adding report to blockchain...`);
    console.log(`   Hash: ${reportHash.substring(0, 20)}...`);
    console.log(`   Patient: ${patientId}`);
    console.log(`   Lab: ${labId}`);
    
    const contractInstance = getContract();
    
    // Estimate gas first (optional, good for debugging)
    const gasEstimate = await contractInstance.addReport.estimateGas(
      reportHash, 
      patientId, 
      labId
    );
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);
    
    // Send transaction
    const tx = await contractInstance.addReport(reportHash, patientId, labId, {
      gasLimit: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer
    });
    
    console.log(`   Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   Confirmed in block: ${receipt.blockNumber}`);
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      mode: "blockchain",
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    console.error("❌ Failed to add report to blockchain:", error.message);
    
    // Return a fallback response for development
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Falling back to local mode due to blockchain error");
      return {
        txHash: `FALLBACK-${Date.now()}`,
        blockNumber: null,
        mode: "fallback-local",
        error: error.message,
      };
    }
    
    throw new Error(`Blockchain transaction failed: ${error.message}`);
  }
};

/**
 * Verify report on blockchain
 */
const verifyReportOnChain = async (reportHash) => {
  if (!isBlockchainEnabled()) {
    console.log("🔍 Blockchain disabled - verification skipped");
    return null;
  }

  try {
    const contractInstance = getContract();
    const result = await contractInstance.verifyReport(reportHash);
    console.log(`🔍 Verification result for ${reportHash.substring(0, 20)}...: ${result}`);
    return result;
  } catch (error) {
    console.error("❌ Failed to verify report on blockchain:", error.message);
    
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Returning null for verification (development mode)");
      return null;
    }
    
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
};

/**
 * Get report from blockchain
 * Handles both array and struct/tuple return types
 */
const getReportFromChain = async (reportHash) => {
  if (!isBlockchainEnabled()) {
    console.log("📋 Blockchain disabled - returning null");
    return null;
  }

  try {
    const contractInstance = getContract();
    const report = await contractInstance.getReport(reportHash);
    
    // Handle both array and object/struct access
    // Your contract returns a tuple: (string reportHash, string patientId, string labId, uint256 timestamp, bool exists)
    const result = {
      reportHash: report.reportHash || report[0],
      patientId: report.patientId || report[1],
      labId: report.labId || report[2],
      timestamp: Number(report.timestamp || report[3]),
      exists: report.exists || report[4],
    };
    
    if (result.exists) {
      console.log(`✅ Found report on blockchain: ${reportHash.substring(0, 20)}...`);
      console.log(`   Patient: ${result.patientId}`);
      console.log(`   Lab: ${result.labId}`);
      console.log(`   Timestamp: ${new Date(result.timestamp * 1000).toLocaleString()}`);
    } else {
      console.log(`❌ Report not found on blockchain: ${reportHash.substring(0, 20)}...`);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Failed to get report from blockchain:", error.message);
    
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Returning null for blockchain fetch (development mode)");
      return null;
    }
    
    throw new Error(`Blockchain fetch failed: ${error.message}`);
  }
};

/**
 * Get contract information (for debugging)
 */
const getContractInfo = async () => {
  if (!isBlockchainEnabled()) {
    return { enabled: false };
  }

  try {
    const contractInstance = getContract();
    const address = await contractInstance.getAddress();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const balance = await provider.getBalance(wallet.address);
    
    return {
      enabled: true,
      contractAddress: address,
      network: network.name,
      chainId: network.chainId,
      currentBlock: blockNumber,
      walletAddress: wallet.address,
      walletBalance: ethers.formatEther(balance),
    };
  } catch (error) {
    console.error("Failed to get contract info:", error.message);
    return { enabled: true, error: error.message };
  }
};

/**
 * Check if contract is deployed and accessible
 */
const checkContractHealth = async () => {
  if (!isBlockchainEnabled()) {
    return { healthy: false, reason: "Blockchain disabled" };
  }

  try {
    const contractInstance = getContract();
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
    
    if (code === "0x") {
      return { healthy: false, reason: "No contract deployed at address" };
    }
    
    // Try to call a view function
    const owner = await contractInstance.owner().catch(() => null);
    
    return {
      healthy: true,
      hasCode: true,
      owner: owner,
      contractAddress: process.env.CONTRACT_ADDRESS,
    };
  } catch (error) {
    return { healthy: false, reason: error.message };
  }
};

module.exports = {
  addReportOnChain,
  verifyReportOnChain,
  getReportFromChain,
  isBlockchainEnabled,
  getContractInfo,
  checkContractHealth,
};