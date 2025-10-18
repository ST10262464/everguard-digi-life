const { ethers } = require("hardhat");
const config = require('../blockdag.config.js');

/**
 * BlockDAG Deployment Script for EmpowerHub
 * Deploys smart contracts and initializes BlockDAG network
 */

async function main() {
  console.log("🚀 Starting BlockDAG deployment for EmpowerHub...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  try {
    // Deploy the EmpowerHubRequests contract
    console.log("\n📦 Deploying EmpowerHubRequests contract...");
    const EmpowerHubRequests = await ethers.getContractFactory("EmpowerHubRequests");
    const empowerHubRequests = await EmpowerHubRequests.deploy();
    await empowerHubRequests.deployed();

    console.log("✅ EmpowerHubRequests deployed to:", empowerHubRequests.address);
    console.log("Transaction hash:", empowerHubRequests.deployTransaction.hash);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await empowerHubRequests.owner();
    const stats = await empowerHubRequests.getStats();
    
    console.log("Contract owner:", owner);
    console.log("Initial stats:", {
      totalRequests: stats.total.toString(),
      confirmedRequests: stats.confirmed.toString(),
      pendingRequests: stats.pending.toString(),
      finalizedRequests: stats.finalized.toString()
    });

    // Initialize BlockDAG network configuration
    console.log("\n🌐 Initializing BlockDAG network...");
    const networkConfig = {
      contractAddress: empowerHubRequests.address,
      deployerAddress: deployer.address,
      chainId: config.network.chainId,
      networkId: config.network.networkId,
      confirmationThreshold: config.consensus.confirmationThreshold,
      maxParents: config.consensus.maxParents
    };

    // Save deployment information
    const deploymentInfo = {
      network: config.network.name,
      chainId: config.network.chainId,
      contracts: {
        EmpowerHubRequests: {
          address: empowerHubRequests.address,
          deploymentBlock: empowerHubRequests.deployTransaction.blockNumber,
          deploymentHash: empowerHubRequests.deployTransaction.hash,
          deployer: deployer.address
        }
      },
      blockDAGConfig: networkConfig,
      deploymentTimestamp: new Date().toISOString()
    };

    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, '../deployment-info.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("💾 Deployment info saved to:", deploymentPath);

    // Test basic contract functionality
    console.log("\n🧪 Testing contract functionality...");
    
    // Test storing a request
    const testDescription = "Test empowerment request for BlockDAG";
    const testDataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testDescription));
    const testParentBlocks = []; // No parent blocks for first request
    
    const tx = await empowerHubRequests.storeRequest(testDescription, testDataHash, testParentBlocks);
    await tx.wait();
    
    console.log("✅ Test request stored successfully");
    console.log("Transaction hash:", tx.hash);
    
    // Verify the request was stored
    const updatedStats = await empowerHubRequests.getStats();
    console.log("Updated stats:", {
      totalRequests: updatedStats.total.toString(),
      confirmedRequests: updatedStats.confirmed.toString(),
      pendingRequests: updatedStats.pending.toString(),
      finalizedRequests: updatedStats.finalized.toString()
    });

    // Get the stored request
    const storedRequest = await empowerHubRequests.getRequest(0);
    console.log("Stored request details:", {
      id: storedRequest.id.toString(),
      description: storedRequest.description,
      requester: storedRequest.requester,
      dataHash: storedRequest.dataHash,
      status: storedRequest.status.toString()
    });

    console.log("\n🎉 BlockDAG deployment completed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(`Network: ${config.network.name}`);
    console.log(`Chain ID: ${config.network.chainId}`);
    console.log(`Contract Address: ${empowerHubRequests.address}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Gas Used: ${empowerHubRequests.deployTransaction.gasLimit?.toString() || 'N/A'}`);
    console.log(`Block Number: ${empowerHubRequests.deployTransaction.blockNumber || 'N/A'}`);
    console.log("=".repeat(50));

    return {
      success: true,
      contractAddress: empowerHubRequests.address,
      deploymentInfo: deploymentInfo
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Deployment script completed successfully");
        process.exit(0);
      } else {
        console.error("\n❌ Deployment script failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ Deployment script error:", error);
      process.exit(1);
    });
}

module.exports = main;
