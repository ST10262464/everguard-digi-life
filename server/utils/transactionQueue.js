/**
 * Transaction Queue Manager
 * Handles pending blockchain transactions and retries
 */

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
function updateTransactionStatus(txId, status, result = null) {
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
    
    // Keep completed transactions for audit trail
    tx.completedAt = Date.now();
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
  
  return {
    total: pendingTransactions.size,
    pending: pending,
    confirmed: confirmed,
    failed: failed
  };
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
  cleanupOldTransactions
};

