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

async function processCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  console.log(`📄 Processing ${lines.length} transactions from CSV...\n`);
  
  const db = getFirestore();
  let imported = 0;
  let skipped = 0;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Parse CSV line - split by comma and remove quotes
    const fields = line.split(',').map(f => f.replace(/^"|"$/g, '').trim());
    
    if (fields.length < 14) {
      console.log(`⏭️  Skipping malformed line: ${line.substring(0, 50)}...`);
      continue;
    }
    
    const txHash = fields[2]; // 3rd column (index 2) is Txn Hash
    const blockNumber = fields[14]; // Last column is Block Number
    const createdAt = fields[13]; // Created At column
    
    if (!txHash || !txHash.startsWith('0x')) {
      console.log(`⏭️  Skipping invalid tx hash: ${txHash}`);
      continue;
    }
    
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
        console.log(`   ❌ Receipt not found`);
        continue;
      }
      
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
        createdAt: createdAt || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        source: 'csv_import'
      };
      
      await db.collection(COLLECTIONS.TRANSACTIONS).doc(txHash).set(txData);
      
      console.log(`   ✅ Imported: ${eventType}`);
      if (metadata.capsuleId) console.log(`      Capsule ID: ${metadata.capsuleId}`);
      if (metadata.burstId) console.log(`      Burst ID: ${metadata.burstId}`);
      
      imported++;
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${imported + skipped}`);
}

// Run
processCSV('./AddressTransfer_0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c.csv')
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

