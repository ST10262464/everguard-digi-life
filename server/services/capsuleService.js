const { encryptIfEnabled, decryptIfEnabled } = require('../utils/crypto');
const { computeCanonicalHash } = require('../utils/hash');

/**
 * Capsule Service for EverGuard
 * Handles encrypted capsule storage and retrieval (in-memory for demo)
 */

// In-memory storage (replace with Firebase in production)
const capsules = new Map();
let capsuleIdCounter = 1;

/**
 * Create a new encrypted capsule
 */
async function createCapsule(userId, capsuleData, publicKey) {
  try {
    console.log(`📦 [CAPSULE] Creating capsule for user: ${userId}`);
    
    // Encrypt sensitive medical/legal data
    const encryptedContent = encryptIfEnabled(JSON.stringify(capsuleData.content));
    const contentHash = computeCanonicalHash(encryptedContent);
    
    const capsuleId = `cap_${capsuleIdCounter++}`;
    
    const capsule = {
      id: capsuleId,
      blockchainId: null, // Will be set after blockchain logging
      ownerId: userId,
      ownerPublicKey: publicKey || null,
      capsuleType: capsuleData.type, // "medical", "legal", "financial"
      encryptedContent: encryptedContent,
      contentHash: contentHash,
      metadata: {
        title: capsuleData.title || `${capsuleData.type} Capsule`,
        description: capsuleData.description || '',
        tags: capsuleData.tags || []
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in memory
    capsules.set(capsuleId, capsule);
    
    console.log(`✅ [CAPSULE] Created capsule: ${capsuleId}`);
    console.log(`🔐 [CAPSULE] Content hash: ${contentHash.substring(0, 20)}...`);
    
    // Return capsule without encrypted content
    return {
      id: capsule.id,
      ownerId: capsule.ownerId,
      capsuleType: capsule.capsuleType,
      contentHash: capsule.contentHash,
      metadata: capsule.metadata,
      status: capsule.status,
      createdAt: capsule.createdAt
    };
  } catch (error) {
    console.error('❌ [CAPSULE] Error creating capsule:', error);
    throw error;
  }
}

/**
 * Get capsule by ID
 */
async function getCapsule(capsuleId) {
  try {
    const capsule = capsules.get(capsuleId);
    
    if (!capsule) {
      return null;
    }
    
    return capsule;
  } catch (error) {
    console.error('❌ [CAPSULE] Error getting capsule:', error);
    throw error;
  }
}

/**
 * Get decrypted capsule content
 */
async function getDecryptedCapsuleContent(capsuleId) {
  try {
    const capsule = capsules.get(capsuleId);
    
    if (!capsule) {
      throw new Error('Capsule not found');
    }
    
    // Decrypt content
    const decryptedContent = decryptIfEnabled(capsule.encryptedContent);
    
    return {
      ...capsule,
      content: JSON.parse(decryptedContent),
      encryptedContent: undefined // Don't return encrypted version
    };
  } catch (error) {
    console.error('❌ [CAPSULE] Error decrypting capsule:', error);
    throw error;
  }
}

/**
 * List all capsules for a user
 */
async function listUserCapsules(userId) {
  try {
    const userCapsules = [];
    
    for (const [id, capsule] of capsules.entries()) {
      if (capsule.ownerId === userId && capsule.status === 'active') {
        userCapsules.push({
          id: capsule.id,
          ownerId: capsule.ownerId,
          capsuleType: capsule.capsuleType,
          contentHash: capsule.contentHash,
          metadata: capsule.metadata,
          status: capsule.status,
          createdAt: capsule.createdAt
        });
      }
    }
    
    console.log(`📋 [CAPSULE] Found ${userCapsules.length} capsules for user: ${userId}`);
    return userCapsules;
  } catch (error) {
    console.error('❌ [CAPSULE] Error listing capsules:', error);
    throw error;
  }
}

/**
 * Get all capsules (for demo purposes)
 */
async function getAllCapsules() {
  const allCapsules = [];
  
  for (const [id, capsule] of capsules.entries()) {
    allCapsules.push({
      id: capsule.id,
      ownerId: capsule.ownerId,
      capsuleType: capsule.capsuleType,
      metadata: capsule.metadata,
      status: capsule.status,
      createdAt: capsule.createdAt
    });
  }
  
  return allCapsules;
}

/**
 * Update capsule with blockchain ID
 */
async function updateCapsuleBlockchainId(capsuleId, blockchainId) {
  try {
    const capsule = capsules.get(capsuleId);
    
    if (!capsule) {
      throw new Error('Capsule not found');
    }
    
    capsule.blockchainId = blockchainId;
    capsule.updatedAt = new Date().toISOString();
    
    console.log(`🔗 [CAPSULE] Updated blockchain ID for ${capsuleId}: ${blockchainId}`);
    return capsule;
  } catch (error) {
    console.error('❌ [CAPSULE] Error updating blockchain ID:', error);
    throw error;
  }
}

/**
 * Revoke a capsule
 */
async function revokeCapsule(capsuleId, userId) {
  try {
    const capsule = capsules.get(capsuleId);
    
    if (!capsule) {
      throw new Error('Capsule not found');
    }
    
    if (capsule.ownerId !== userId) {
      throw new Error('Not authorized to revoke this capsule');
    }
    
    capsule.status = 'revoked';
    capsule.updatedAt = new Date().toISOString();
    
    console.log(`🚫 [CAPSULE] Revoked capsule: ${capsuleId}`);
    return capsule;
  } catch (error) {
    console.error('❌ [CAPSULE] Error revoking capsule:', error);
    throw error;
  }
}

module.exports = {
  createCapsule,
  getCapsule,
  getDecryptedCapsuleContent,
  listUserCapsules,
  getAllCapsules,
  updateCapsuleBlockchainId,
  revokeCapsule
};

