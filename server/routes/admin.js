const express = require('express');
const { getFirestore, COLLECTIONS } = require('../config/firebase');
const { getBurstKeyStatus, BURST_KEY_STATUS } = require('../utils/burstKey');
const { getQueueStats, getAllTransactions, getHistoricalTransactions } = require('../utils/transactionQueue');
const { getAllBlockchainTransactions, getTransactionByHash, getAllContractData } = require('../blockchain');

const router = express.Router();

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.USERS).get();
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      // Don't send passwords
      const { password, ...userWithoutPassword } = userData;
      users.push({
        id: doc.id,
        ...userWithoutPassword
      });
    });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/capsules
 * Get all capsules with blockchain IDs
 */
router.get('/capsules', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.CAPSULES).get();
    
    const capsules = [];
    snapshot.forEach(doc => {
      capsules.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by creation date (newest first)
    capsules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      count: capsules.length,
      capsules
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching capsules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/burstkeys
 * Get all BurstKeys with computed status
 */
router.get('/burstkeys', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.BURST_KEYS).get();
    
    const burstKeys = [];
    snapshot.forEach(doc => {
      const keyData = doc.data();
      const status = getBurstKeyStatus(keyData);
      
      burstKeys.push({
        id: doc.id,
        ...keyData,
        computedStatus: status,
        isActive: status === BURST_KEY_STATUS.ACTIVE,
        isExpired: status === BURST_KEY_STATUS.EXPIRED,
        isConsumed: status === BURST_KEY_STATUS.CONSUMED
      });
    });
    
    // Sort by creation date (newest first)
    burstKeys.sort((a, b) => b.issuedAt - a.issuedAt);
    
    res.json({
      success: true,
      count: burstKeys.length,
      burstKeys,
      stats: {
        active: burstKeys.filter(k => k.isActive).length,
        consumed: burstKeys.filter(k => k.isConsumed).length,
        expired: burstKeys.filter(k => k.isExpired).length
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching burst keys:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/audit
 * Get all audit logs with pagination
 */
router.get('/audit', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const db = getFirestore();
    
    const snapshot = await db.collection(COLLECTIONS.AUDIT_LOG)
      .limit(parseInt(limit))
      .get();
    
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Count by event type
    const eventTypes = {};
    logs.forEach(log => {
      eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
    });
    
    res.json({
      success: true,
      count: logs.length,
      logs,
      stats: {
        eventTypes,
        totalEvents: logs.length
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/medics
 * Get medic registry
 */
router.get('/medics', async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.MEDIC_REGISTRY).get();
    
    const medics = [];
    snapshot.forEach(doc => {
      medics.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      count: medics.length,
      medics,
      stats: {
        verified: medics.filter(m => m.verified).length,
        pending: medics.filter(m => !m.verified).length
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching medics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/transactions
 * Get all blockchain transactions (queue + Firestore + contract + burstKeys + capsules)
 */
router.get('/transactions', async (req, res) => {
  try {
    const db = getFirestore();
    
    // Get pending transactions from queue
    const queueTransactions = getAllTransactions();
    const queueStats = getQueueStats();
    
    // Get historical transactions from Firestore transactions collection
    const firestoreTransactions = await getHistoricalTransactions(200);
    
    // Get burst keys from Firestore (they have blockchain tx hashes!)
    let burstKeysFromFirestore = [];
    try {
      const burstKeysSnapshot = await db.collection(COLLECTIONS.BURST_KEYS).get();
      burstKeysSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.blockchainTxHash || data.txHash) {
          burstKeysFromFirestore.push({
            txId: doc.id,
            type: 'BurstKeyIssued',
            txHash: data.blockchainTxHash || data.txHash,
            status: 'confirmed',
            source: 'firestore_burstkeys',
            metadata: {
              burstId: data.burstId,
              capsuleId: data.capsuleId,
              accessorId: data.accessorId,
              blockchainBurstKeyId: data.blockchainBurstKeyId
            },
            createdAt: data.issuedAt ? new Date(data.issuedAt).toISOString() : null,
            completedAt: data.issuedAt ? new Date(data.issuedAt).toISOString() : null
          });
        }
      });
      console.log(`📋 [ADMIN] Found ${burstKeysFromFirestore.length} burst keys with tx hashes`);
    } catch (e) {
      console.warn('⚠️  [ADMIN] Could not fetch burst keys:', e.message);
    }
    
    // Get capsules from Firestore (they have blockchain tx hashes!)
    let capsulesFromFirestore = [];
    try {
      const capsulesSnapshot = await db.collection(COLLECTIONS.CAPSULES).get();
      capsulesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.blockchainTxHash || data.txHash) {
          capsulesFromFirestore.push({
            txId: doc.id,
            type: 'CapsuleCreated',
            txHash: data.blockchainTxHash || data.txHash,
            status: 'confirmed',
            source: 'firestore_capsules',
            metadata: {
              capsuleId: doc.id,
              capsuleType: data.capsuleType,
              blockchainId: data.blockchainId,
              ownerId: data.ownerId
            },
            createdAt: data.createdAt,
            completedAt: data.createdAt
          });
        }
      });
      console.log(`📋 [ADMIN] Found ${capsulesFromFirestore.length} capsules with tx hashes`);
    } catch (e) {
      console.warn('⚠️  [ADMIN] Could not fetch capsules:', e.message);
    }
    
    // Get contract data directly (reliable, no block scanning)
    let contractData = { transactions: [], summary: {} };
    try {
      const result = await getAllContractData();
      if (result.success) {
        contractData = result;
      }
    } catch (contractError) {
      console.warn('⚠️  [ADMIN] Contract query failed:', contractError.message);
    }
    
    // Map to track unique transactions by txHash (prioritize real tx hashes)
    const transactionMap = new Map();
    
    // Add Firestore capsules with tx hashes (highest priority - real blockchain links)
    capsulesFromFirestore.forEach(tx => {
      if (tx.txHash) {
        transactionMap.set(tx.txHash, tx);
      }
    });
    
    // Add Firestore burst keys with tx hashes
    burstKeysFromFirestore.forEach(tx => {
      if (tx.txHash && !transactionMap.has(tx.txHash)) {
        transactionMap.set(tx.txHash, tx);
      }
    });
    
    // Add queue transactions
    queueTransactions.forEach(tx => {
      const key = tx.txHash || tx.txId;
      if (!transactionMap.has(key)) {
        transactionMap.set(key, {
          ...tx,
          source: 'queue',
          status: tx.status || 'pending',
          createdAt: new Date(tx.createdAt).toISOString()
        });
      }
    });
    
    // Add Firestore transactions collection
    firestoreTransactions.forEach(tx => {
      const key = tx.txHash || tx.txId;
      if (!transactionMap.has(key)) {
        transactionMap.set(key, {
          txId: tx.txId,
          type: tx.type,
          txHash: tx.txHash,
          status: tx.status,
          source: 'firestore',
          metadata: tx.metadata || {},
          result: tx.result || {},
          createdAt: tx.createdAt,
          completedAt: tx.completedAt
        });
      }
    });
    
    // Add contract data (only if we don't have real tx hashes for them)
    contractData.transactions.forEach(tx => {
      // Only add if we don't have a transaction with a real hash for this capsule/burstkey
      const hasRealTx = Array.from(transactionMap.values()).some(existing => 
        existing.metadata?.capsuleId === tx.metadata?.capsuleId && 
        existing.type === tx.type &&
        existing.txHash
      );
      
      if (!hasRealTx) {
        const key = tx.txId;
        if (!transactionMap.has(key)) {
          transactionMap.set(key, tx);
        }
      }
    });
    
    // Convert map to array
    const allTransactions = Array.from(transactionMap.values());
    
    // Sort by creation time (newest first)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    
    res.json({
      success: true,
      count: allTransactions.length,
      transactions: allTransactions,
      stats: {
        ...queueStats,
        contractCapsules: contractData.summary?.totalCapsules || 0,
        contractBurstKeys: contractData.summary?.totalBurstKeys || 0,
        firestoreCapsules: capsulesFromFirestore.length,
        firestoreBurstKeys: burstKeysFromFirestore.length,
        firestoreTransactions: firestoreTransactions.length,
        queueTransactions: queueTransactions.length,
        totalUnique: allTransactions.length
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/stats
 * Get overall system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const db = getFirestore();
    
    // Get counts from each collection
    const [usersSnap, capsulesSnap, burstKeysSnap, auditSnap, medicsSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS).get(),
      db.collection(COLLECTIONS.CAPSULES).get(),
      db.collection(COLLECTIONS.BURST_KEYS).get(),
      db.collection(COLLECTIONS.AUDIT_LOG).get(),
      db.collection(COLLECTIONS.MEDIC_REGISTRY).get()
    ]);
    
    const burstKeys = [];
    burstKeysSnap.forEach(doc => {
      const keyData = doc.data();
      burstKeys.push({
        ...keyData,
        status: getBurstKeyStatus(keyData)
      });
    });
    
    const medics = [];
    medicsSnap.forEach(doc => {
      medics.push(doc.data());
    });
    
    res.json({
      success: true,
      stats: {
        users: {
          total: usersSnap.size,
          patients: usersSnap.docs.filter(d => d.data().role === 'patient').length,
          medics: usersSnap.docs.filter(d => d.data().role === 'medic').length
        },
        capsules: {
          total: capsulesSnap.size
        },
        burstKeys: {
          total: burstKeys.length,
          active: burstKeys.filter(k => k.status === BURST_KEY_STATUS.ACTIVE).length,
          consumed: burstKeys.filter(k => k.status === BURST_KEY_STATUS.CONSUMED).length,
          expired: burstKeys.filter(k => k.status === BURST_KEY_STATUS.EXPIRED).length
        },
        audit: {
          total: auditSnap.size
        },
        medics: {
          total: medics.length,
          verified: medics.filter(m => m.verified).length,
          pending: medics.filter(m => !m.verified).length
        }
      }
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/import-transactions
 * Import transactions by their hashes (from BlockDAG explorer)
 * Body: { transactions: ["0x123...", "0x456..."] }
 */
router.post('/import-transactions', async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of transaction hashes'
      });
    }
    
    console.log(`📥 [ADMIN] Importing ${transactions.length} transactions...`);
    
    const db = getFirestore();
    const results = {
      imported: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    for (const txHash of transactions) {
      try {
        // Check if already exists
        const existing = await db.collection(COLLECTIONS.TRANSACTIONS).doc(txHash).get();
        if (existing.exists) {
          results.skipped++;
          results.details.push({ txHash, status: 'skipped', reason: 'Already exists' });
          continue;
        }
        
        // Fetch and verify from blockchain
        const txResult = await getTransactionByHash(txHash);
        
        if (!txResult.success) {
          results.failed++;
          results.details.push({ txHash, status: 'failed', reason: txResult.error });
          continue;
        }
        
        // Save to Firestore
        const txData = {
          txId: txHash,
          type: txResult.events[0]?.type || 'ContractInteraction',
          txHash: txHash,
          status: txResult.status,
          metadata: {
            blockNumber: txResult.blockNumber,
            events: txResult.events
          },
          createdAt: txResult.timestamp,
          completedAt: txResult.timestamp,
          source: 'manual_import'
        };
        
        await db.collection(COLLECTIONS.TRANSACTIONS).doc(txHash).set(txData);
        results.imported++;
        results.details.push({ txHash, status: 'imported', type: txData.type });
        
        // Small delay to avoid overwhelming RPC
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        results.failed++;
        results.details.push({ txHash, status: 'failed', reason: error.message });
      }
    }
    
    console.log(`✅ [ADMIN] Import complete: ${results.imported} imported, ${results.skipped} skipped, ${results.failed} failed`);
    
    res.json({
      success: true,
      message: `Imported ${results.imported} transactions`,
      results
    });
    
  } catch (error) {
    console.error('❌ [ADMIN] Error importing transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/sync-blockchain
 * DEPRECATED - Block scanning is unreliable
 * Use /import-transactions instead with hashes from BlockDAG explorer
 */
router.post('/sync-blockchain', async (req, res) => {
  res.status(400).json({
    success: false,
    error: 'Block scanning is disabled due to RPC rate limiting',
    message: 'Please use /api/admin/import-transactions instead. Get your transaction hashes from the BlockDAG explorer at https://awakening.bdagscan.com',
    instructions: [
      '1. Go to https://awakening.bdagscan.com',
      '2. Search for your contract address',
      '3. Copy all transaction hashes from your contract',
      '4. POST them to /api/admin/import-transactions as { "transactions": ["0x...", "0x..."] }'
    ]
  });
});

module.exports = router;

