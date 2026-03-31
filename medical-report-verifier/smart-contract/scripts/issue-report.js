const hre = require("hardhat");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🏥 Issuing medical report...\n");

  const contractAddress = "0xB863d2B2A9e020E9aB9b47bbd2887A4173d25E30";
  
  console.log(`📜 Using contract at: ${contractAddress}`);
  
  const contract = await hre.ethers.getContractAt("MedicalReportVerifier", contractAddress);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer address: ${deployer.address}`);
  
  // Add a small delay to ensure contract is ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // First, authorize the deployer as a lab
  console.log("\n🔐 Authorizing lab...");
  try {
    const authTx = await contract.setLabAuthorization(deployer.address, true);
    await authTx.wait();
    console.log("   ✅ Deployer authorized as a lab!");
  } catch (error) {
    console.log("   ⚠️ Lab already authorized or error:", error.message);
  }
  
  // Generate a unique report hash
  const reportHash = "0x" + "b".repeat(64);
  const patientId = "PT-2024-001";
  const labId = deployer.address;
  
  console.log("\n📋 Report Details:");
  console.log(`   Report Hash: ${reportHash}`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   Lab ID: ${labId}`);
  
  console.log("\n📝 Recording on blockchain...");
  
  try {
    // Call addReport
    const tx = await contract.addReport(reportHash, patientId, labId);
    
    console.log(`   Transaction hash: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    await tx.wait();
    
    console.log(`\n✅ Report issued successfully!`);
    
    // Generate QR code
    const qrData = {
      reportHash: reportHash,
      patientId: patientId,
      labId: labId,
      contractAddress: contractAddress,
      verificationUrl: `http://localhost:5173/verify-qr?hash=${reportHash}`
    };
    
    const qrDir = path.join(__dirname, "../qr-codes");
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
    console.log(`\n📱 Share this QR code with the patient for verification!`);
    console.log(`\n📋 Report Hash: ${reportHash}`);
    
  } catch (error) {
    console.error("\n❌ Error issuing report:", error.message);
  }
}

main().catch(console.error);