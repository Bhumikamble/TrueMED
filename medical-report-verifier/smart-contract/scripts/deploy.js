const hre = require("hardhat");

async function main() {
  const contractFactory = await hre.ethers.getContractFactory("MedicalReportVerifier");
  const contract = await contractFactory.deploy();

  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  console.log("MedicalReportVerifier deployed to:", deployedAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
