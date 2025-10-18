require('dotenv').config();
const { ethers } = require('ethers');
const { firestore } = require('../firebase');

// Initialize Firestore
const db = firestore;

// Contract ABI for RequestStored event
const CONTRACT_ABI = [
  "event RequestStored(uint256 id, string requestHash, uint256 timestamp, string requestType, address requester)",
  "function getRequestCount() view returns (uint256)",
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getRequestById",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "requestHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "requestType",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "requester",
            "type": "address"
          }
        ],
        "internalType": "struct EmpowerHubRequests.Request",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

class BlockchainSyncService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BDAG_RPC_URL);
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.provider
    );
    this.isRunning = false;
  }

  // Start listening to new events
  async startEventListening() {
    if (this.isRunning) {
      console.log('⚠️  Event listener already running');
      return;
    }

    console.log('🔍 Starting blockchain event listener...');
    this.isRunning = true;

    this.contract.on('RequestStored', async (id, requestHash, timestamp, requestType, requester, event) => {
      console.log(`📡 New RequestStored event detected:`);
      console.log(`   ID: ${id}`);
      console.log(`   Hash: ${requestHash}`);
      console.log(`   Type: ${requestType}`);
      console.log(`   Requester: ${requester}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}`);

      await this.processBlockchainEvent({
        id: id.toString(),
        requestHash,
        timestamp: timestamp.toString(),
        requestType,
        requester,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });

    console.log('✅ Event listener started successfully');
  }

  // Stop listening to events
  stopEventListening() {
    if (!this.isRunning) {
      console.log('⚠️  Event listener not running');
      return;
    }

    this.contract.removeAllListeners('RequestStored');
    this.isRunning = false;
    console.log('🛑 Event listener stopped');
  }

  // Process a single blockchain event
  async processBlockchainEvent(eventData) {
    try {
      console.log(`🔄 Processing blockchain event for hash: ${eventData.requestHash}`);

      // Check if we already have this document in Firestore
      const requestsRef = db.collection('requests');
      const query = requestsRef.where('requestHash', '==', eventData.requestHash);
      const snapshot = await query.get();

      if (!snapshot.empty) {
        // Update existing document with blockchain data
        const doc = snapshot.docs[0];
        await doc.ref.update({
          status: 'onchain',
          blockNumber: eventData.blockNumber,
          txHash: eventData.transactionHash,
          onchainAt: new Date(),
          blockchainId: eventData.id,
          requester: eventData.requester,
          updatedAt: new Date()
        });
        console.log(`✅ Updated existing Firestore doc ${doc.id} with blockchain data`);
      } else {
        // Create new document from blockchain data
        const newDoc = {
          requestHash: eventData.requestHash,
          requestType: eventData.requestType,
          status: 'onchain-received',
          blockNumber: eventData.blockNumber,
          txHash: eventData.transactionHash,
          onchainAt: new Date(),
          blockchainId: eventData.id,
          requester: eventData.requester,
          timestamp: new Date(parseInt(eventData.timestamp) * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'blockchain-sync'
        };

        const docRef = await requestsRef.add(newDoc);
        console.log(`✅ Created new Firestore doc ${docRef.id} from blockchain data`);
      }
    } catch (error) {
      console.error('❌ Error processing blockchain event:', error);
    }
  }

  // One-time scan from block 0 to sync history
  async syncFromBlockZero() {
    console.log('🔄 Starting one-time sync from block 0...');
    
    try {
      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`📊 Current block: ${currentBlock}`);

      // Get total request count from contract
      const requestCount = await this.contract.getRequestCount();
      const totalRequests = Number(requestCount);
      console.log(`📊 Total requests on blockchain: ${totalRequests}`);

      let processedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      // Process each request from the contract
      for (let i = 0; i < totalRequests; i++) {
        try {
          const request = await this.contract.getRequestById(i);
          
          // Get all RequestStored events and find the one matching this request
          const events = await this.contract.queryFilter(
            this.contract.filters.RequestStored(),
            0,
            'latest'
          );

          // Find the event that matches this request's hash
          const matchingEvent = events.find(event => 
            event.args.requestHash === request[1] // requestHash is at index 1
          );

          if (matchingEvent) {
            const eventData = {
              id: request[0].toString(), // struct field 0: id
              requestHash: request[1],   // struct field 1: requestHash
              timestamp: request[2].toString(), // struct field 2: timestamp
              requestType: request[3],   // struct field 3: requestType
              requester: request[4],     // struct field 4: requester
              blockNumber: matchingEvent.blockNumber,
              transactionHash: matchingEvent.transactionHash
            };

            // Check if document exists in Firestore
            const requestsRef = db.collection('requests');
            const query = requestsRef.where('requestHash', '==', eventData.requestHash);
            const snapshot = await query.get();

            if (!snapshot.empty) {
              // Update existing document
              const doc = snapshot.docs[0];
              await doc.ref.update({
                status: 'onchain',
                blockNumber: eventData.blockNumber,
                txHash: eventData.transactionHash,
                onchainAt: new Date(),
                blockchainId: eventData.id,
                requester: eventData.requester,
                updatedAt: new Date()
              });
              updatedCount++;
              console.log(`✅ Updated doc ${doc.id} for blockchain request ${i}`);
            } else {
              // Create new document
              const newDoc = {
                requestHash: eventData.requestHash,
                requestType: eventData.requestType,
                status: 'onchain-received',
                blockNumber: eventData.blockNumber,
                txHash: eventData.transactionHash,
                onchainAt: new Date(),
                blockchainId: eventData.id,
                requester: eventData.requester,
                timestamp: new Date(parseInt(eventData.timestamp) * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
                source: 'blockchain-sync'
              };

              await requestsRef.add(newDoc);
              createdCount++;
              console.log(`✅ Created new doc for blockchain request ${i}`);
            }

            processedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing request ${i}:`, error);
        }
      }

      console.log('\n📊 Sync Summary:');
      console.log(`   Total blockchain requests: ${totalRequests}`);
      console.log(`   Processed: ${processedCount}`);
      console.log(`   Created: ${createdCount}`);
      console.log(`   Updated: ${updatedCount}`);

      return {
        total: totalRequests,
        processed: processedCount,
        created: createdCount,
        updated: updatedCount
      };

    } catch (error) {
      console.error('❌ Error during sync:', error);
      throw error;
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const requestCount = await this.contract.getRequestCount();
      const requestsRef = db.collection('requests');
      const snapshot = await requestsRef.get();
      
      const onchainDocs = snapshot.docs.filter(doc => 
        doc.data().status === 'onchain' || doc.data().status === 'onchain-received'
      );

      return {
        blockchainRequests: Number(requestCount),
        firestoreDocs: snapshot.size,
        onchainDocs: onchainDocs.length,
        syncPercentage: Number(requestCount) > 0 ? (onchainDocs.length / Number(requestCount)) * 100 : 0
      };
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      throw error;
    }
  }
}

// Export the service
module.exports = BlockchainSyncService;

// If run directly, start the sync
if (require.main === module) {
  const syncService = new BlockchainSyncService();
  
  async function runSync() {
    try {
      console.log('🚀 Starting blockchain sync service...');
      
      // Get initial status
      const status = await syncService.getSyncStatus();
      console.log('📊 Initial Status:', status);
      
      // Run one-time sync
      const result = await syncService.syncFromBlockZero();
      
      // Get final status
      const finalStatus = await syncService.getSyncStatus();
      console.log('📊 Final Status:', finalStatus);
      
      console.log('\n✅ Sync completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    }
  }
  
  runSync();
}
