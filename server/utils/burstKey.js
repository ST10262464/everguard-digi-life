const crypto = require('crypto');
const { getFirestore, COLLECTIONS } = require('../config/firebase');

/**
 * BurstKey Service for EverGuard
 * Handles temporary, single-use emergency access keys using Firestore
 */

const BURST_KEY_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Status enum for burst keys
const BURST_KEY_STATUS = {
  ACTIVE: 'active',      // Key is valid and can be used
  CONSUMED: 'consumed',  // Key has been used
  EXPIRED: 'expired'     // Key has expired (automatic)
};

let burstKeyIdCounter = 1;

/**
 * Generate a random BurstKey
 */
function generateBurstKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Issue a new BurstKey for emergency access
 */
async function issueBurstKey(capsuleId, accessorId, accessorPubKey, context) {
  try {
    console.log(`🔑 [BURSTKEY] Issuing BurstKey for capsule: ${capsuleId}`);
    
    const db = getFirestore();
    const burstKey = generateBurstKey();
    const burstId = `burst_${burstKeyIdCounter++}`;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + BURST_KEY_DURATION;
    
    const burstKeyData = {
      burstId: burstId,
      blockchainBurstKeyId: null, // Will be set after blockchain logging
      burstKey: burstKey,
      capsuleId: capsuleId,
      accessorId: accessorId,
      accessorPubKey: accessorPubKey || null,
      issuedAt: issuedAt,
      expiresAt: expiresAt,
      consumed: false, // Keep for backward compatibility
      status: BURST_KEY_STATUS.ACTIVE, // New status enum
      singleUse: true,
      context: {
        location: context?.location || null,
        deviceId: context?.deviceId || null,
        attestation: context?.attestation || 'emergency'
      },
      createdAt: new Date().toISOString()
    };
    
    // Store in Firestore (use burstKey as document ID for fast lookups)
    await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).set(burstKeyData);
    
    console.log(`✅ [BURSTKEY] Issued: ${burstId}`);
    console.log(`⏰ [BURSTKEY] Expires at: ${new Date(expiresAt).toISOString()}`);
    console.log(`🔐 [BURSTKEY] Key: ${burstKey.substring(0, 16)}...`);
    
    return {
      burstId: burstId,
      burstKey: burstKey,
      expiresAt: expiresAt,
      expiresIn: BURST_KEY_DURATION / 1000 // seconds
    };
  } catch (error) {
    console.error('❌ [BURSTKEY] Error issuing BurstKey:', error);
    throw error;
  }
}

/**
 * Verify and consume a BurstKey (single-use)
 */
async function verifyAndConsumeBurstKey(burstKey, accessorId) {
  try {
    console.log(`🔍 [BURSTKEY] Verifying BurstKey for accessor: ${accessorId}`);
    
    const db = getFirestore();
    const doc = await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).get();
    
    if (!doc.exists) {
      console.log('❌ [BURSTKEY] Invalid BurstKey');
      return { valid: false, error: 'Invalid BurstKey' };
    }
    
    const burstKeyData = doc.data();
    
    // Check if accessor matches
    if (burstKeyData.accessorId !== accessorId) {
      console.log('❌ [BURSTKEY] Accessor ID mismatch');
      return { valid: false, error: 'Unauthorized accessor' };
    }
    
    // Check if already consumed
    if (burstKeyData.consumed) {
      console.log('❌ [BURSTKEY] Already consumed');
      return { valid: false, error: 'BurstKey already consumed' };
    }
    
    // Check if expired
    if (Date.now() > burstKeyData.expiresAt) {
      console.log('❌ [BURSTKEY] Expired');
      return { valid: false, error: 'BurstKey expired' };
    }
    
    // Mark as consumed
    await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).update({
      consumed: true, // Keep for backward compatibility
      status: BURST_KEY_STATUS.CONSUMED,
      consumedAt: Date.now()
    });
    
    console.log(`✅ [BURSTKEY] Consumed: ${burstKeyData.burstId}`);
    
    return {
      valid: true,
      capsuleId: burstKeyData.capsuleId,
      burstId: burstKeyData.burstId,
      blockchainBurstKeyId: burstKeyData.blockchainBurstKeyId,
      context: burstKeyData.context
    };
  } catch (error) {
    console.error('❌ [BURSTKEY] Error verifying BurstKey:', error);
    throw error;
  }
}

/**
 * Get BurstKey details by ID
 */
async function getBurstKeyById(burstId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.BURST_KEYS)
      .where('burstId', '==', burstId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data();
  } catch (error) {
    console.error('❌ [BURSTKEY] Error getting BurstKey by ID:', error);
    throw error;
  }
}

/**
 * Check if BurstKey is valid (not consumed and not expired)
 */
async function isBurstKeyValid(burstKey) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).get();
    
    if (!doc.exists) return false;
    
    const data = doc.data();
    if (data.consumed) return false;
    if (Date.now() > data.expiresAt) return false;
    
    return true;
  } catch (error) {
    console.error('❌ [BURSTKEY] Error checking validity:', error);
    return false;
  }
}

/**
 * Get all BurstKeys for a capsule (for audit log)
 */
