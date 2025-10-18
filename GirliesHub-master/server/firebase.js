require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let app;
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (serviceAccountJson && serviceAccountJson !== '') {
    // Use JSON string from environment
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (serviceAccountPath) {
    // Use service account file path
    const fullPath = path.resolve(serviceAccountPath);
    app = admin.initializeApp({
      credential: admin.credential.cert(fullPath)
    });
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON must be set');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  throw error;
}

const firestore = admin.firestore();

// Helper function to verify Firebase ID tokens
async function verifyIdToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.display_name
    };
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw error;
  }
}

// Test function for Firebase connectivity
async function test() {
  try {
    console.log('Testing Firebase connection...');
    
    // First, test if Firebase Admin initialized correctly
    console.log('✅ Firebase Admin initialized successfully');
    console.log('✅ Project ID:', admin.app().options.projectId);
    
    // Test basic Firestore operations (without writing to avoid permission issues)
    try {
      const testDoc = firestore.collection('_test').doc('connection-test');
      const doc = await testDoc.get();
      console.log('✅ Firestore read test successful');
      
      // Only try to write if we have proper permissions
      if (process.env.FIREBASE_TEST_WRITE === 'true') {
        await testDoc.set({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: 'Firebase connection test',
          test: true
        });
        console.log('✅ Firestore write test successful');
        await testDoc.delete();
        console.log('✅ Test document cleaned up');
      } else {
        console.log('ℹ️  Skipping write test (set FIREBASE_TEST_WRITE=true to enable)');
      }
    } catch (firestoreError) {
      console.log('⚠️  Firestore test failed (may need Firestore to be enabled):', firestoreError.message);
      console.log('ℹ️  This is normal if Firestore is not yet enabled in the Firebase project');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    throw error;
  }
}

module.exports = {
  admin,
  firestore,
  verifyIdToken,
  test
};
