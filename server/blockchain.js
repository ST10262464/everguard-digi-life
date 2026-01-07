require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

/**
 * BlockDAG Blockchain Integration for EverGuard
 * Handles capsule storage, BurstKey logging, and audit trail on BlockDAG
 */

// Load contract ABI - try multiple paths for different environments
let contractPath;
let contractArtifact;

// Try multiple possible paths
const possiblePaths = [
  // Local development path
  path.join(__dirname, '../artifacts/contracts/EverGuardCapsules.sol/EverGuardCapsules.json'),
  // Server directory path (for deployment)
  path.join(__dirname, 'artifacts/contracts/EverGuardCapsules.sol/EverGuardCapsules.json'),
  // Alternative paths
  path.join(__dirname, '../../artifacts/contracts/EverGuardCapsules.sol/EverGuardCapsules.json')
];

console.log('🔍 [BLOCKCHAIN] Searching for contract file...');
console.log('🔍 [BLOCKCHAIN] Current directory:', __dirname);

for (const testPath of possiblePaths) {
  try {
    if (fs.existsSync(testPath)) {
      contractPath = testPath;
      console.log(`✅ [BLOCKCHAIN] Found contract at: ${testPath}`);
      break;
    }
  } catch (error) {
    console.log(`⚠️  [BLOCKCHAIN] Path check failed for: ${testPath}`, error.message);
  }
}

if (!contractPath) {
  console.log('⚠️  [BLOCKCHAIN] Contract file not found');
  console.log('📝 [BLOCKCHAIN] Using minimal ABI - deploy contract first');
  
  // Minimal ABI for development (will be replaced after deployment)
  contractArtifact = {
    abi: [
      "function createCapsule(string memory _capsuleHash, string memory _capsuleType) public returns (uint256)",
      "function issueBurstKey(uint256 _capsuleId, address _accessor, uint256 _expiresAt, string memory _contextHash) public returns (uint256)",
      "function consumeBurstKey(uint256 _burstId) public",
      "function getCapsule(uint256 _id) public view returns (tuple(uint256 id, string capsuleHash, uint256 timestamp, string capsuleType, address owner, uint8 status))",
      "function getCapsuleAccessLog(uint256 _capsuleId) public view returns (uint256[] memory)",
      "event CapsuleCreated(uint256 indexed id, string capsuleHash, string capsuleType, address owner)",
      "event BurstKeyIssued(uint256 indexed burstId, uint256 indexed capsuleId, address accessor, uint256 expiresAt)",
      "event BurstKeyConsumed(uint256 indexed burstId, uint256 indexed capsuleId, address accessor, uint256 consumedAt)"
    ]
  };
} else {
  try {
    contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    console.log(`✅ [BLOCKCHAIN] Contract ABI loaded successfully`);
  } catch (error) {
    throw new Error(`Failed to parse contract file: ${error.message}`);
  }
}

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.BDAG_RPC_URL || 'https://rpc.awakening.bdagscan.com');
console.log('🌐 [BLOCKCHAIN] Connected to BlockDAG RPC:', process.env.BDAG_RPC_URL || 'https://rpc.awakening.bdagscan.com');

let contract;
let wallet;
let contractWithSigner;

// Initialize contract if address is provided
if (process.env.CONTRACT_ADDRESS) {
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractArtifact.abi, provider);
  console.log('📝 [BLOCKCHAIN] Contract address:', process.env.CONTRACT_ADDRESS);
  
  // Create wallet instance for transactions
  if (process.env.PRIVATE_KEY) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contractWithSigner = contract.connect(wallet);
    console.log('✅ [BLOCKCHAIN] Wallet connected:', wallet.address);
  } else {
    console.warn('⚠️  [BLOCKCHAIN] No PRIVATE_KEY - read-only mode');
  }
} else {
  console.warn('⚠️  [BLOCKCHAIN] No CONTRACT_ADDRESS - deploy contract first');
}

/**
 * Store capsule hash on blockchain
 */
