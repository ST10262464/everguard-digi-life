require('dotenv').config();
const { getPendingQueueItems, updateQueueItemStatus, updateRequest, getRequest } = require('./firestoreService');
const { storeHashOnBlockchain } = require('../blockchain');
const { createTransaction } = require('./firestoreService');

/**
 * Blockchain Queue Worker
 * Processes pending requests from Firestore and stores them on the blockchain
 * Includes idempotency checks to prevent duplicate transactions
 */

class BlockchainQueueWorker {
  constructor() {
    this.isRunning = false;
    this.processingInterval = 5000; // 5 seconds
    this.maxRetries = 3;
    this.currentInterval = null;
  }

  /**
   * Start the queue worker
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Queue worker is already running');
      return;
    }

    console.log('🚀 Starting blockchain queue worker...');
    this.isRunning = true;
    this.processQueue();
  }

  /**
   * Stop the queue worker
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Queue worker is not running');
      return;
    }

    console.log('🛑 Stopping blockchain queue worker...');
    this.isRunning = false;
    
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  /**
   * Process the queue of pending requests
   */
  async processQueue() {
    if (!this.isRunning) return;

    try {
      console.log('🔍 Checking for pending blockchain transactions...');
      
      // Get pending queue items
      const pendingItems = await getPendingQueueItems();
      
      if (pendingItems.length === 0) {
        console.log('ℹ️  No pending items in queue');
        this.scheduleNext();
        return;
      }

      console.log(`📋 Found ${pendingItems.length} pending items`);

      // Process each pending item
      for (const item of pendingItems) {
        if (!this.isRunning) break;
        
        await this.processQueueItem(item);
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error);
    }

    this.scheduleNext();
  }

  /**
   * Process a single queue item
   */
  async processQueueItem(item) {
    const { id: queueItemId, requestId, requestHash, attempts = 0 } = item;

    try {
      console.log(`🔄 Processing queue item ${queueItemId} for request ${requestId} (attempt ${attempts + 1})`);

      // Check if we've exceeded max retries
      if (attempts >= this.maxRetries) {
        console.log(`❌ Max retries exceeded for queue item ${queueItemId}`);
        await updateQueueItemStatus(queueItemId, 'failed', {
          attempts: attempts + 1,
          lastAttempt: new Date().toISOString(),
          error: 'Max retries exceeded'
        });
        return;
      }

      // Get the current request from Firestore
      const request = await getRequest(requestId);
      if (!request) {
        console.log(`❌ Request ${requestId} not found in Firestore`);
        await updateQueueItemStatus(queueItemId, 'failed', {
          attempts: attempts + 1,
          lastAttempt: new Date().toISOString(),
          error: 'Request not found in Firestore'
        });
        return;
      }

      // Check for idempotency - skip if already has txHash
      if (request.txHash) {
        console.log(`✅ Request ${requestId} already has transaction hash: ${request.txHash}`);
        await updateQueueItemStatus(queueItemId, 'completed', {
          attempts: attempts + 1,
          lastAttempt: new Date().toISOString(),
          txHash: request.txHash,
          blockNumber: request.blockNumber
        });
        return;
      }

      // Update queue item to processing
      await updateQueueItemStatus(queueItemId, 'processing', {
        attempts: attempts + 1,
        lastAttempt: new Date().toISOString()
      });

      console.log(`⛓️  Storing hash on blockchain: ${requestHash.substring(0, 20)}...`);

      // Store hash on blockchain
      const blockchainResult = await storeHashOnBlockchain({
        requestHash,
        requestType: request.requestType,
        location: request.location,
        submittedBy: request.submittedBy,
        anonymous: request.anonymous
      });

      console.log('✅ Blockchain transaction successful:', blockchainResult);

      // Update request with blockchain info
      const updateData = {
        status: 'onchain',
        txHash: blockchainResult.transactionId,
        blockNumber: blockchainResult.blockNumber,
        onchainAt: new Date().toISOString()
      };

      await updateRequest(requestId, updateData);
      console.log(`✅ Request ${requestId} updated with blockchain info`);

      // Create transaction record
      await createTransaction({
        requestId,
        userId: request.submittedBy,
        txHash: blockchainResult.transactionId,
        blockNumber: blockchainResult.blockNumber,
        type: 'request_stored',
        amount: 0, // No monetary amount for request storage
        status: 'completed'
      });

      // Update queue item to completed
      await updateQueueItemStatus(queueItemId, 'completed', {
        attempts: attempts + 1,
        lastAttempt: new Date().toISOString(),
        txHash: blockchainResult.transactionId,
        blockNumber: blockchainResult.blockNumber
      });

      console.log(`✅ Queue item ${queueItemId} completed successfully`);

    } catch (error) {
      console.error(`❌ Error processing queue item ${queueItemId}:`, error);

      // Update queue item with error
      await updateQueueItemStatus(queueItemId, 'pending', {
        attempts: attempts + 1,
        lastAttempt: new Date().toISOString(),
        error: error.message
      });

      // If it's a blockchain error, we'll retry later
      if (error.message.includes('blockchain') || error.message.includes('network')) {
        console.log(`🔄 Will retry queue item ${queueItemId} on next cycle`);
      } else {
        // For other errors, mark as failed
        await updateQueueItemStatus(queueItemId, 'failed', {
          attempts: attempts + 1,
          lastAttempt: new Date().toISOString(),
          error: error.message
        });
      }
    }
  }

  /**
   * Schedule the next processing cycle
   */
  scheduleNext() {
    if (!this.isRunning) return;

    this.currentInterval = setTimeout(() => {
      this.processQueue();
    }, this.processingInterval);
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      processingInterval: this.processingInterval,
      maxRetries: this.maxRetries
    };
  }
}

// Create singleton instance
const queueWorker = new BlockchainQueueWorker();

// Start the queue worker when this module is run directly
if (require.main === module) {
  console.log('🚀 Starting blockchain queue worker...');
  queueWorker.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down queue worker...');
  queueWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down queue worker...');
  queueWorker.stop();
  process.exit(0);
});

module.exports = queueWorker;
