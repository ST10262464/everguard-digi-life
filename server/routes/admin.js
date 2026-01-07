const express = require('express');
const { getFirestore, COLLECTIONS } = require('../config/firebase');
const { getBurstKeyStatus, BURST_KEY_STATUS } = require('../utils/burstKey');
const { getQueueStats, getAllTransactions, getHistoricalTransactions } = require('../utils/transactionQueue');
const { getAllBlockchainTransactions } = require('../blockchain');

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
 * Get all blockchain transactions (queue + Firestore historical + blockchain scan)
 */
router.get('/transactions', async (req, res) => {
  try {
    // Get pending transactions from queue
    const queueTransactions = getAllTransactions();
    const queueStats = getQueueStats();
    
    // Get historical transactions from Firestore
    const firestoreTransactions = await getHistoricalTransactions(200);
    
    // Get blockchain events with timeout (don't block the response)
    let blockchainEvents = [];
    try {
      // Set a 5-second timeout for blockchain scanning
      const blockchainPromise = getAllBlockchainTransactions();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain scan timeout')), 5000)
      );
      
      blockchainEvents = await Promise.race([blockchainPromise, timeoutPromise]);
    } catch (scanError) {
      console.warn('⚠️  [ADMIN] Blockchain scan timed out or failed, using Firestore data only:', scanError.message);
      // Continue with Firestore data only
    }
    
    // Map to track unique transactions by txHash
    const transactionMap = new Map();
    
    // Add queue transactions (highest priority - most recent status)
    queueTransactions.forEach(tx => {
      transactionMap.set(tx.txHash, {
        ...tx,
        source: 'queue',
        status: tx.status || 'pending',
        createdAt: new Date(tx.createdAt).toISOString()
      });
    });
    
    // Add Firestore historical transactions (don't overwrite queue items)
    firestoreTransactions.forEach(tx => {
      if (!transactionMap.has(tx.txHash)) {
        transactionMap.set(tx.txHash, {
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
    
    // Add blockchain events (only if not already in queue or Firestore)
    blockchainEvents.forEach(event => {
      if (!transactionMap.has(event.txHash)) {
        transactionMap.set(event.txHash, {
          txId: event.txHash,
          type: event.type,
          txHash: event.txHash,
          status: 'confirmed',
          source: 'blockchain',
          blockNumber: event.blockNumber,
          timestamp: event.timestamp,
          metadata: {
            capsuleId: event.capsuleId,
            burstId: event.burstId,
            accessor: event.accessor,
            owner: event.owner
          },
          createdAt: event.timestamp
        });
      }
    });
    
    // Convert map to array
    const allTransactions = Array.from(transactionMap.values());
    
    // Sort by creation time (newest first)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
    
    res.json({
      success: true,
      count: allTransactions.length,
      transactions: allTransactions,
      stats: {
        ...queueStats,
        blockchainEvents: blockchainEvents.length,
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
 * POST /api/admin/sync-blockchain
 * Trigger a background sync of historical blockchain transactions to Firestore
 */
router.post('/sync-blockchain', async (req, res) => {
  try {
    // Return immediately and run sync in background
    res.json({
      success: true,
      message: 'Blockchain sync started in background. This may take 10-30 minutes. Check logs for progress.'
    });
    
    // Run sync in background (non-blocking)
    setImmediate(async () => {
      try {
        console.log('🔄 [ADMIN] Starting background blockchain sync...');
        console.log('📊 [ADMIN] This will scan blocks and save historical transactions to Firestore');
        
        const db = getFirestore();
        
        // Do a deep scan (not quick)
        const events = await getAllBlockchainTransactions(false);
        
        console.log(`✅ [ADMIN] Blockchain scan complete. Found ${events.length} events`);
        
        // Save all events to Firestore
        let saved = 0;
        for (const event of events) {
          try {
            const txData = {
              txId: event.txHash,
              type: event.type,
              txHash: event.txHash,
              status: 'confirmed',
              metadata: {
                capsuleId: event.capsuleId,
                burstId: event.burstId,
                accessor: event.accessor,
                owner: event.owner,
                blockNumber: event.blockNumber
              },
              result: {},
              createdAt: event.timestamp,
              completedAt: event.timestamp,
              source: 'blockchain_sync'
            };
            
            // Check if already exists
            const existing = await db.collection(COLLECTIONS.TRANSACTIONS).doc(event.txHash).get();
            if (!existing.exists) {
              await db.collection(COLLECTIONS.TRANSACTIONS).doc(event.txHash).set(txData);
              saved++;
            }
          } catch (saveError) {
            console.warn(`⚠️  [ADMIN] Failed to save transaction ${event.txHash}:`, saveError.message);
          }
        }
        
        console.log(`✅ [ADMIN] Background sync complete. Saved ${saved} new transactions to Firestore`);
        console.log('💡 [ADMIN] Historical transactions now available in admin panel');
        
      } catch (syncError) {
        console.error('❌ [ADMIN] Background sync failed:', syncError.message);
      }
    });
    
  } catch (error) {
    console.error('❌ [ADMIN] Error starting sync:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