async function storeCapsuleOnBlockchain(capsuleHash, capsuleType) {
  try {
    console.log('📦 [BLOCKCHAIN] Storing capsule on blockchain...');
    
    if (!contractWithSigner) {
      throw new Error('Wallet not configured - PRIVATE_KEY required');
    }
    
    const tx = await contractWithSigner.createCapsule(capsuleHash, capsuleType);
    console.log('📤 [BLOCKCHAIN] Transaction sent:', tx.hash);
    console.log('⏳ [BLOCKCHAIN] Waiting for confirmation...');
    
    // Wait with timeout (60 seconds for better reliability)
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 60s')), 60000)
      )
    ]);
    
    // Parse event to get capsule ID
    let capsuleId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        if (parsed && parsed.name === 'CapsuleCreated') {
          capsuleId = parsed.args.id;
          break;
        }
      } catch (e) {
        // Skip logs we can't parse
        continue;
      }
    }
    
    console.log('✅ [BLOCKCHAIN] Capsule stored:', receipt.hash);
    console.log('📋 [BLOCKCHAIN] Capsule ID:', capsuleId ? capsuleId.toString() : 'unknown');
    
    return {
      success: true,
      txHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      capsuleId: capsuleId ? capsuleId.toString() : null,
      gasUsed: receipt.gasUsed.toString(),
      network: 'BlockDAG'
    };
  } catch (error) {
    console.error('❌ [BLOCKCHAIN] Failed to store capsule:', error.message);
    throw error;
  }
}

/**
 * Issue BurstKey on blockchain (log the access event)
 */
async function issueBurstKeyOnChain(blockchainCapsuleId, accessorAddress, expiresAt, contextHash) {
  try {
    console.log('🔑 [BLOCKCHAIN] Logging BurstKey issuance...');
    console.log(`   Capsule ID: ${blockchainCapsuleId}, Accessor: ${accessorAddress}`);
    
    if (!contractWithSigner) {
      console.warn('⚠️  [BLOCKCHAIN] No wallet - BurstKey not logged on chain');
      return { success: false, reason: 'No wallet configured' };
    }
    
    // Ensure capsuleId is a valid number
    if (blockchainCapsuleId === null || blockchainCapsuleId === undefined) {
      console.error('❌ [BLOCKCHAIN] Invalid capsule ID - cannot log BurstKey');
      return { success: false, error: 'Invalid capsule ID' };
    }
    
    // Ensure accessor address is valid or use a placeholder
    let validAccessorAddress = accessorAddress;
    if (!accessorAddress || !accessorAddress.startsWith('0x')) {
      // Generate a deterministic address from the accessor ID
      validAccessorAddress = wallet.address; // Use deployer address as fallback
      console.log(`⚠️  [BLOCKCHAIN] Using wallet address as accessor: ${validAccessorAddress}`);
    } else {
      // Fix checksum using ethers
      try {
        validAccessorAddress = ethers.getAddress(accessorAddress);
        console.log(`✅ [BLOCKCHAIN] Address checksummed: ${validAccessorAddress}`);
      } catch (e) {
        console.error(`❌ [BLOCKCHAIN] Invalid address format, using wallet: ${e.message}`);
        validAccessorAddress = wallet.address;
      }
    }
    
    const tx = await contractWithSigner.issueBurstKey(
      blockchainCapsuleId,
      validAccessorAddress,
      Math.floor(expiresAt / 1000), // Convert to seconds
      contextHash
    );
    console.log('📤 [BLOCKCHAIN] BurstKey transaction sent:', tx.hash);
    console.log('⏳ [BLOCKCHAIN] Waiting for confirmation...');
    
    // Wait with timeout (60 seconds for better reliability)
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 60s')), 60000)
      )
    ]);
    
    // Parse BurstKey ID from event
    let burstKeyId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        if (parsed && parsed.name === 'BurstKeyIssued') {
          burstKeyId = parsed.args.burstId;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log('✅ [BLOCKCHAIN] BurstKey logged:', receipt.hash);
    console.log('📋 [BLOCKCHAIN] BurstKey ID:', burstKeyId ? burstKeyId.toString() : 'unknown');
    
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      burstKeyId: burstKeyId ? burstKeyId.toString() : null
    };
  } catch (error) {
    console.error('❌ [BLOCKCHAIN] Failed to log BurstKey:', error.message);
    // Don't throw - BurstKey can still work without blockchain logging
    return { success: false, error: error.message };
  }
}

/**
 * Consume BurstKey on blockchain (log the consumption)
 */
