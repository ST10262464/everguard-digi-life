require('dotenv').config();
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.BDAG_RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS.toLowerCase();

// Get capsule data with timestamps
async function getCapsuleTimestamps() {
  const contract = new ethers.Contract(
    contractAddress,
    [
      'function getCapsule(uint256 _id) public view returns (uint256 id, string capsuleHash, uint256 timestamp, string capsuleType, address owner, uint8 status)'
    ],
    provider
  );

  console.log('🔍 Getting capsule timestamps...\n');
  const capsules = [];
  
  for (let i = 0; i < 35; i++) {
    try {
      const capsule = await contract.getCapsule(i);
      if (capsule && capsule.owner !== ethers.ZeroAddress) {
        capsules.push({
          id: i,
          timestamp: Number(capsule.timestamp),
          date: new Date(Number(capsule.timestamp) * 1000).toISOString()
        });
      }
    } catch (e) {
      break;
    }
  }
  
  return capsules;
}

// Given a timestamp, find the block number
async function findBlockByTimestamp(targetTimestamp) {
  const currentBlock = await provider.getBlockNumber();
  let low = 0;
  let high = currentBlock;
  
  console.log(`Searching for block with timestamp ${targetTimestamp}...`);
  
  // Binary search (roughly)
  while (high - low > 100) {
    const mid = Math.floor((low + high) / 2);
    const block = await provider.getBlock(mid);
    
    if (block.timestamp < targetTimestamp) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  // Linear search in the final range
  for (let blockNum = low; blockNum <= high; blockNum++) {
    const block = await provider.getBlock(blockNum, true); // Include transactions
    
    if (!block) continue;
    
    // Check if any transaction in this block is to our contract
    for (const tx of block.transactions) {
      if (tx.to && tx.to.toLowerCase() === contractAddress) {
        console.log(`✅ Found potential tx: ${tx.hash} in block ${blockNum}`);
        return { blockNum, txHash: tx.hash, blockTimestamp: block.timestamp };
      }
    }
    
    // If block timestamp is way past target, stop
    if (block.timestamp > targetTimestamp + 3600) {
      break;
    }
  }
  
  return null;
}

async function main() {
  try {
    const capsules = await getCapsuleTimestamps();
    console.log(`Found ${capsules.length} capsules\n`);
    
    // Take first 3 capsules as test
    for (const capsule of capsules.slice(0, 3)) {
      console.log(`\n📦 Capsule #${capsule.id} created at ${capsule.date}`);
      const result = await findBlockByTimestamp(capsule.timestamp);
      
      if (result) {
        console.log(`   Block: ${result.blockNum}, TX: ${result.txHash}`);
      } else {
        console.log(`   ❌ No transaction found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

