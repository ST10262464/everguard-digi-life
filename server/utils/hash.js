const { ethers } = require('ethers');

/**
 * Canonical hashing utility for blockchain integration
 * Creates deterministic hashes from capsule objects for blockchain storage
 */

/**
 * Canonicalize an object by sorting keys alphabetically
 * @param {Object} obj - Object to canonicalize
 * @returns {string} - Canonical JSON string
 */
function canonicalizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(canonicalizeObject));
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const canonicalObj = {};
  
  for (const key of sortedKeys) {
    const value = obj[key];
    
    // Skip undefined values
    if (value === undefined) {
      continue;
    }
    
    // Recursively canonicalize nested objects
    if (typeof value === 'object' && value !== null) {
      canonicalObj[key] = canonicalizeObject(value);
    } else {
      canonicalObj[key] = value;
    }
  }
  
  return JSON.stringify(canonicalObj);
}

/**
 * Compute canonical hash for encrypted content
 * @param {string|Object} content - Content to hash (can be encrypted string or object)
 * @returns {string} - Keccak256 hash (0x-prefixed hex string)
 */
function computeCanonicalHash(content) {
  try {
    // If it's an object, canonicalize it first
    let contentString = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Compute Keccak256 hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(contentString));
    
    console.log(`🔐 Computed canonical hash: ${hash.substring(0, 10)}...`);
    
    return hash;
  } catch (error) {
    console.error('❌ Error computing canonical hash:', error);
    throw error;
  }
}

/**
 * Verify hash matches content
 * @param {string|Object} content - Content to verify
 * @param {string} expectedHash - Expected hash to verify against
 * @returns {boolean} - True if hash matches
 */
function verifyCanonicalHash(content, expectedHash) {
  try {
    const computedHash = computeCanonicalHash(content);
    const matches = computedHash.toLowerCase() === expectedHash.toLowerCase();
    
    console.log(`🔍 Hash verification: ${matches ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    return matches;
  } catch (error) {
    console.error('❌ Error verifying canonical hash:', error);
    return false;
  }
}

module.exports = {
  canonicalizeObject,
  computeCanonicalHash,
  verifyCanonicalHash
};