async function consumeBurstKeyOnChain(blockchainBurstKeyId) {
  try {
    console.log('✅ [BLOCKCHAIN] Logging BurstKey consumption...');
    console.log(`   BurstKey ID: ${blockchainBurstKeyId}`);
    
    if (!contractWithSigner) {
      console.warn('⚠️  [BLOCKCHAIN] No wallet - consumption not logged');
      return { success: false, reason: 'No wallet configured' };
    }
    
    // Validate numeric ID
    if (blockchainBurstKeyId === null || blockchainBurstKeyId === undefined) {
      console.error('❌ [BLOCKCHAIN] Invalid BurstKey ID - cannot log consumption');
      return { success: false, error: 'Invalid BurstKey ID' };
    }
    
    const tx = await contractWithSigner.consumeBurstKey(blockchainBurstKeyId);
    console.log('📤 [BLOCKCHAIN] Consumption transaction sent:', tx.hash);
    console.log('⏳ [BLOCKCHAIN] Waiting for confirmation...');
    
    // Wait with timeout (60 seconds for better reliability)
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 60s')), 60000)
      )
    ]);
    
    console.log('✅ [BLOCKCHAIN] Consumption logged:', receipt.hash);
    
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ [BLOCKCHAIN] Failed to log consumption:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get capsule access log from blockchain
 */
async function getCapsuleAccessLog(capsuleId) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    // Get BurstKey IDs from contract
    const burstKeyIds = await contract.getCapsuleAccessLog(capsuleId);
    
    // Fetch BurstKeyIssued and BurstKeyConsumed events
    const filter = contract.filters.BurstKeyIssued(null, capsuleId);
    const events = await contract.queryFilter(filter);
    
    const accessLog = events.map(event => ({
      burstId: event.args.burstId.toString(),
      accessor: event.args.accessor,
      expiresAt: event.args.expiresAt.toString(),
      blockNumber: event.blockNumber,
      txHash: event.transactionHash
    }));
    
    console.log(`📋 [BLOCKCHAIN] Retrieved ${accessLog.length} access events`);
    
    return accessLog;
  } catch (error) {
    console.error('❌ [BLOCKCHAIN] Failed to get access log:', error.message);
    return [];
  }
}

/**
 * Try to fetch transactions from BlockDAG explorer API
 */
