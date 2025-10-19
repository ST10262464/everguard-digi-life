const express = require('express');
const { getFirestore, COLLECTIONS } = require('../config/firebase');
const { getBurstKeyStatus, BURST_KEY_STATUS } = require('../utils/burstKey');
const { getQueueStats, getAllTransactions } = require('../utils/transactionQueue');
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
 * Get all blockchain transactions (queue + historical events)
 */
router.get('/transactions', async (req, res) => {
  try {
    // Get pending transactions from queue
    const queueTransactions = getAllTransactions();
    const queueStats = getQueueStats();
    
    // Get historical blockchain events
    const blockchainEvents = await getAllBlockchainTransactions();
    
    // Combine both types
    const allTransactions = [
      ...queueTransactions.map(tx => ({
        ...tx,
        source: 'queue',
        status: tx.status || 'pending'
      })),
      ...blockchainEvents.map(event => ({
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
        createdAt: new Date(event.timestamp).getTime()
      }))
    ];
    
    // Sort by creation time (newest first)
    allTransactions.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      success: true,
      count: allTransactions.length,
      transactions: allTransactions,
      stats: {
        ...queueStats,
        blockchainEvents: blockchainEvents.length,
        queueTransactions: queueTransactions.length
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

module.exports = router;

