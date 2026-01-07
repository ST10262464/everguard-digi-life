/**
 * Import ALL data from the contract and save as JSON
 * Run: node import-from-contract.cjs
 */

const { ethers } = require('ethers');
const fs = require('fs');

const RPC_URL = 'https://rpc.awakening.bdagscan.com';
const CONTRACT_ADDRESS = '0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c';

const CONTRACT_ABI = [
  "function getCapsule(uint256 _id) public view returns (tuple(uint256 id, string capsuleHash, uint256 timestamp, string capsuleType, address owner, uint8 status))",
  "function getCapsuleAccessLog(uint256 _capsuleId) public view returns (uint256[] memory)"
];

async function main() {
  console.log('🔍 Extracting ALL data from EverGuard contract...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  const capsules = [];
  const burstKeyUsage = [];
  let consecutiveFails = 0;
  
  console.log('Fetching capsules...');
  
  for (let i = 1; i <= 200 && consecutiveFails < 5; i++) {
    try {
      const capsule = await contract.getCapsule(i);
      if (capsule && capsule.id && capsule.id.toString() !== '0') {
        const capsuleData = {
          id: Number(capsule.id),
          capsuleHash: capsule.capsuleHash,
          timestamp: new Date(Number(capsule.timestamp) * 1000).toISOString(),
          capsuleType: capsule.capsuleType,
          owner: capsule.owner,
          status: Number(capsule.status)
        };
        capsules.push(capsuleData);
        consecutiveFails = 0;
        
        process.stdout.write(`  Capsule #${i} ✓  `);
        
        // Get access log for this capsule
        try {
          const accessLog = await contract.getCapsuleAccessLog(i);
          if (accessLog && accessLog.length > 0) {
            accessLog.forEach(burstId => {
              burstKeyUsage.push({
                capsuleId: Number(capsule.id),
                burstKeyId: Number(burstId),
                timestamp: capsuleData.timestamp // We don't have exact timestamp
              });
            });
            process.stdout.write(`(${accessLog.length} burst keys)`);
          }
        } catch (e) {
          // No access log
        }
        console.log('');
      } else {
        consecutiveFails++;
      }
    } catch (e) {
      consecutiveFails++;
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total capsules: ${capsules.length}`);
  console.log(`Total burst key usages: ${burstKeyUsage.length}`);
  
  // Create transaction-like records for import
  const transactions = [];
  
  // Add capsule creations
  capsules.forEach(capsule => {
    transactions.push({
      txId: `capsule_${capsule.id}`,
      type: 'CapsuleCreated',
      status: 'confirmed',
      source: 'contract_query',
      metadata: {
        capsuleId: capsule.id.toString(),
        capsuleHash: capsule.capsuleHash,
        capsuleType: capsule.capsuleType,
        owner: capsule.owner
      },
      createdAt: capsule.timestamp,
      completedAt: capsule.timestamp
    });
  });
  
  // Add burst key usages
  burstKeyUsage.forEach(usage => {
    transactions.push({
      txId: `burstkey_${usage.burstKeyId}_capsule_${usage.capsuleId}`,
      type: 'BurstKeyUsed',
      status: 'confirmed',
      source: 'contract_query',
      metadata: {
        capsuleId: usage.capsuleId.toString(),
        burstKeyId: usage.burstKeyId.toString()
      },
      createdAt: usage.timestamp,
      completedAt: usage.timestamp
    });
  });
  
  // Sort by date
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Save to JSON
  const output = {
    extractedAt: new Date().toISOString(),
    contractAddress: CONTRACT_ADDRESS,
    summary: {
      totalCapsules: capsules.length,
      totalBurstKeyUsages: burstKeyUsage.length,
      totalTransactions: transactions.length
    },
    capsules,
    burstKeyUsage,
    transactions
  };
  
  const outputPath = './extracted-contract-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved to ${outputPath}`);
  
  // Also create a simple list of hashes you DO have from the CSV
  const knownHashes = [
    '0xa3a17fa259ee37f4e02770947cbd0abac926caebd6dd9560199985e0e4e60903',
    '0x6bd3c0da71de94f795e0ff51b394ff4e1cae3dd79ba0757d66a4ce38ac51f0b4',
    '0xaa852682cee498f8a803304d1631bf92752794715f2ba78f2ce223a7737c9749',
    '0xde862905cd11f23aed1c322d29bb7ac16de13ef8ede2561c4c77508732e0be08',
    '0x83fdc7fb488e7567e374c7b115657db7b750baf59af88030c516a85b8f142ac8',
    '0xd7a2d23efa77ac14184c6d03a6cd10d477fc62cc9e2c133a3df324bd9f9841b1',
    '0x259fe5cb46fa6c64b7c909b8dbd35f1657194690acc1d33bea756b5f24ea4173',
    '0x1c3bac9d52a65d1572d7c84af5e9b9dc0d0c97abdfd29fca3ed9a86d1602512d',
    '0x869b06801a0b4cd1a91527cd7b3176b4357c2812e2921e5567885a9e3604aaf0',
    '0x83881295c9ec0cf04dca554069312e9d7cbd3e4d879c9c2e3544b2a42c99fa33'
  ];
  
  console.log(`\n📋 You have ${knownHashes.length} transaction hashes from your CSV`);
  console.log(`📊 The contract shows ${capsules.length} capsules + ${burstKeyUsage.length} burst key events`);
  console.log(`📈 Total on-chain activity: ${capsules.length + burstKeyUsage.length} events`);
  
  console.log('\n✅ Data extraction complete!');
  console.log('\nTo import to your app:');
  console.log('1. The JSON file contains all your capsule data');
  console.log('2. You can import the 10 known tx hashes via admin panel');
  console.log('3. The capsule data is already accessible from your contract!');
}

main().catch(console.error);

