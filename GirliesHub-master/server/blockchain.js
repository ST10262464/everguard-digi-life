require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Load contract ABI - try multiple paths for different environments              
let contractPath;
let contractArtifact;

// Try multiple possible paths
const possiblePaths = [
  // Railway path (artifacts copied to server directory)
  path.join(__dirname, 'artifacts/contracts/EmpowerHubRequests.sol/EmpowerHubRequests.json'),
  // Local development path
  path.join(__dirname, '../artifacts/contracts/EmpowerHubRequests.sol/EmpowerHubRequests.json'),
  // Alternative Railway path (root level)
  path.join(__dirname, '../../artifacts/contracts/EmpowerHubRequests.sol/EmpowerHubRequests.json'),
  // Railway root level
  path.join(__dirname, '../artifacts/contracts/EmpowerHubRequests.sol/EmpowerHubRequests.json')
];

// Find the first path that exists
console.log('🔍 [BLOCKCHAIN] Searching for contract file...');
console.log('🔍 [BLOCKCHAIN] Current directory:', __dirname);

for (const testPath of possiblePaths) {
  try {
    console.log(`🔍 [BLOCKCHAIN] Checking path: ${testPath}`);
    if (fs.existsSync(testPath)) {
      contractPath = testPath;
      console.log(`✅ [BLOCKCHAIN] Found contract at: ${testPath}`);
      break;
    } else {
      console.log(`❌ [BLOCKCHAIN] Path does not exist: ${testPath}`);
    }
  } catch (error) {
    console.log(`⚠️  [BLOCKCHAIN] Path check failed for: ${testPath}`, error.message);
  }
}

if (!contractPath) {
  console.log('⚠️  [BLOCKCHAIN] Contract file not found in any expected location');
  console.log('✅ [BLOCKCHAIN] Using embedded complete contract ABI...');
  
  // Complete contract ABI embedded directly in the code
  // This ensures 100% blockchain functionality even without artifacts directory
  contractArtifact = {
    abi: [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "requestHash",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "requestType",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "requester",
            "type": "address"
          }
        ],
        "name": "RequestStored",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "getRequestById",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "requestHash",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "requestType",
                "type": "string"
              },
              {
                "internalType": "address",
                "name": "requester",
                "type": "address"
              }
            ],
            "internalType": "struct EmpowerHubRequests.Request",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getRequestCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getRequests",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "requestHash",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "requestType",
                "type": "string"
              },
              {
                "internalType": "address",
                "name": "requester",
                "type": "address"
              }
            ],
            "internalType": "struct EmpowerHubRequests.Request[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "getUserRequests",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "requests",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "requestHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "requestType",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "requester",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "requestHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "requestType",
            "type": "string"
          }
        ],
        "name": "storeRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "userRequests",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  };
  console.log('✅ [BLOCKCHAIN] Complete embedded ABI loaded - full functionality available');
} else {
  try {
    contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    console.log(`✅ [BLOCKCHAIN] Contract ABI loaded successfully from: ${contractPath}`);
  } catch (error) {
    throw new Error(`Failed to parse contract file at ${contractPath}: ${error.message}`);
  }
}

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.BDAG_RPC_URL || 'https://rpc.primordial.bdagscan.com');
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress) {
  throw new Error('CONTRACT_ADDRESS environment variable is required');
}

const contract = new ethers.Contract(contractAddress, contractArtifact.abi, provider);

// Create wallet instance for transactions (using private key from env)
let wallet;
if (process.env.PRIVATE_KEY) {
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractWithSigner = contract.connect(wallet);
}

module.exports = {
  async connectWallet() {
    return { 
      address: wallet ? wallet.address : "No wallet configured", 
      status: wallet ? "Connected" : "No private key configured" 
    };
  },

  async storeRequestOnBlockchain(requestData) {
    try {
      console.log('📦 [BLOCKCHAIN] Storing request on blockchain...');
      
      if (!wallet) {
        throw new Error('No wallet configured - PRIVATE_KEY required for transactions');
      }

      // Create request hash from request data
      const requestHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(requestData)));
      
      // Map request type to contract format
      const requestTypeMap = {
        'Finance': 'finance',
        'GBV Support': 'gbv', 
        'Sanitary Aid': 'sanitary'
      };
      
      const requestType = requestTypeMap[requestData.requestType] || 'finance';
      
      // Store on blockchain
      const contractWithSigner = contract.connect(wallet);
      const tx = await contractWithSigner.storeRequest(requestHash, requestType);
      const receipt = await tx.wait();
      
      console.log('✅ Request stored on blockchain:', receipt.hash);
      
      return {
        success: true,
        transactionId: receipt.hash,
        blockHash: receipt.blockHash,
        requestId: requestData.id,
        timestamp: new Date().toISOString(),
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
        network: 'BlockDAG Testnet',
        message: 'Request successfully stored on blockchain',
        requestHash: requestHash,
        requestType: requestType
      };
    } catch (error) {
      console.error('❌ Blockchain storage failed:', error);
      throw error;
    }
  },

  async getRequestsFromBlockchain() {
    try {
      console.log('🔍 [BLOCKCHAIN] Fetching requests from blockchain...');
      
      const requests = await contract.getRequests();
      
      return requests.map((request, index) => ({
        id: request.id.toString(),
        requestHash: request.requestHash,
        timestamp: new Date(parseInt(request.timestamp) * 1000).toISOString(),
        requestType: request.requestType,
        requester: request.requester
      }));
    } catch (error) {
      console.error('❌ Failed to fetch requests from blockchain:', error);
      throw error;
    }
  },

  async storeHashOnBlockchain(requestData) {
    // Alias for storeRequestOnBlockchain for backward compatibility
    return await module.exports.storeRequestOnBlockchain(requestData);
  },

  async getTransactionProof(requestId) {
    try {
      console.log(`🔍 [BLOCKCHAIN] Getting transaction proof for request: ${requestId}`);
      
      // Get request from blockchain
      const requests = await contract.getRequests();
      const request = requests.find(r => r.id.toString() === requestId);
      
      if (!request) {
        throw new Error('Request not found on blockchain');
      }
      
      return {
        success: true,
        requestId: requestId,
        transactionId: 'N/A', // Would need to track transaction hashes
        blockHash: 'N/A', // Would need to track block hashes
        blockNumber: 'N/A',
        merkleProof: [],
        verified: true,
        confirmations: 1,
        timestamp: new Date(parseInt(request.timestamp) * 1000).toISOString(),
        network: 'BlockDAG Testnet',
        message: 'Request verified on blockchain',
        requestData: {
          id: request.id.toString(),
          requestHash: request.requestHash,
          timestamp: new Date(parseInt(request.timestamp) * 1000).toISOString(),
          requestType: request.requestType,
          requester: request.requester
        }
      };
    } catch (error) {
      console.error('❌ Failed to get transaction proof:', error);
      throw error;
    }
  },

  async getRequestCount() {
    try {
      const count = await contract.getRequestCount();
      return count.toString();
    } catch (error) {
      console.error('❌ Failed to get request count:', error);
      throw error;
    }
  }
};


