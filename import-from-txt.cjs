require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const { getFirestore, initializeFirebase, COLLECTIONS } = require('./server/config/firebase');

initializeFirebase();

const provider = new ethers.JsonRpcProvider(process.env.BDAG_RPC_URL);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  require('./artifacts/contracts/EverGuardCapsules.sol/EverGuardCapsules.json').abi,
  provider
);

async function processTxHashes(txtPath) {
  const txtContent = fs.readFileSync(txtPath, 'utf-8');
  const txHashes = txtContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('0x') && line.length === 66);
  
  console.log(`📄 Processing ${txHashes.length} transaction hashes...\n`);
  
  const db = getFirestore();
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const txHash of txHashes) {
    console.log(`\n🔍 Processing ${txHash}...`);
    
    try {
      // Check if already exists in Firestore
      const existing = await db.collection(COLLECTIONS.TRANSACTIONS).doc(txHash).get();
      if (existing.exists) {
        console.log(`   ⏭️  Already in Firestore, skipping`);
        skipped++;
        continue;
      }
      
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        console.log(`   ❌ Receipt not found on blockchain`);
        errors++;
        continue;
      }
      
      // Get block for timestamp
      const block = await provider.getBlock(receipt.blockNumber);
      const timestamp = block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString();
      
      // Parse events from logs
      let eventType = 'Unknown';
      let metadata = {};
      
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === process.env.CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            if (parsed) {
              eventType = parsed.name;
              
              if (eventType === 'CapsuleCreated') {
                metadata = {
                  capsuleId: parsed.args.id?.toString(),
                  capsuleHash: parsed.args.capsuleHash,
                  capsuleType: parsed.args.capsuleType,
                  owner: parsed.args.owner
                };
              } else if (eventType === 'BurstKeyIssued') {
                metadata = {
                  burstId: parsed.args.burstId?.toString(),
                  capsuleId: parsed.args.capsuleId?.toString(),
                  accessor: parsed.args.accessor,
                  expiresAt: parsed.args.expiresAt?.toString()
                };
              } else if (eventType === 'BurstKeyConsumed') {
                metadata = {
                  burstId: parsed.args.burstId?.toString(),
                  capsuleId: parsed.args.capsuleId?.toString(),
                  accessor: parsed.args.accessor
                };
              }
              
              break; // Found relevant event
            }
          } catch (parseError) {
            // Ignore logs we can't parse
          }
        }
      }
      
      // Store to Firestore
      const txData = {
        txId: txHash,
        type: eventType,
        txHash: txHash,
        status: 'confirmed',
        metadata: metadata,
        result: {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          from: receipt.from,
          to: receipt.to
        },
        createdAt: timestamp,
        completedAt: new Date().toISOString(),
        source: 'manual_import'
      };
      
      await db.collection(COLLECTIONS.TRANSACTIONS).doc(txHash).set(txData);
      
      console.log(`   ✅ Imported: ${eventType}`);
      if (metadata.capsuleId) console.log(`      Capsule ID: ${metadata.capsuleId}`);
      if (metadata.burstId) console.log(`      Burst ID: ${metadata.burstId}`);
      
      imported++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n\n✅ ========================================`);
  console.log(`   Import Summary`);
  console.log(`   ========================================`);
  console.log(`   ✅ Successfully imported: ${imported}`);
  console.log(`   ⏭️  Already existed:      ${skipped}`);
  console.log(`   ❌ Errors:               ${errors}`);
  console.log(`   📊 Total processed:      ${txHashes.length}`);
  console.log(`   ========================================\n`);
}

// Check if file argument provided
const filePath = process.argv[2] || './transaction-hashes.txt';

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  console.log(`\n📝 Usage: node import-from-txt.cjs [filepath]`);
  console.log(`   Example: node import-from-txt.cjs transaction-hashes.txt`);
  console.log(`\n📋 File format: One transaction hash per line`);
  console.log(`   0xabc123...`);
  console.log(`   0xdef456...`);
  console.log(`   0x789abc...`);
  process.exit(1);
}

// Run
processTxHashes(filePath)
  .then(() => {
    console.log('🎉 Done! Refresh your admin page to see the imported transactions.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

