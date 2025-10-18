require('dotenv').config();
const { createDonation, getDonationsStats } = require('../services/firestoreService');

// Initial donation data to populate the database
const initialDonations = [
  // General Support - R45,000 raised
  ...Array(45).fill().map((_, i) => ({
    amount: 1000,
    cause: 'general',
    paymentMethod: 'card',
    donorInfo: {
      name: `Initial Donor ${i + 1}`,
      email: `donor${i + 1}@example.com`,
      message: 'Initial population donation'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
    transactionHash: `INIT_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // Education & Skills - R28,000 raised
  ...Array(28).fill().map((_, i) => ({
    amount: 1000,
    cause: 'education',
    paymentMethod: 'card',
    donorInfo: {
      name: `Education Donor ${i + 1}`,
      email: `education${i + 1}@example.com`,
      message: 'Supporting education initiatives'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `EDU_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // Health & Sanitary Aid - R15,000 raised
  ...Array(15).fill().map((_, i) => ({
    amount: 1000,
    cause: 'health',
    paymentMethod: 'card',
    donorInfo: {
      name: `Health Donor ${i + 1}`,
      email: `health${i + 1}@example.com`,
      message: 'Supporting health initiatives'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `HEALTH_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // GBV Support - R22,000 raised
  ...Array(22).fill().map((_, i) => ({
    amount: 1000,
    cause: 'gbv',
    paymentMethod: 'card',
    donorInfo: {
      name: `GBV Donor ${i + 1}`,
      email: `gbv${i + 1}@example.com`,
      message: 'Supporting GBV initiatives'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `GBV_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // Financial Literacy - R18,000 raised
  ...Array(18).fill().map((_, i) => ({
    amount: 1000,
    cause: 'finance',
    paymentMethod: 'card',
    donorInfo: {
      name: `Finance Donor ${i + 1}`,
      email: `finance${i + 1}@example.com`,
      message: 'Supporting financial literacy'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `FINANCE_TX_${i + 1}`,
    blockchainTxHash: null
  }))
];

async function populateDonations() {
  try {
    console.log('🚀 Starting donation database population...');
    console.log(`📊 Will create ${initialDonations.length} initial donations`);

    let createdCount = 0;
    for (const donation of initialDonations) {
      try {
        await createDonation(donation);
        createdCount++;
        if (createdCount % 10 === 0) {
          console.log(`✅ Created ${createdCount} donations...`);
        }
      } catch (error) {
        console.error(`❌ Error creating donation:`, error);
      }
    }

    console.log(`✅ Successfully created ${createdCount} initial donations`);

    // Get and display stats
    const stats = await getDonationsStats();
    console.log('📊 Current donation statistics:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Error populating donations:', error);
  }
}

// Run the population script
if (require.main === module) {
  populateDonations().then(() => {
    console.log('🎉 Donation population completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Population failed:', error);
    process.exit(1);
  });
}

module.exports = { populateDonations };
