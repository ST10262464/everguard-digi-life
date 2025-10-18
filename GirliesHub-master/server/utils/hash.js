const { ethers } = require('ethers');

/**
 * Canonical hashing utility for blockchain integration
 * Creates deterministic hashes from request objects for blockchain storage
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
 * Compute canonical hash for a request object
 * @param {Object} requestObj - Request object to hash
 * @returns {string} - Keccak256 hash (0x-prefixed hex string)
 */
function computeCanonicalHash(requestObj) {
  try {
    // Create a clean object with only the fields we want to hash
    const hashableFields = {
      requestType: requestObj.requestType,
      description: requestObj.description,
      location: requestObj.location,
      name: requestObj.name,
      date: requestObj.date,
      submittedBy: requestObj.submittedBy,
      userEmail: requestObj.userEmail,
      anonymous: requestObj.anonymous
    };
    
    // Remove undefined values
    Object.keys(hashableFields).forEach(key => {
      if (hashableFields[key] === undefined) {
        delete hashableFields[key];
      }
    });
    
    // Canonicalize the object
    const canonicalString = canonicalizeObject(hashableFields);
    
    // Compute Keccak256 hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(canonicalString));
    
    console.log(`🔐 Computed canonical hash for request: ${hash}`);
    console.log(`📝 Canonical string: ${canonicalString}`);
    
    return hash;
  } catch (error) {
    console.error('❌ Error computing canonical hash:', error);
    throw error;
  }
}

/**
 * Verify hash matches request object
 * @param {Object} requestObj - Request object
 * @param {string} expectedHash - Expected hash to verify against
 * @returns {boolean} - True if hash matches
 */
function verifyCanonicalHash(requestObj, expectedHash) {
  try {
    const computedHash = computeCanonicalHash(requestObj);
    const matches = computedHash.toLowerCase() === expectedHash.toLowerCase();
    
    console.log(`🔍 Hash verification: ${matches ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`   Expected: ${expectedHash}`);
    console.log(`   Computed: ${computedHash}`);
    
    return matches;
  } catch (error) {
    console.error('❌ Error verifying canonical hash:', error);
    return false;
  }
}

/**
 * Create a minimal hash for blockchain storage
 * @param {Object} requestObj - Request object
 * @returns {Object} - Minimal object with hash and essential fields
 */
function createMinimalHashObject(requestObj) {
  const hash = computeCanonicalHash(requestObj);
  
  return {
    requestHash: hash,
    requestType: requestObj.requestType,
    location: requestObj.location,
    timestamp: requestObj.timestamp || new Date().toISOString(),
    submittedBy: requestObj.submittedBy || null,
    anonymous: requestObj.anonymous || false
  };
}

module.exports = {
  canonicalizeObject,
  computeCanonicalHash,
  verifyCanonicalHash,
  createMinimalHashObject
};

