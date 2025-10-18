const crypto = require('crypto');

/**
 * AES-256-GCM encryption utilities for sensitive data
 * Uses ENCRYPTION_KEY environment variable for encryption
 */

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 12 bytes
const TAG_LENGTH = 16; // GCM authentication tag length
const KEY_LENGTH = 32; // 256 bits = 32 bytes

/**
 * Get encryption key from environment
 * @returns {Buffer|null} - Encryption key or null if not configured
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    return null;
  }
  
  // Validate key length (should be 64 hex characters = 32 bytes)
  if (key.length !== 64) {
    console.warn('⚠️  ENCRYPTION_KEY should be 64 hex characters (32 bytes)');
    return null;
  }
  
  try {
    return Buffer.from(key, 'hex');
  } catch (error) {
    console.error('❌ Invalid ENCRYPTION_KEY format (should be hex):', error.message);
    return null;
  }
}

/**
 * Check if encryption is enabled
 * @returns {boolean} - True if encryption key is configured
 */
function isEncryptionEnabled() {
  return getEncryptionKey() !== null;
}

/**
 * Encrypt a value using AES-256-GCM
 * @param {string} value - Value to encrypt
 * @returns {string} - Encrypted value (base64 encoded)
 */
function encrypt(value) {
  const key = getEncryptionKey();
  
  if (!key) {
    throw new Error('Encryption key not configured');
  }
  
  if (typeof value !== 'string') {
    value = JSON.stringify(value);
  }
  
  try {
    // Generate random IV
    const iv = crypto.randomBytes(12); // GCM uses 12 bytes
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('everguard', 'utf8')); // Additional authenticated data
    
    // Encrypt
    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'base64')]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt a value using AES-256-GCM
 * @param {string} encryptedValue - Encrypted value (base64 encoded)
 * @returns {string} - Decrypted value
 */
function decrypt(encryptedValue) {
  const key = getEncryptionKey();
  
  if (!key) {
    throw new Error('Encryption key not configured');
  }
  
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedValue, 'base64');
    
    // Extract IV, tag, and encrypted data
    const iv = combined.subarray(0, 12); // GCM uses 12 bytes
    const tag = combined.subarray(12, 28); // 12 + 16 bytes
    const encrypted = combined.subarray(28);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('everguard', 'utf8'));
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw error;
  }
}

/**
 * Encrypt value if encryption is enabled, otherwise return plaintext
 * @param {string} value - Value to encrypt
 * @returns {string} - Encrypted or plaintext value
 */
function encryptIfEnabled(value) {
  const key = getEncryptionKey();
  
  if (!key) {
    console.warn('⚠️  Encryption disabled - ENCRYPTION_KEY not set. Returning plaintext.');
    return value;
  }
  
  try {
    return encrypt(value);
  } catch (error) {
    console.error('❌ Encryption failed, returning plaintext:', error.message);
    return value;
  }
}

/**
 * Decrypt value if it appears to be encrypted, otherwise return as-is
 * @param {string} value - Value to decrypt
 * @returns {string} - Decrypted or original value
 */
function decryptIfEnabled(value) {
  const key = getEncryptionKey();
  
  if (!key) {
    // No encryption key, return as-is
    return value;
  }
  
  // Check if value looks like encrypted data (base64 and minimum length)
  if (typeof value !== 'string' || value.length < 50) {
    return value;
  }
  
  try {
    // Try to decrypt
    return decrypt(value);
  } catch (error) {
    // If decryption fails, assume it's not encrypted
    console.log('ℹ️  Value appears to be plaintext (decryption failed)');
    return value;
  }
}

/**
 * Encrypt sensitive fields in an object
 * @param {Object} obj - Object containing sensitive data
 * @param {Array} sensitiveFields - Array of field names to encrypt
 * @returns {Object} - Object with encrypted sensitive fields
 */
function encryptSensitiveFields(obj, sensitiveFields = ['description', 'personalInfo', 'contactDetails']) {
  const encrypted = { ...obj };
  
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptIfEnabled(encrypted[field]);
    }
  }
  
  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 * @param {Object} obj - Object containing encrypted data
 * @param {Array} sensitiveFields - Array of field names to decrypt
 * @returns {Object} - Object with decrypted sensitive fields
 */
function decryptSensitiveFields(obj, sensitiveFields = ['description', 'personalInfo', 'contactDetails']) {
  const decrypted = { ...obj };
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decryptIfEnabled(decrypted[field]);
    }
  }
  
  return decrypted;
}

/**
 * Generate a secure encryption key
 * @returns {string} - 64-character hex string (32 bytes)
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('hex');
}

module.exports = {
  // Core encryption functions
  encrypt,
  decrypt,
  encryptIfEnabled,
  decryptIfEnabled,
  
  // Utility functions
  isEncryptionEnabled,
  getEncryptionKey,
  generateEncryptionKey,
  
  // Object encryption helpers
  encryptSensitiveFields,
  decryptSensitiveFields
};

