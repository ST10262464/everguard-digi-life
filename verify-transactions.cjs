require('dotenv').config();
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.BDAG_RPC_URL);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  require('./artifacts/contracts/EverGuardCapsules.sol/EverGuardCapsules.json').abi,
  provider
);

async function verifyTransactions() {
  // Verify a sample of transactions
  const sampleTxs = [
    { hash: '0x925c254330b871344fa0995059d701dd6fa3a7ad9344eb6c912d1b96d01756df', expected: 'Capsule #0' },
    { hash: '0x5fe39166478ab8780dc30629c53bb7c6dd0fbd94cfc1e80e012bf5c0af36fd36', expected: 'Capsule #1' },
    { hash: '0x7d630a07d8d5d0ef0f0074bb4d35f5a3927e1971fb387c6e2cb9309d5faa67ac', expected: 'Capsule #2' },
    { hash: '0x3b11cbb1a5406d8517f7920ec95c12b4ace6b82094affd77481afeab00ed0267', expected: 'BurstKey #19 for Capsule #24' },
    { hash: '0x51711facf08b902f2e6fe76552a3dd001b5164fc1a7563fda0f581c1ebbb1c2d', expected: 'BurstKey #1 for Capsule #12' }
  ];

  console.log('🔍 Verifying Transaction Hashes Match Events\n');
  console.log('='.repeat(60) + '\n');

  let allCorrect = true;

  for (const sample of sampleTxs) {
    console.log(`TX: ${sample.hash}`);
    console.log(`Expected: ${sample.expected}`);
    
    try {
      const receipt = await provider.getTransactionReceipt(sample.hash);
      
      if (!receipt) {
        console.log('❌ Receipt not found\n');
        allCorrect = false;
        continue;
      }

      let found = false;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === process.env.CONTRACT_ADDRESS.toLowerCase()) {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });

            if (parsed) {
              let actual = '';
              if (parsed.name === 'CapsuleCreated') {
                actual = `Capsule #${parsed.args.id.toString()}`;
              } else if (parsed.name === 'BurstKeyIssued') {
                actual = `BurstKey #${parsed.args.burstId.toString()} for Capsule #${parsed.args.capsuleId.toString()}`;
              }

              console.log(`Actual:   ${actual}`);
              
              if (actual === sample.expected) {
                console.log('✅ MATCH!\n');
              } else {
                console.log('❌ MISMATCH!\n');
                allCorrect = false;
              }
              
              found = true;
              break;
            }
          } catch (parseError) {
            // Ignore logs we can't parse
          }
        }
      }

      if (!found) {
        console.log('❌ No matching event found\n');
        allCorrect = false;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      allCorrect = false;
    }
  }

  console.log('='.repeat(60));
  if (allCorrect) {
    console.log('\n✅ ALL VERIFIED! Transaction hashes match their events correctly.');
  } else {
    console.log('\n⚠️  Some mismatches detected. Please review above.');
  }
}

verifyTransactions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

