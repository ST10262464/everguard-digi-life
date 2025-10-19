const { getFirestore, COLLECTIONS } = require('../config/firebase');

/**
 * Audit Log Service for EverGuard
 * Logs all access attempts (successful and denied) to Firestore
 */

/**
 * Log a restricted access attempt (denied)
 */
async function logRestrictedAccessAttempt(capsuleId, requesterId, reason, context) {
  try {
    const db = getFirestore();
    
    const logEntry = {
      capsuleId: capsuleId,
      requesterId: requesterId,
      attemptType: 'RESTRICTED_ACCESS_ATTEMPT',
      reason: reason,
      context: context || {},
      denied: true,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    // Store in audit log collection
    await db.collection(COLLECTIONS.AUDIT_LOG).add(logEntry);
    
    console.log(`📝 [AUDIT] Restricted access attempt logged`);
    console.log(`   Capsule: ${capsuleId}`);
    console.log(`   Requester: ${requesterId}`);
    console.log(`   Reason: ${reason}`);
    
    return logEntry;
  } catch (error) {
    console.error('❌ [AUDIT] Error logging restricted access:', error);
    throw error;
  }
}

/**
 * Log an active key blocked event
 */
async function logActiveKeyBlocked(capsuleId, requesterId, existingBurstKeyId, context) {
  try {
    const db = getFirestore();
    
    const logEntry = {
      capsuleId: capsuleId,
      requesterId: requesterId,
      attemptType: 'ACTIVE_KEY_BLOCKED',
      reason: 'Active burst key already exists',
      existingBurstKeyId: existingBurstKeyId,
      context: context || {},
      denied: true,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    // Store in audit log collection
    await db.collection(COLLECTIONS.AUDIT_LOG).add(logEntry);
    
    console.log(`📝 [AUDIT] Active key block logged`);
    console.log(`   Capsule: ${capsuleId}`);
    console.log(`   Requester: ${requesterId}`);
    console.log(`   Existing Key: ${existingBurstKeyId}`);
    
    return logEntry;
  } catch (error) {
    console.error('❌ [AUDIT] Error logging active key block:', error);
    throw error;
  }
}

/**
 * Log BurstKey issuance (successful access grant)
 */
async function logBurstKeyIssued(capsuleId, burstId, accessorId, expiresAt, txHash = null) {
  try {
    const db = getFirestore();
    
    const logEntry = {
      eventType: 'BURST_KEY_ISSUED',
      capsuleId: capsuleId,
      burstId: burstId,
      accessorId: accessorId,
      expiresAt: expiresAt,
      txHash: txHash,
      status: 'granted',
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    await db.collection(COLLECTIONS.AUDIT_LOG).add(logEntry);
    
    console.log(`📝 [AUDIT] BurstKey issuance logged: ${burstId}`);
    
    return logEntry;
  } catch (error) {
    console.error('❌ [AUDIT] Error logging BurstKey issuance:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
}

/**
 * Log BurstKey consumption (data access)
 */
async function logBurstKeyConsumed(capsuleId, burstId, accessorId, txHash = null) {
  try {
    const db = getFirestore();
    
    const logEntry = {
      eventType: 'BURST_KEY_CONSUMED',
      capsuleId: capsuleId,
      burstId: burstId,
      accessorId: accessorId,
      txHash: txHash,
      status: 'consumed',
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    await db.collection(COLLECTIONS.AUDIT_LOG).add(logEntry);
    
    console.log(`📝 [AUDIT] BurstKey consumption logged: ${burstId}`);
    
    return logEntry;
  } catch (error) {
    console.error('❌ [AUDIT] Error logging BurstKey consumption:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
}

/**
 * Get audit log for a capsule
 */
async function getCapsuleAuditLog(capsuleId) {
  try {
    const db = getFirestore();
    
    // Query without orderBy to avoid requiring composite index
    const snapshot = await db.collection(COLLECTIONS.AUDIT_LOG)
      .where('capsuleId', '==', capsuleId)
      .get();
    
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort in memory by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit to 50 most recent
    return logs.slice(0, 50);
  } catch (error) {
    console.error('❌ [AUDIT] Error retrieving audit log:', error);
    throw error;
  }
}

module.exports = {
  logRestrictedAccessAttempt,
  logActiveKeyBlocked,
  logBurstKeyIssued,
  logBurstKeyConsumed,
  getCapsuleAuditLog
};


