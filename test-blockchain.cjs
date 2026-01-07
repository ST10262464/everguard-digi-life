/**
 * Test script to explore BlockDAG RPC capabilities
 * Run: node test-blockchain.js
 */

const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.awakening.bdagscan.com';
const CONTRACT_ADDRESS = '0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c';

// Minimal ABI for reading contract data
const CONTRACT_ABI = [
  "function getCapsule(uint256 _id) public view returns (tuple(uint256 id, string capsuleHash, uint256 timestamp, string capsuleType, address owner, uint8 status))",
  "function getCapsuleAccessLog(uint256 _capsuleId) public view returns (uint256[] memory)",
  "event CapsuleCreated(uint256 indexed id, string capsuleHash, string capsuleType, address owner)",
  "event BurstKeyIssued(uint256 indexed burstId, uint256 indexed capsuleId, address accessor, uint256 expiresAt)",
  "event BurstKeyConsumed(uint256 indexed burstId, uint256 indexed capsuleId, address accessor, uint256 consumedAt)"
];

async function main() {
  console.log('🔍 Testing BlockDAG RPC capabilities...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  // Test 1: Get current block number
  console.log('=== TEST 1: Get Block Number ===');
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Current block: ${blockNumber}\n`);
  } catch (e) {
    console.log(`❌ Failed: ${e.message}\n`);
  }
  
  // Test 2: Get transaction count for contract address
  console.log('=== TEST 2: Get Transaction Count ===');
  try {
    const txCount = await provider.getTransactionCount(CONTRACT_ADDRESS);
    console.log(`✅ Transaction count for contract: ${txCount}\n`);
  } catch (e) {
    console.log(`❌ Failed: ${e.message}\n`);
  }
  
  // Test 3: Try eth_getLogs (we expect this to fail)
  console.log('=== TEST 3: eth_getLogs (Event Query) ===');
  try {
    const filter = contract.filters.CapsuleCreated();
    const events = await contract.queryFilter(filter, -1000, 'latest');
    console.log(`✅ Found ${events.length} CapsuleCreated events\n`);
  } catch (e) {
    console.log(`❌ Failed (expected): ${e.message}\n`);
  }
  
  // Test 4: Query capsules directly by ID
  console.log('=== TEST 4: Query Capsules Directly ===');
  let capsuleCount = 0;
  for (let i = 1; i <= 100; i++) {
    try {
      const capsule = await contract.getCapsule(i);
      if (capsule && capsule.id && capsule.id.toString() !== '0') {
        capsuleCount++;
        if (capsuleCount <= 5) {
          console.log(`  Capsule #${i}: owner=${capsule.owner.substring(0,10)}..., type=${capsule.capsuleType}`);
        }
      }
    } catch (e) {
      // Capsule doesn't exist, stop searching
      if (i === 1) {
        console.log(`❌ Could not query capsule #1: ${e.message}`);
      }
      break;
    }
  }
  console.log(`✅ Found ${capsuleCount} capsules via direct query\n`);
  
  // Test 5: Get a known transaction by hash (from your CSV)
  console.log('=== TEST 5: Get Transaction by Hash ===');
  const knownTxHash = '0xa3a17fa259ee37f4e02770947cbd0abac926caebd6dd9560199985e0e4e60903';
  try {
    const tx = await provider.getTransaction(knownTxHash);
    if (tx) {
      console.log(`✅ Transaction found!`);
      console.log(`   Block: ${tx.blockNumber}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to}`);
    }
    
    const receipt = await provider.getTransactionReceipt(knownTxHash);
    if (receipt) {
      console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      console.log(`   Logs: ${receipt.logs.length} events`);
    }
    console.log('');
  } catch (e) {
    console.log(`❌ Failed: ${e.message}\n`);
  }
  
  // Test 6: Get transactions for an address via raw RPC
  console.log('=== TEST 6: Raw RPC - eth_getBalance ===');
  try {
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log(`✅ Contract balance: ${ethers.formatEther(balance)} BDAG\n`);
  } catch (e) {
    console.log(`❌ Failed: ${e.message}\n`);
  }
  
  // Test 7: Try to get contract code
  console.log('=== TEST 7: Get Contract Code ===');
  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log(`✅ Contract code length: ${code.length} bytes`);
    console.log(`   Contract is deployed: ${code !== '0x'}\n`);
  } catch (e) {
    console.log(`❌ Failed: ${e.message}\n`);
  }
  
  // Test 8: Try debug/trace methods (unlikely to work on public RPC)
  console.log('=== TEST 8: Debug Trace (unlikely to work) ===');
  try {
    const result = await provider.send('debug_traceTransaction', [knownTxHash]);
    console.log(`✅ Debug trace available!\n`);
  } catch (e) {
    console.log(`❌ Not available: ${e.message.substring(0, 100)}\n`);
  }
  
  // Test 9: Try to get block with full transaction objects
  console.log('=== TEST 9: Get Recent Block with Transactions ===');
  try {
    const block = await provider.getBlock('latest', true);
    console.log(`✅ Latest block: ${block.number}`);
    console.log(`   Transactions in block: ${block.transactions?.length || 0}`);
    
    // Check if any transactions are to our contract
    if (block.prefetchedTransactions) {
      const ourTxs = block.prefetchedTransactions.filter(tx => 
        tx.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
      );
      console.log(`   Transactions to our contract: ${ourTxs.length}\n`);
    }
  } catch (e) {
    console.log(`❌ Failed: ${e.message}\n`);
  }
  
  console.log('=== SUMMARY ===');
  console.log('Based on these tests, we can determine which methods work with BlockDAG RPC.');
  console.log('If direct capsule query works (Test 4), we can use that to get your data!');
}

main().catch(console.error);

