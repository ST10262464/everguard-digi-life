require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load server .env file
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { firestore } = require('../server/firebase.js');

class DataImporter {
  constructor() {
    this.db = firestore;
    this.importStats = {
      requests: { created: 0, skipped: 0, errors: 0 },
      users: { created: 0, skipped: 0, errors: 0 },
      transactions: { created: 0, skipped: 0, errors: 0 }
    };
  }

  async importFromFile(filepath) {
    try {
      console.log(`🔄 Starting import from: ${filepath}`);
      
      // Read and parse the export file
      const fileContent = fs.readFileSync(filepath, 'utf8');
      const exportData = JSON.parse(fileContent);
      
      console.log('📊 Import data summary:');
      console.log(`   - Requests: ${exportData.data.requests?.length || 0}`);
      console.log(`   - Users: ${exportData.data.users?.length || 0}`);
      console.log(`   - Transactions: ${exportData.data.transactions?.length || 0}`);
      console.log(`   - Exported at: ${exportData.metadata?.exportedAt || 'Unknown'}`);
      
      // Import each collection
      if (exportData.data.requests) {
        await this.importRequests(exportData.data.requests);
      }
      
      if (exportData.data.users) {
        await this.importUsers(exportData.data.users);
      }
      
      if (exportData.data.transactions) {
        await this.importTransactions(exportData.data.transactions);
      }
      
      console.log('\n✅ Import completed successfully!');
      this.printImportStats();
      
      return this.importStats;
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  async importRequests(requests) {
    console.log('\n📝 Importing requests...');
    
    for (const request of requests) {
      try {
        // Check if request already exists (by original ID)
        const existingQuery = await this.db.collection('requests')
          .where('migratedFrom', '==', 'memory')
          .where('originalId', '==', request.id)
          .get();
        
        if (!existingQuery.empty) {
          console.log(`   ⏭️  Skipped request ${request.id} (already imported)`);
          this.importStats.requests.skipped++;
          continue;
        }
        
        // Prepare request data for Firestore
        const firestoreRequest = {
          name: request.name,
          requestType: request.requestType,
          description: request.description,
          status: request.status,
          timestamp: new Date(request.timestamp),
          location: request.location,
          submittedBy: request.submittedBy,
          userEmail: request.userEmail,
          anonymous: request.anonymous || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          migratedFrom: 'memory',
          originalId: request.id,
          migrationTimestamp: new Date()
        };
        
        // Add to Firestore
        const docRef = await this.db.collection('requests').add(firestoreRequest);
        console.log(`   ✅ Created request ${request.id} -> ${docRef.id}`);
        this.importStats.requests.created++;
        
      } catch (error) {
        console.error(`   ❌ Error importing request ${request.id}:`, error.message);
        this.importStats.requests.errors++;
      }
    }
  }

  async importUsers(users) {
    console.log('\n👥 Importing users...');
    
    for (const user of users) {
      try {
        // Check if user already exists
        const existingQuery = await this.db.collection('users')
          .where('migratedFrom', '==', 'memory')
          .where('originalId', '==', user.id)
          .get();
        
        if (!existingQuery.empty) {
          console.log(`   ⏭️  Skipped user ${user.id} (already imported)`);
          this.importStats.users.skipped++;
          continue;
        }
        
        // Prepare user data for Firestore
        const firestoreUser = {
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(),
          migratedFrom: 'memory',
          originalId: user.id,
          migrationTimestamp: new Date()
        };
        
        // Add to Firestore
        const docRef = await this.db.collection('users').add(firestoreUser);
        console.log(`   ✅ Created user ${user.id} -> ${docRef.id}`);
        this.importStats.users.created++;
        
      } catch (error) {
        console.error(`   ❌ Error importing user ${user.id}:`, error.message);
        this.importStats.users.errors++;
      }
    }
  }

  async importTransactions(transactions) {
    console.log('\n💳 Importing transactions...');
    
    for (const transaction of transactions) {
      try {
        // Check if transaction already exists
        const existingQuery = await this.db.collection('transactions')
          .where('migratedFrom', '==', 'memory')
          .where('originalId', '==', transaction.id)
          .get();
        
        if (!existingQuery.empty) {
          console.log(`   ⏭️  Skipped transaction ${transaction.id} (already imported)`);
          this.importStats.transactions.skipped++;
          continue;
        }
        
        // Prepare transaction data for Firestore
        const firestoreTransaction = {
          requestId: transaction.requestId,
          userId: transaction.userId,
          type: transaction.type,
          timestamp: new Date(transaction.timestamp),
          metadata: transaction.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
          migratedFrom: 'memory',
          originalId: transaction.id,
          migrationTimestamp: new Date()
        };
        
        // Add to Firestore
        const docRef = await this.db.collection('transactions').add(firestoreTransaction);
        console.log(`   ✅ Created transaction ${transaction.id} -> ${docRef.id}`);
        this.importStats.transactions.created++;
        
      } catch (error) {
        console.error(`   ❌ Error importing transaction ${transaction.id}:`, error.message);
        this.importStats.transactions.errors++;
      }
    }
  }

  printImportStats() {
    console.log('\n📊 Import Statistics:');
    console.log('   Requests:');
    console.log(`     ✅ Created: ${this.importStats.requests.created}`);
    console.log(`     ⏭️  Skipped: ${this.importStats.requests.skipped}`);
    console.log(`     ❌ Errors: ${this.importStats.requests.errors}`);
    
    console.log('   Users:');
    console.log(`     ✅ Created: ${this.importStats.users.created}`);
    console.log(`     ⏭️  Skipped: ${this.importStats.users.skipped}`);
    console.log(`     ❌ Errors: ${this.importStats.users.errors}`);
    
    console.log('   Transactions:');
    console.log(`     ✅ Created: ${this.importStats.transactions.created}`);
    console.log(`     ⏭️  Skipped: ${this.importStats.transactions.skipped}`);
    console.log(`     ❌ Errors: ${this.importStats.transactions.errors}`);
  }

  async listImportedDocs() {
    console.log('\n🔍 Listing imported documents...');
    
    try {
      // Get imported requests
      const requestsSnapshot = await this.db.collection('requests')
        .where('migratedFrom', '==', 'memory')
        .limit(5)
        .get();
      
      console.log(`📝 Imported Requests (showing ${requestsSnapshot.size}):`);
      requestsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name} (${data.requestType}) - ${data.status}`);
      });
      
      // Get imported users
      const usersSnapshot = await this.db.collection('users')
        .where('migratedFrom', '==', 'memory')
        .limit(5)
        .get();
      
      console.log(`👥 Imported Users (showing ${usersSnapshot.size}):`);
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name} (${data.email})`);
      });
      
    } catch (error) {
      console.error('❌ Error listing imported docs:', error);
    }
  }
}

// If run directly, execute the import
if (require.main === module) {
  const importer = new DataImporter();
  
  async function runImport() {
    try {
      // Check if filepath is provided as argument
      const filepath = process.argv[2];
      
      if (!filepath) {
        console.error('❌ Please provide a filepath to import from');
        console.log('Usage: node scripts/importData.js <export-file-path>');
        process.exit(1);
      }
      
      if (!fs.existsSync(filepath)) {
        console.error(`❌ File not found: ${filepath}`);
        process.exit(1);
      }
      
      const stats = await importer.importFromFile(filepath);
      await importer.listImportedDocs();
      
      console.log('\n🎉 Import completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  }
  
  runImport();
}

module.exports = DataImporter;
