const hre = require("hardhat");

async function main() {
  // Environment validation
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  console.log("🚀 Deploying EmpowerHubRequests to BlockDAG testnet...");
  console.log("Network:", process.env.BDAG_RPC_URL || "https://rpc.primordial.bdagscan.com");
  console.log("Chain ID: 1043");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy contract
  const EmpowerHubRequests = await hre.ethers.getContractFactory("EmpowerHubRequests");
  console.log("Deploying EmpowerHubRequests...");
  
  const empowerHubRequests = await EmpowerHubRequests.deploy();
  await empowerHubRequests.waitForDeployment();

  const contractAddress = await empowerHubRequests.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log("📄 Contract Address:", contractAddress);
  console.log("🔗 BlockDAG Explorer: https://primordial.bdagscan.com/address/" + contractAddress);
  console.log("");
  console.log("📝 Add this to your .env file:");
  console.log("CONTRACT_ADDRESS=" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
