const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking your contract...\n");
  
  const contractAddress = "0xB863d2B2A9e020E9aB9b47bbd2887A4173d25E30";
  const contract = await hre.ethers.getContractAt("MedicalReportVerifier", contractAddress);
  
  console.log("Here are ALL the functions in your contract:\n");
  
  contract.interface.fragments.forEach(fragment => {
    if (fragment.type === 'function') {
      console.log(`📌 ${fragment.name}`);
      console.log(`   Parameters it expects:`);
      fragment.inputs.forEach(input => {
        console.log(`     - ${input.name || 'unnamed'}: ${input.type}`);
      });
      console.log();
    }
  });
}

main().catch(console.error);