/**
 * Transaction Queue Manager
 * Handles pending blockchain transactions and retries
 */

const { getFirestore, COLLECTIONS } = require('../config/firebase');

const pendingTransactions = new Map();
let txIdCounter = 1;

/**
 * Add a transaction to the queue
 */
function addPendingTransaction(type, txHash, metadata) {
  const txId = `tx_${txIdCounter++}`;
  
  const transaction = {
    txId: txId,
    type: type, // 'capsule', 'burstkey', 'consumption'
    txHash: txHash,
    status: 'pending',
    metadata: metadata,
    attempts: 0,
    maxAttempts: 3,
    createdAt: Date.now(),
    lastAttemptAt: Date.now()
  };
  
  pendingTransactions.set(txId, transaction);
  
  console.log(`📋 [QUEUE] Added transaction: ${txId} (${type})`);
  console.log(`   TX Hash: ${txHash}`);
  
  return transaction;
}

/**
 * Update transaction status
 */
async function updateTransactionStatus(txId, status, result = null) {
  const tx = pendingTransactions.get(txId);
  
  if (!tx) {
    console.warn(`⚠️  [QUEUE] Transaction not found: ${txId}`);
    return null;
  }
  
  tx.status = status;
  tx.lastAttemptAt = Date.now();
  
  if (result) {
    tx.result = result;
  }
  
  if (status === 'confirmed' || status === 'failed') {
    console.log(`${status === 'confirmed' ? '✅' : '❌'} [QUEUE] Transaction ${status}: ${txId}`);
    
    // Save to Firestore before removing from queue
    try {
      await storeTransactionToFirestore(tx);
    } catch (error) {
      console.error(`❌ [QUEUE] Failed to store transaction to Firestore:`, error.message);
    }
    
    // Remove confirmed/failed transactions from queue
    pendingTransactions.delete(txId);
  }
  
  return tx;
}

/**
 * Get transaction by ID
 */
function getTransaction(txId) {
  return pendingTransactions.get(txId);
}

/**
 * Get all transactions for a capsule
 */
function getCapsuleTransactions(capsuleId) {
  const transactions = [];
  
  for (const [txId, tx] of pendingTransactions.entries()) {
    if (tx.metadata && tx.metadata.capsuleId === capsuleId) {
      transactions.push(tx);
    }
  }
  
  return transactions;
}

/**
 * Get pending transactions (for retry processing)
 */
function getPendingTransactions() {
  const pending = [];
  const now = Date.now();
  const RETRY_INTERVAL = 30000; // 30 seconds
  
  for (const [txId, tx] of pendingTransactions.entries()) {
    if (tx.status === 'pending' && 
        tx.attempts < tx.maxAttempts &&
        (now - tx.lastAttemptAt) > RETRY_INTERVAL) {
      pending.push(tx);
    }
  }
  
  return pending;
}

/**
 * Mark transaction for retry
 */
function retryTransaction(txId) {
  const tx = pendingTransactions.get(txId);
  
  if (!tx) {
    return null;
  }
  
  tx.attempts++;
  tx.lastAttemptAt = Date.now();
  
  console.log(`🔄 [QUEUE] Retrying transaction: ${txId} (attempt ${tx.attempts}/${tx.maxAttempts})`);
  
  return tx;
}

/**
 * Get all transactions
 */
function getAllTransactions() {
  const transactions = [];
  
  for (const [txId, tx] of pendingTransactions.entries()) {
    transactions.push(tx);
  }
  
  // Sort by creation date (newest first)
  transactions.sort((a, b) => b.createdAt - a.createdAt);
  
  return transactions;
}

/**
 * Get queue statistics
 */
function getQueueStats() {
  let pending = 0;
  let confirmed = 0;
  let failed = 0;
  
  for (const tx of pendingTransactions.values()) {
    if (tx.status === 'pending') pending++;
    else if (tx.status === 'confirmed') confirmed++;
    else if (tx.status === 'failed') failed++;
  }
  
  // Note: No need for cleanup since confirmed/failed transactions are removed immediately
  
  return {
    total: pendingTransactions.size,
    pending: pending,
    confirmed: confirmed,
    failed: failed
  };
}

/**
 * Store transaction to Firestore for historical record
 */
async function storeTransactionToFirestore(tx) {
  try {
    const db = getFirestore();
    const docData = {
      txId: tx.txId,
      type: tx.type,
      txHash: tx.txHash,
      status: tx.status,
      metadata: tx.metadata || {},
      result: tx.result || {},
      createdAt: new Date(tx.createdAt).toISOString(),
      completedAt: new Date().toISOString()
    };
    
    await db.collection(COLLECTIONS.TRANSACTIONS).doc(tx.txId).set(docData);
    console.log(`💾 [QUEUE] Stored transaction to Firestore: ${tx.txId}`);
  } catch (error) {
    console.error(`❌ [QUEUE] Failed to store to Firestore:`, error.message);
    throw error;
  }
}

/**
 * Get historical transactions from Firestore
 */
async function getHistoricalTransactions(limit = 100) {
  try {
    const db = getFirestore();
    
    const snapshot = await db.collection(COLLECTIONS.TRANSACTIONS)
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .get();
    
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📋 [QUEUE] Retrieved ${transactions.length} historical transactions from Firestore`);
    return transactions;
  } catch (error) {
    console.error(`❌ [QUEUE] Failed to get historical transactions:`, error.message);
    return [];
  }
}

/**
 * Cleanup old transactions (optional maintenance)
 */
function cleanupOldTransactions() {
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  let cleaned = 0;
  
  for (const [txId, tx] of pendingTransactions.entries()) {
    if (tx.completedAt && (now - tx.completedAt) > MAX_AGE) {
      pendingTransactions.delete(txId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 [QUEUE] Cleaned ${cleaned} old transactions`);
  }
  
  return cleaned;
}

module.exports = {
  addPendingTransaction,
  updateTransactionStatus,
  getTransaction,
  getCapsuleTransactions,
  getPendingTransactions,
  retryTransaction,
  getAllTransactions,
  getQueueStats,
  getHistoricalTransactions,
  cleanupOldTransactions
};

