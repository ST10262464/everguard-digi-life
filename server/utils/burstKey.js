const crypto = require('crypto');

/**
 * BurstKey Service for EverGuard
 * Handles temporary, single-use emergency access keys
 */

const BURST_KEY_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// In-memory storage (replace with Firebase in production)
const burstKeys = new Map();
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
    
    const burstKey = generateBurstKey();
    const burstId = `burst_${burstKeyIdCounter++}`;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + BURST_KEY_DURATION;
    
    const burstKeyData = {
      burstId: burstId,
      burstKey: burstKey,
      capsuleId: capsuleId,
      accessorId: accessorId,
      accessorPubKey: accessorPubKey || null,
      issuedAt: issuedAt,
      expiresAt: expiresAt,
      consumed: false,
      singleUse: true,
      context: {
        location: context?.location || null,
        deviceId: context?.deviceId || null,
        attestation: context?.attestation || 'emergency'
      },
      createdAt: new Date().toISOString()
    };
    
    // Store in memory
    burstKeys.set(burstKey, burstKeyData);
    
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
    
    const burstKeyData = burstKeys.get(burstKey);
    
    if (!burstKeyData) {
      console.log('❌ [BURSTKEY] Invalid BurstKey');
      return { valid: false, error: 'Invalid BurstKey' };
    }
    
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
    burstKeyData.consumed = true;
    burstKeyData.consumedAt = Date.now();
    
    console.log(`✅ [BURSTKEY] Consumed: ${burstKeyData.burstId}`);
    
    return {
      valid: true,
      capsuleId: burstKeyData.capsuleId,
      burstId: burstKeyData.burstId,
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
  for (const [key, data] of burstKeys.entries()) {
    if (data.burstId === burstId) {
      return data;
    }
  }
  return null;
}

/**
 * Check if BurstKey is valid (not consumed and not expired)
 */
function isBurstKeyValid(burstKey) {
  const data = burstKeys.get(burstKey);
  
  if (!data) return false;
  if (data.consumed) return false;
  if (Date.now() > data.expiresAt) return false;
  
  return true;
}

/**
 * Get all BurstKeys for a capsule (for audit log)
 */
async function getCapsuleBurstKeys(capsuleId) {
  const capsuleBurstKeys = [];
  
  for (const [key, data] of burstKeys.entries()) {
    if (data.capsuleId === capsuleId) {
      capsuleBurstKeys.push({
        burstId: data.burstId,
        accessorId: data.accessorId,
        issuedAt: data.issuedAt,
        expiresAt: data.expiresAt,
        consumed: data.consumed,
        consumedAt: data.consumedAt || null,
        context: data.context
      });
    }
  }
  
  return capsuleBurstKeys;
}

/**
 * Cleanup expired BurstKeys (optional maintenance)
 */
function cleanupExpiredBurstKeys() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, data] of burstKeys.entries()) {
    if (now > data.expiresAt) {
      burstKeys.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 [BURSTKEY] Cleaned up ${cleaned} expired BurstKeys`);
  }
  
  return cleaned;
}

module.exports = {
  generateBurstKey,
  issueBurstKey,
  verifyAndConsumeBurstKey,
  getBurstKeyById,
  isBurstKeyValid,
  getCapsuleBurstKeys,
  cleanupExpiredBurstKeys,
  BURST_KEY_DURATION
};

