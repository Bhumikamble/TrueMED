const hre = require("hardhat");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🏥 Issuing medical report on Sepolia...\n");

  // YOUR SEPOLIA CONTRACT ADDRESS
  const contractAddress = "0xB863d2B2A9e020E9aB9b47bbd2887A4173d25E30";
  
  console.log(`📜 Using contract at: ${contractAddress}`);
  
  // Get private key from .env
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ PRIVATE_KEY not found in .env file");
  }
  
  // Connect to Sepolia directly
  const provider = new hre.ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
  const signer = new hre.ethers.Wallet(privateKey, provider);
  
  console.log(`👤 Signer address: ${signer.address}`);
  
  const contract = new hre.ethers.Contract(contractAddress, [
    "function addReport(string memory reportHash, string memory patientId, string memory labId) external",
    "function verifyReport(string memory reportHash) external view returns (bool)",
    "function getReport(string memory reportHash) external view returns (string, string, string, uint256, bool)",
    "function authorizedLabs(address) external view returns (bool)",
    "function setLabAuthorization(address lab, bool isAuthorized) external",
    "function owner() external view returns (address)"
  ], signer);
  
  // Check if lab is authorized
  console.log("\n🔐 Checking lab authorization...");
  let isAuthorized = false;
  try {
    isAuthorized = await contract.authorizedLabs(signer.address);
    console.log(`   Lab authorized: ${isAuthorized}`);
  } catch (error) {
    console.log(`   Could not check authorization: ${error.message}`);
  }
  
  if (!isAuthorized) {
    console.log("   Authorizing lab...");
    try {
      const authTx = await contract.setLabAuthorization(signer.address, true);
      console.log(`   Transaction hash: ${authTx.hash}`);
      await authTx.wait();
      console.log("   ✅ Lab authorized!");
    } catch (error) {
      console.log(`   ⚠️ Could not authorize: ${error.message}`);
      console.log("   Continuing anyway...");
    }
  } else {
    console.log("   ✅ Lab already authorized!");
  }
  
  // Generate unique report hash
  const crypto = require("crypto");
  const reportHash = "0x" + crypto.randomBytes(32).toString("hex");
  const patientId = "PT-SEPOLIA-001";
  const labId = signer.address;
  
  console.log("\n📋 Report Details:");
  console.log(`   Report Hash: ${reportHash}`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   Lab ID: ${labId}`);
  
  console.log("\n📝 Recording on Sepolia blockchain...");
  
  try {
    const tx = await contract.addReport(reportHash, patientId, labId);
    console.log(`   Transaction hash: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    await tx.wait();
    console.log(`\n✅ Report issued successfully on Sepolia!`);
    
    // Generate QR code
    const qrData = {
      reportHash: reportHash,
      patientId: patientId,
      labId: labId,
      contractAddress: contractAddress,
      network: "sepolia",
      verificationUrl: `http://localhost:5173/verify-qr?hash=${reportHash}`
    };
    
    const qrDir = path.join(__dirname, "../qr-codes-sepolia");
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    
    const qrPath = path.join(qrDir, `report-${reportHash.substring(0, 10)}.png`);
    
    await QRCode.toFile(qrPath, JSON.stringify(qrData), {
      width: 400,
      margin: 2,
      color: { dark: '#1a4d8c', light: '#ffffff' }
    });
    
    console.log(`\n🎨 QR Code saved: ${qrPath}`);
    console.log(`🔗 Verification URL: ${qrData.verificationUrl}`);
    console.log(`\n📋 Report Hash: ${reportHash}`);
    console.log(`\n✅ View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
    
  } catch (error) {
    console.error("\n❌ Error issuing report:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Tip: Your wallet needs Sepolia ETH. Get it from: https://sepoliafaucet.com/");
    }
  }
}

main().catch(console.error);