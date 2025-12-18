const admin = require('firebase-admin');
const path = require('path');

/**
 * Firebase Admin SDK Initialization for EverGuard
 * Provides Firestore database for persistent capsule and burst key storage
 */

let firebaseApp = null;
let db = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  if (firebaseApp) {
    console.log('✅ [FIREBASE] Already initialized');
    return { app: firebaseApp, db };
  }

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT; // For Render/Vercel
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID not configured in .env');
    }

    let serviceAccount;

    // Option 1: Use environment variable (for Render/Vercel)
    if (serviceAccountJson) {
      console.log('🔍 [FIREBASE] Loading service account from environment variable');
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (parseError) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${parseError.message}`);
      }
    }
    // Option 2: Use file path (for local/Railway)
    else if (serviceAccountPath) {
      // Handle different path formats: ./secrets/... or ./server/secrets/...
      let cleanPath = serviceAccountPath.replace(/^\.\//, ''); // Remove leading ./
      
      // If path contains "server/secrets", remove the "server/" part since we're already in server dir
      cleanPath = cleanPath.replace(/^server\//, '');
      
      // Build absolute path from server directory
      const fullPath = path.join(__dirname, '..', cleanPath);
      console.log(`🔍 [FIREBASE] Loading service account from: ${fullPath}`);
      
      serviceAccount = require(fullPath);
    } else {
      throw new Error('Either FIREBASE_SERVICE_ACCOUNT (JSON string) or FIREBASE_SERVICE_ACCOUNT_PATH (file path) must be configured');
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId
    });

    // Get Firestore instance
    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      timestampsInSnapshots: true,
      ignoreUndefinedProperties: true
    });

    console.log('✅ [FIREBASE] Initialized successfully');
    console.log(`🔥 [FIREBASE] Project: ${projectId}`);
    
    return { app: firebaseApp, db };
  } catch (error) {
    console.error('❌ [FIREBASE] Initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
function getFirestore() {
  if (!db) {
    const result = initializeFirebase();
    return result.db;
  }
  return db;
}

/**
 * Get Firebase Admin app instance
 */
function getFirebaseApp() {
  if (!firebaseApp) {
    const result = initializeFirebase();
    return result.app;
  }
  return firebaseApp;
}

/**
 * Collection names (constants for consistency)
 */
const COLLECTIONS = {
  USERS: 'users',
  CAPSULES: 'capsules',
  BURST_KEYS: 'burstKeys',
  MEDIC_REGISTRY: 'medicRegistry',
  AUDIT_LOG: 'auditLog'
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getFirebaseApp,
  COLLECTIONS
};

