require('dotenv').config({ path: '../.env' });
const { getFirestore, COLLECTIONS, initializeFirebase } = require('../config/firebase');

/**
 * Seed Demo Data for EverGuard Hackathon
 * Creates: Alice (patient), Dr. MedicJoe (verified medic), RandomScanner (non-verified)
 */

async function seedDemoData() {
  try {
    console.log('🌱 [SEED] Starting demo data seed...');
    
    // Initialize Firebase
    initializeFirebase();
    const db = getFirestore();
    
    // 1. Seed Users
    console.log('\n👥 [SEED] Creating demo users...');
    
    const users = [
      {
        id: 'user_alice',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'patient',
        publicKey: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'medic_joe',
        name: 'Dr. Joe Smith',
        email: 'joe@hospital.com',
        role: 'medic',
        licenseNumber: 'MD-12345',
        verified: true,
        publicKey: '0x1234567890abcdef1234567890abcdef12345678',
        createdAt: new Date().toISOString()
      },
      {
        id: 'random_scanner',
        name: 'Random Bystander',
        email: null,
        role: 'non-verified',
        publicKey: null,
        createdAt: new Date().toISOString()
      }
    ];
    
    for (const user of users) {
      await db.collection(COLLECTIONS.USERS).doc(user.id).set(user);
      console.log(`  ✅ Created user: ${user.name} (${user.role})`);
    }
    
    // 2. Seed Medic Registry
    console.log('\n🏥 [SEED] Creating medic registry...');
    
    const medics = [
      {
        id: 'medic_joe',
        name: 'Dr. Joe Smith',
        licenseNumber: 'MD-12345',
        verified: true,
        verifiedAt: new Date().toISOString(),
        specialty: 'Emergency Medicine',
        hospital: 'City General Hospital',
        publicKey: '0x1234567890abcdef1234567890abcdef12345678',
        createdAt: new Date().toISOString()
      }
    ];
    
    for (const medic of medics) {
      await db.collection(COLLECTIONS.MEDIC_REGISTRY).doc(medic.id).set(medic);
      console.log(`  ✅ Added to registry: ${medic.name} (${medic.licenseNumber})`);
    }
    
    // 3. Display Summary
    console.log('\n📊 [SEED] Demo Data Summary:');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  👤 Alice Johnson (user_alice)');
    console.log('     Role: Patient');
    console.log('     - Can create medical capsules');
    console.log('     - Owns cap_1 (created via API)');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🩺 Dr. Joe Smith (medic_joe)');
    console.log('     Role: Verified Medic');
    console.log('     License: MD-12345');
    console.log('     - Can request full emergency access');
    console.log('     - Gets burst keys for decryption');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🧍 Random Bystander (random_scanner)');
    console.log('     Role: Non-Verified');
    console.log('     - Can only see ICE view (emergency contact)');
    console.log('     - No access to medical data');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n✅ [SEED] Demo data seeded successfully!');
    console.log('\n📝 [SEED] Next steps:');
    console.log('  1. Start the server: cd server && node server.js');
    console.log('  2. Create test capsule: .\\create-test-capsule.ps1');
    console.log('  3. Test emergency access with medic_joe');
    console.log('  4. Test ICE view with random_scanner');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [SEED] Error seeding demo data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seed script
seedDemoData();

