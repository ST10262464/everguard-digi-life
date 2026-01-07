/**
 * Extract ALL capsule and access log data from the contract
 * Run: node extract-all-data.cjs
 */

const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.awakening.bdagscan.com';
const CONTRACT_ADDRESS = '0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c';

const CONTRACT_ABI = [
  "function getCapsule(uint256 _id) public view returns (tuple(uint256 id, string capsuleHash, uint256 timestamp, string capsuleType, address owner, uint8 status))",
  "function getCapsuleAccessLog(uint256 _capsuleId) public view returns (uint256[] memory)",
  "function nextCapsuleId() public view returns (uint256)",
  "function nextBurstKeyId() public view returns (uint256)"
];

async function main() {
  console.log('🔍 Extracting ALL data from EverGuard contract...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  // Try to get the next IDs to know how many exist
  console.log('=== CONTRACT STATE ===');
  try {
    const nextCapsuleId = await contract.nextCapsuleId();
    console.log(`Next Capsule ID: ${nextCapsuleId} (means ${nextCapsuleId - 1n} capsules exist)`);
  } catch (e) {
    console.log('Could not get nextCapsuleId');
  }
  
  try {
    const nextBurstKeyId = await contract.nextBurstKeyId();
    console.log(`Next BurstKey ID: ${nextBurstKeyId} (means ${nextBurstKeyId - 1n} burst keys issued)`);
  } catch (e) {
    console.log('Could not get nextBurstKeyId');
  }
  console.log('');
  
  // Get all capsules
  console.log('=== ALL CAPSULES ===');
  const capsules = [];
  let consecutiveFails = 0;
  
  for (let i = 1; i <= 200 && consecutiveFails < 5; i++) {
    try {
      const capsule = await contract.getCapsule(i);
      if (capsule && capsule.id && capsule.id.toString() !== '0') {
        const capsuleData = {
          id: capsule.id.toString(),
          capsuleHash: capsule.capsuleHash,
          timestamp: new Date(Number(capsule.timestamp) * 1000).toISOString(),
          capsuleType: capsule.capsuleType,
          owner: capsule.owner,
          status: capsule.status
        };
        capsules.push(capsuleData);
        consecutiveFails = 0;
        
        console.log(`Capsule #${i}:`);
        console.log(`  Hash: ${capsule.capsuleHash.substring(0, 30)}...`);
        console.log(`  Type: ${capsule.capsuleType}`);
        console.log(`  Owner: ${capsule.owner}`);
        console.log(`  Created: ${capsuleData.timestamp}`);
        console.log(`  Status: ${capsule.status}`);
        
        // Get access log for this capsule
        try {
          const accessLog = await contract.getCapsuleAccessLog(i);
          if (accessLog && accessLog.length > 0) {
            console.log(`  Access Log: ${accessLog.length} burst keys used`);
            console.log(`    BurstKey IDs: ${accessLog.map(id => id.toString()).join(', ')}`);
          }
        } catch (e) {
          // No access log or error
        }
        console.log('');
      } else {
        consecutiveFails++;
      }
    } catch (e) {
      consecutiveFails++;
      if (consecutiveFails >= 5) {
        console.log(`Stopped at capsule #${i} (5 consecutive fails)\n`);
      }
    }
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total capsules found: ${capsules.length}`);
  console.log(`Total owners: ${[...new Set(capsules.map(c => c.owner))].length}`);
  console.log(`Capsule types: ${[...new Set(capsules.map(c => c.capsuleType))].join(', ')}`);
  
  // Date range
  if (capsules.length > 0) {
    const dates = capsules.map(c => new Date(c.timestamp));
    const oldest = new Date(Math.min(...dates));
    const newest = new Date(Math.max(...dates));
    console.log(`Date range: ${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()}`);
  }
  
  // Save to JSON file
  const fs = require('fs');
  const outputPath = './extracted-capsules.json';
  fs.writeFileSync(outputPath, JSON.stringify(capsules, null, 2));
  console.log(`\n💾 Saved ${capsules.length} capsules to ${outputPath}`);
  
  console.log('\n✅ Data extraction complete!');
  console.log('You can now import this data into your app.');
}

main().catch(console.error);