async function getTransactionsFromExplorer() {
  try {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const explorerApiUrl = process.env.BLOCKDAG_EXPLORER_API || 'https://api.bdagscan.com';
    
    // Try to fetch from explorer API (similar to Etherscan)
    const axios = require('axios');
    const response = await axios.get(`${explorerApiUrl}/api`, {
      params: {
        module: 'account',
        action: 'txlist',
        address: contractAddress,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.status === '1' && response.data.result) {
      console.log(`✅ [BLOCKCHAIN] Fetched ${response.data.result.length} transactions from explorer API`);
      return response.data.result;
    }
    
    return null;
  } catch (error) {
    console.log('⚠️  [BLOCKCHAIN] Explorer API not available, will use block scanning');
    return null;
  }
}

/**
 * Get all blockchain transactions from contract events
 * DISABLED: Block scanning is unreliable due to RPC rate limiting
 * Use getTransactionByHash or manual import instead
 */
async function getAllBlockchainTransactions(quickScan = true) {
  // Block scanning disabled - too slow and causes 502 errors
  // Return empty array - transactions come from Firestore instead
  console.log('ℹ️  [BLOCKCHAIN] Block scanning disabled - using Firestore for historical data');
  return [];
}

/**
 * Verify and parse a single transaction by hash
 * This is fast and reliable - just one RPC call
 */
async function getTransactionByHash(txHash) {
  try {
    if (!contract || !provider) {
      throw new Error('Blockchain not initialized');
    }
    
    console.log(`🔍 [BLOCKCHAIN] Fetching transaction: ${txHash}`);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { success: false, error: 'Transaction not found' };
    }
    
    // Verify it's to our contract
    const contractAddress = process.env.CONTRACT_ADDRESS?.toLowerCase();
    if (receipt.to?.toLowerCase() !== contractAddress) {
      return { success: false, error: 'Transaction is not for this contract' };
    }
    
    // Get block for timestamp
    const block = await provider.getBlock(receipt.blockNumber);
    const timestamp = block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString();
    
    // Parse events from logs
    const events = [];
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contractAddress) {
        continue;
      }
      
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog.name === 'CapsuleCreated') {
          events.push({
            type: 'CapsuleCreated',
            txHash: txHash,
            blockNumber: receipt.blockNumber,
            timestamp: timestamp,
            capsuleId: parsedLog.args.id.toString(),
            capsuleHash: parsedLog.args.capsuleHash,
            capsuleType: parsedLog.args.capsuleType,
            owner: parsedLog.args.owner
          });
        } else if (parsedLog.name === 'BurstKeyIssued') {
          events.push({
            type: 'BurstKeyIssued',
            txHash: txHash,
            blockNumber: receipt.blockNumber,
            timestamp: timestamp,
            burstId: parsedLog.args.burstId.toString(),
            capsuleId: parsedLog.args.capsuleId.toString(),
            accessor: parsedLog.args.accessor,
            expiresAt: parsedLog.args.expiresAt.toString()
          });
        } else if (parsedLog.name === 'BurstKeyConsumed') {
          events.push({
            type: 'BurstKeyConsumed',
            txHash: txHash,
            blockNumber: receipt.blockNumber,
            timestamp: timestamp,
            burstId: parsedLog.args.burstId.toString()
          });
        }
      } catch (parseError) {
        // Not our event, skip
      }
    }
    
    if (events.length === 0) {
      // Still a valid contract transaction, just no parseable events
      events.push({
        type: 'ContractInteraction',
        txHash: txHash,
        blockNumber: receipt.blockNumber,
        timestamp: timestamp,
        status: receipt.status === 1 ? 'success' : 'failed'
      });
    }
    
    console.log(`✅ [BLOCKCHAIN] Parsed ${events.length} events from transaction`);
    
    return {
      success: true,
      txHash: txHash,
      blockNumber: receipt.blockNumber,
      timestamp: timestamp,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      events: events
    };
  } catch (error) {
    console.error(`❌ [BLOCKCHAIN] Failed to get transaction ${txHash}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Query capsule data directly from contract (no block scanning)
 * Much faster than block scanning
 */
async function getCapsuleFromContract(capsuleId) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    const capsule = await contract.getCapsule(capsuleId);
    
    return {
      success: true,
      capsule: {
        id: capsule.id.toString(),
        capsuleHash: capsule.capsuleHash,
        timestamp: new Date(Number(capsule.timestamp) * 1000).toISOString(),
        capsuleType: capsule.capsuleType,
        owner: capsule.owner,
        status: capsule.status
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Parse transactions from explorer API response
 */
async function parseExplorerTransactions(transactions) {
  const allEvents = [];
  
  for (const tx of transactions) {
    try {
      // Get transaction receipt to parse logs
      const receipt = await provider.getTransactionReceipt(tx.hash);
      
      if (!receipt || !receipt.logs || receipt.logs.length === 0) {
        continue;
      }
      
      // Parse logs for our events
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
          continue;
        }
        
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          const timestamp = new Date(parseInt(tx.timeStamp) * 1000).toISOString();
          
          if (parsedLog.name === 'CapsuleCreated') {
            allEvents.push({
              type: 'CapsuleCreated',
              txHash: tx.hash,
              blockNumber: parseInt(tx.blockNumber),
              timestamp: timestamp,
              capsuleId: parsedLog.args.id.toString(),
              capsuleHash: parsedLog.args.capsuleHash,
              capsuleType: parsedLog.args.capsuleType,
              owner: parsedLog.args.owner
            });
          } else if (parsedLog.name === 'BurstKeyIssued') {
            allEvents.push({
              type: 'BurstKeyIssued',
              txHash: tx.hash,
              blockNumber: parseInt(tx.blockNumber),
              timestamp: timestamp,
              burstId: parsedLog.args.burstId.toString(),
              capsuleId: parsedLog.args.capsuleId.toString(),
              accessor: parsedLog.args.accessor,
              expiresAt: parsedLog.args.expiresAt.toString(),
              contextHash: parsedLog.args.contextHash
            });
          } else if (parsedLog.name === 'BurstKeyConsumed') {
            allEvents.push({
              type: 'BurstKeyConsumed',
              txHash: tx.hash,
              blockNumber: parseInt(tx.blockNumber),
              timestamp: timestamp,
              burstId: parsedLog.args.burstId.toString()
            });
          }
        } catch (parseError) {
          // Skip unparseable logs
        }
      }
    } catch (error) {
      console.warn(`⚠️  [BLOCKCHAIN] Failed to process tx ${tx.hash}`);
    }
  }
  
  // Sort by block number (newest first)
  allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
  
  console.log(`✅ [BLOCKCHAIN] Parsed ${allEvents.length} events from explorer data`);
  return allEvents;
}

/**
 * Get wallet connection status
 */
async function getConnectionStatus() {
  try {
    const blockNumber = await provider.getBlockNumber();
    
    return {
      connected: true,
      network: 'BlockDAG',
      blockNumber: blockNumber,
      wallet: wallet ? wallet.address : null,
      contract: process.env.CONTRACT_ADDRESS || null
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  storeCapsuleOnBlockchain,
  issueBurstKeyOnChain,
  consumeBurstKeyOnChain,
  getCapsuleAccessLog,
  getAllBlockchainTransactions,
  getTransactionByHash,
  getCapsuleFromContract,
  getConnectionStatus,
  provider,
  contract,
  wallet
};

