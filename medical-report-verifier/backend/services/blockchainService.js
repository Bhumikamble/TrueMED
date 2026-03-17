const { ethers } = require("ethers");
const contractABI = require("../blockchain/MedicalReportVerifierABI.json");

let provider;
let wallet;
let contract;

const isBlockchainEnabled = () => {
  if (process.env.BLOCKCHAIN_ENABLED === "false") {
    return false;
  }

  return Boolean(
    process.env.RPC_URL && process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS
  );
};

const getContract = () => {
  if (contract) {
    return contract;
  }

  const { RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

  if (!isBlockchainEnabled()) {
    throw new Error("Blockchain is disabled or not configured");
  }

  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

  return contract;
};

const addReportOnChain = async ({ reportHash, patientId, labId }) => {
  if (!isBlockchainEnabled()) {
    return {
      txHash: `LOCAL-${Date.now()}`,
      blockNumber: null,
      mode: "local-no-deploy",
    };
  }

  const contractInstance = getContract();
  const tx = await contractInstance.addReport(reportHash, patientId, labId);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    mode: "blockchain",
  };
};

const verifyReportOnChain = async (reportHash) => {
  if (!isBlockchainEnabled()) {
    return null;
  }

  const contractInstance = getContract();
  return contractInstance.verifyReport(reportHash);
};

const getReportFromChain = async (reportHash) => {
  if (!isBlockchainEnabled()) {
    return null;
  }

  const contractInstance = getContract();
  const report = await contractInstance.getReport(reportHash);

  return {
    reportHash: report.reportHash,
    patientId: report.patientId,
    labId: report.labId,
    timestamp: Number(report.timestamp),
    exists: report.exists,
  };
};

module.exports = {
  addReportOnChain,
  verifyReportOnChain,
  getReportFromChain,
  isBlockchainEnabled,
};