async function getCapsuleBurstKeys(capsuleId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.BURST_KEYS)
      .where('capsuleId', '==', capsuleId)
      .get();
    
    const capsuleBurstKeys = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      capsuleBurstKeys.push({
        burstId: data.burstId,
        accessorId: data.accessorId,
        issuedAt: data.issuedAt,
        expiresAt: data.expiresAt,
        consumed: data.consumed,
        consumedAt: data.consumedAt || null,
        context: data.context
      });
    });
    
    return capsuleBurstKeys;
  } catch (error) {
    console.error('❌ [BURSTKEY] Error getting capsule BurstKeys:', error);
    throw error;
  }
}

/**
 * Update BurstKey with blockchain ID
 */
async function updateBurstKeyBlockchainId(burstKey, blockchainBurstKeyId) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).get();
    
    if (!doc.exists) {
      throw new Error('BurstKey not found');
    }
    
    await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).update({
      blockchainBurstKeyId: blockchainBurstKeyId
    });
    
    const burstKeyData = doc.data();
    console.log(`🔗 [BURSTKEY] Updated blockchain ID for ${burstKeyData.burstId}: ${blockchainBurstKeyId}`);
    
    // Return updated data
    const updated = await db.collection(COLLECTIONS.BURST_KEYS).doc(burstKey).get();
    return updated.data();
  } catch (error) {
    console.error('❌ [BURSTKEY] Error updating blockchain ID:', error);
    throw error;
  }
}

/**
 * Get the current status of a BurstKey (handles automatic expiry)
 */
function getBurstKeyStatus(burstKeyData) {
  // If already marked as consumed, return consumed
  if (burstKeyData.status === BURST_KEY_STATUS.CONSUMED || burstKeyData.consumed) {
    return BURST_KEY_STATUS.CONSUMED;
  }
  
  // Check if expired
  if (Date.now() > burstKeyData.expiresAt) {
    return BURST_KEY_STATUS.EXPIRED;
  }
  
  // Otherwise, it's active
  return BURST_KEY_STATUS.ACTIVE;
}

/**
 * Check if there's an active BurstKey for a specific medic + capsule pair
 * Returns the active key data if found, null otherwise
 */
async function checkActiveBurstKey(medicId, capsuleId) {
  try {
    console.log(`🔍 [BURSTKEY] Checking for active key: medic=${medicId}, capsule=${capsuleId}`);
    
    const db = getFirestore();
    const now = Date.now();
    
    // Query for keys matching this medic + capsule
    const snapshot = await db.collection(COLLECTIONS.BURST_KEYS)
      .where('accessorId', '==', medicId)
      .where('capsuleId', '==', capsuleId)
      .get();
    
    // Check each key to find an active one
    for (const doc of snapshot.docs) {
      const keyData = doc.data();
      const status = getBurstKeyStatus(keyData);
      
      if (status === BURST_KEY_STATUS.ACTIVE) {
        console.log(`⚠️  [BURSTKEY] Found active key: ${keyData.burstId} (expires at ${new Date(keyData.expiresAt).toISOString()})`);
        return keyData;
      }
    }
    
    console.log(`✅ [BURSTKEY] No active key found`);
    return null;
  } catch (error) {
    console.error('❌ [BURSTKEY] Error checking active BurstKey:', error);
    throw error;
  }
}

/**
 * Mark expired BurstKeys with status (instead of deleting)
 */
async function markExpiredBurstKeys() {
  try {
    const db = getFirestore();
    const now = Date.now();
    
    // Find expired burst keys that are still marked as active
    const snapshot = await db.collection(COLLECTIONS.BURST_KEYS)
      .where('expiresAt', '<', now)
      .where('status', '==', BURST_KEY_STATUS.ACTIVE)
      .get();
    
    if (snapshot.empty) {
      return 0;
    }
    
    // Update status to expired in batch
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: BURST_KEY_STATUS.EXPIRED });
    });
    
    await batch.commit();
    const marked = snapshot.size;
    
    if (marked > 0) {
      console.log(`🧹 [BURSTKEY] Marked ${marked} BurstKeys as expired`);
    }
    
    return marked;
  } catch (error) {
    console.error('❌ [BURSTKEY] Error marking expired BurstKeys:', error);
    throw error;
  }
}

/**
 * Cleanup expired BurstKeys (optional maintenance - deletes old data)
 */
async function cleanupExpiredBurstKeys() {
  try {
    const db = getFirestore();
    const now = Date.now();
    
    // Find expired burst keys
    const snapshot = await db.collection(COLLECTIONS.BURST_KEYS)
      .where('expiresAt', '<', now)
      .get();
    
    if (snapshot.empty) {
      return 0;
    }
    
    // Delete expired keys in batch
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    const cleaned = snapshot.size;
    
    if (cleaned > 0) {
      console.log(`🧹 [BURSTKEY] Cleaned up ${cleaned} expired BurstKeys`);
    }
    
    return cleaned;
  } catch (error) {
    console.error('❌ [BURSTKEY] Error cleaning up expired BurstKeys:', error);
    throw error;
  }
}

module.exports = {
  generateBurstKey,
  issueBurstKey,
  verifyAndConsumeBurstKey,
  getBurstKeyById,
  isBurstKeyValid,
  getCapsuleBurstKeys,
  updateBurstKeyBlockchainId,
  cleanupExpiredBurstKeys,
  // New Phase 1 functions
  getBurstKeyStatus,
  checkActiveBurstKey,
  markExpiredBurstKeys,
  BURST_KEY_DURATION,
  BURST_KEY_STATUS
};

