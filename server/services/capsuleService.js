const { encryptIfEnabled, decryptIfEnabled } = require('../utils/crypto');
const { computeCanonicalHash } = require('../utils/hash');
const { getFirestore, COLLECTIONS } = require('../config/firebase');

/**
 * Capsule Service for EverGuard
 * Handles encrypted capsule storage and retrieval using Firestore
 */

let capsuleIdCounter = 1;

/**
 * Create a new encrypted capsule
 */
async function createCapsule(userId, capsuleData, publicKey) {
  try {
    console.log(`📦 [CAPSULE] Creating capsule for user: ${userId}`);
    
    const db = getFirestore();
    
    // Support both old format (with .content) and new format (flat structure)
    const contentToEncrypt = capsuleData.content || capsuleData;
    const capsuleType = capsuleData.type || capsuleData.capsuleType || 'medical';
    
    // Encrypt sensitive medical/legal data
    const encryptedContent = encryptIfEnabled(JSON.stringify(contentToEncrypt));
    const contentHash = computeCanonicalHash(encryptedContent);
    
    const capsuleId = `cap_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const capsule = {
      id: capsuleId,
      blockchainId: null, // Will be set after blockchain logging
      ownerId: userId,
      ownerPublicKey: publicKey || null,
      capsuleType: capsuleType,
      encryptedContent: encryptedContent,
      contentHash: contentHash,
      metadata: {
        title: capsuleData.title || `${capsuleType} Capsule`,
        description: capsuleData.description || '',
        tags: capsuleData.tags || []
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in Firestore
    await db.collection(COLLECTIONS.CAPSULES).doc(capsuleId).set(capsule);
    
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
    const db = getFirestore();
    const doc = await db.collection(COLLECTIONS.CAPSULES).doc(capsuleId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return doc.data();
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
    const capsule = await getCapsule(capsuleId);
    
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
 * Get ICE (In Case of Emergency) data only - for non-verified users
 * Returns ONLY emergency contact information, no medical data
 */
async function getIceData(capsuleId) {
  try {
    console.log(`🚨 [ICE] Retrieving ICE data for capsule: ${capsuleId}`);
    
    const capsule = await getCapsule(capsuleId);
    
    if (!capsule) {
      throw new Error('Capsule not found');
    }
    
    // Decrypt content
    const decryptedContent = decryptIfEnabled(capsule.encryptedContent);
    const content = JSON.parse(decryptedContent);
    
    // Extract ONLY emergency contact information
    const iceData = {
      capsuleId: capsule.id,
      capsuleType: capsule.capsuleType,
      ownerName: content.ownerName || 'Patient',
      emergencyContact: content.emergencyContact || null,
      // DO NOT include: bloodType, allergies, medications, conditions, etc.
    };
    
    console.log(`✅ [ICE] ICE data extracted (emergency contact only)`);
    
    return iceData;
  } catch (error) {
    console.error('❌ [ICE] Error getting ICE data:', error);
    throw error;
  }
}

/**
 * List all capsules for a user
 */
async function listUserCapsules(userId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.CAPSULES)
      .where('ownerId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    const userCapsules = [];
    snapshot.forEach(doc => {
      const capsule = doc.data();
      userCapsules.push({
        id: capsule.id,
        ownerId: capsule.ownerId,
        capsuleType: capsule.capsuleType,
        contentHash: capsule.contentHash,
        metadata: capsule.metadata,
        status: capsule.status,
        createdAt: capsule.createdAt
      });
    });
    
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
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTIONS.CAPSULES).get();
    
    const allCapsules = [];
    snapshot.forEach(doc => {
      const capsule = doc.data();
      allCapsules.push({
        id: capsule.id,
        ownerId: capsule.ownerId,
        capsuleType: capsule.capsuleType,
        metadata: capsule.metadata,
        status: capsule.status,
        createdAt: capsule.createdAt
      });
    });
    
    return allCapsules;
  } catch (error) {
    console.error('❌ [CAPSULE] Error getting all capsules:', error);
    throw error;
  }
}

/**
 * Update capsule with blockchain ID
 */
async function updateCapsuleBlockchainId(capsuleId, blockchainId, txHash = null) {
  try {
    const db = getFirestore();
    const capsuleRef = db.collection(COLLECTIONS.CAPSULES).doc(capsuleId);
    const doc = await capsuleRef.get();
    
    if (!doc.exists) {
      throw new Error('Capsule not found');
    }
    
    const updateData = {
      blockchainId: blockchainId,
      updatedAt: new Date().toISOString()
    };
    
    if (txHash) {
      updateData.blockchainTxHash = txHash;
    }
    
    await capsuleRef.update(updateData);
    
    console.log(`🔗 [CAPSULE] Updated blockchain ID for ${capsuleId}: ${blockchainId}${txHash ? ` (tx: ${txHash})` : ''}`);
    
    // Return updated capsule
    const updated = await capsuleRef.get();
    return updated.data();
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
    const db = getFirestore();
    const capsuleRef = db.collection(COLLECTIONS.CAPSULES).doc(capsuleId);
    const doc = await capsuleRef.get();
    
    if (!doc.exists) {
      throw new Error('Capsule not found');
    }
    
    const capsule = doc.data();
    
    if (capsule.ownerId !== userId) {
      throw new Error('Not authorized to revoke this capsule');
    }
    
    await capsuleRef.update({
      status: 'revoked',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`🚫 [CAPSULE] Revoked capsule: ${capsuleId}`);
    
    // Return updated capsule
    const updated = await capsuleRef.get();
    return updated.data();
  } catch (error) {
    console.error('❌ [CAPSULE] Error revoking capsule:', error);
    throw error;
  }
}

module.exports = {
  createCapsule,
  getCapsule,
  getDecryptedCapsuleContent,
  getIceData,
  listUserCapsules,
  getAllCapsules,
  updateCapsuleBlockchainId,
  revokeCapsule
};

