import { ethers } from 'ethers';

// BlockDAG Testnet Configuration
const BLOCKDAG_RPC_URL = 'https://rpc.primordial.bdagscan.com';
const BLOCKDAG_CHAIN_ID = 1043;
const CONTRACT_ADDRESS = '0x0b3CeBf2B0c6E09159E886958791e0eD762CE6CC';

// Contract ABI (simplified for the functions we need)
const CONTRACT_ABI = [
  "function storeRequest(string memory requestHash, string memory requestType) public",
  "function getRequests() public view returns (tuple(uint256 id, string requestHash, uint256 timestamp, string requestType, address requester)[] memory)",
  "function getRequestCount() public view returns (uint256)"
];

let provider = null;
let signer = null;
let contract = null;

// Initialize ethers.js
export function initializeEthers() {
  if (typeof window.ethereum !== 'undefined') {
    provider = new ethers.BrowserProvider(window.ethereum);
    return true;
  }
  return false;
}

// Connect MetaMask wallet
export async function connectWallet() {
  try {
    if (!initializeEthers()) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = await provider.send("eth_requestAccounts", []);
    const account = accounts[0];
    
    // Get signer
    signer = await provider.getSigner();
    
    // Initialize contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Check if we're on the correct network
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(BLOCKDAG_CHAIN_ID)) {
      // Try to switch to BlockDAG testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${BLOCKDAG_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BLOCKDAG_CHAIN_ID.toString(16)}`,
              chainName: 'BlockDAG Testnet',
              nativeCurrency: {
                name: 'BDAG',
                symbol: 'BDAG',
                decimals: 18
              },
              rpcUrls: [BLOCKDAG_RPC_URL],
              blockExplorerUrls: ['https://primordial.bdagscan.com']
            }],
          });
        }
      }
    }

    return {
      address: account,
      status: 'Connected',
      chainId: network.chainId.toString()
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

// Store request on blockchain
export async function storeRequestOnChain(requestData) {
  try {
    if (!contract || !signer) {
      throw new Error('Wallet not connected');
    }

    console.log('📦 [FRONTEND] Storing request on blockchain...', requestData);

    // Create request hash from request data
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(requestData)));
    
    // Map request type to contract format
    const requestTypeMap = {
      'Finance': 'finance',
      'GBV Support': 'gbv', 
      'Sanitary Aid': 'sanitary'
    };
    
    const requestType = requestTypeMap[requestData.requestType] || 'finance';
    
    console.log('Request Hash:', requestHash);
    console.log('Request Type:', requestType);

    // Store on blockchain
    const tx = await contract.storeRequest(requestHash, requestType);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt.hash);
    
    return {
      success: true,
      transactionId: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      network: 'BlockDAG Testnet',
      message: 'Request successfully stored on blockchain',
      requestHash: requestHash,
      requestType: requestType
    };
  } catch (error) {
    console.error('❌ Error storing request on blockchain:', error);
    throw error;
  }
}

// Get requests from blockchain
export async function getRequestsFromChain() {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    console.log('🔍 [FRONTEND] Fetching requests from blockchain...');
    
    const requests = await contract.getRequests();
    
    return requests.map((request) => ({
      id: request.id.toString(),
      requestHash: request.requestHash,
      timestamp: new Date(parseInt(request.timestamp) * 1000).toISOString(),
      requestType: request.requestType,
      requester: request.requester
    }));
  } catch (error) {
    console.error('❌ Error fetching requests from blockchain:', error);
    throw error;
  }
}

// Get wallet connection status
export function getWalletStatus() {
  return {
    isConnected: !!signer,
    address: signer ? signer.address : null,
    contract: !!contract
  };
}
