const hre = require("hardhat");

async function main() {
  console.log("");
  console.log("🚀 ========================================");
  console.log("📝 Deploying EverGuard Capsules Contract");
  console.log("🚀 ========================================");
  console.log("");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BDAG");
  console.log("");

  // Deploy contract
  console.log("⏳ Deploying EverGuardCapsules contract...");
  const EverGuardCapsules = await hre.ethers.getContractFactory("EverGuardCapsules");
  const contract = await EverGuardCapsules.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("");
  console.log("🚀 ========================================");
  console.log("📝 Contract Address:", address);
  console.log("🚀 ========================================");
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Update .env file with:");
  console.log(`   CONTRACT_ADDRESS=${address}`);
  console.log("");
  console.log("2. Verify on BlockDAG Explorer:");
  console.log(`   https://primordial.bdagscan.com/address/${address}`);
  console.log("");
  console.log("3. Restart your server to load the new contract");
  console.log("");
  
  // Get contract stats
  const stats = await contract.getStats();
  console.log("📊 Initial contract stats:");
  console.log("   Total Capsules:", stats[0].toString());
  console.log("   Total BurstKeys:", stats[1].toString());
  console.log("   Active Capsules:", stats[2].toString());
  console.log("");
  console.log("✅ Deployment complete!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

