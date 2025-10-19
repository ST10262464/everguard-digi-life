const { getFirestore, COLLECTIONS } = require('../config/firebase');

/**
 * Authentication Middleware
 * Verifies user tokens and attaches user data to request
 */

async function authenticateToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token in Firestore sessions collection
    const db = getFirestore();
    const sessionDoc = await db.collection('sessions').doc(token).get();
    
    if (!sessionDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const sessionData = sessionDoc.data();
    
    // Check if session is expired (24 hour sessions)
    const expiresAt = sessionData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      await db.collection('sessions').doc(token).delete();
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.'
      });
    }

    // Get user data
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(sessionData.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request
    req.user = {
      id: userDoc.id,
      ...userDoc.data()
    };

    next();
  } catch (error) {
    console.error('❌ [AUTH] Token verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token, just sets req.user if valid
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const db = getFirestore();
    const sessionDoc = await db.collection('sessions').doc(token).get();
    
    if (!sessionDoc.exists) {
      req.user = null;
      return next();
    }

    const sessionData = sessionDoc.data();
    const expiresAt = sessionData.expiresAt.toDate();
    
    if (expiresAt < new Date()) {
      req.user = null;
      return next();
    }

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(sessionData.userId).get();
    
    if (userDoc.exists) {
      req.user = {
        id: userDoc.id,
        ...userDoc.data()
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('⚠️  [AUTH] Optional auth error:', error);
    req.user = null;
    next();
  }
}

/**
 * Verify token and return user data (synchronous version for inline use)
 */
function verifyToken(token) {
  // This is a simplified version - in production you'd want proper JWT verification
  // For now, we'll use the same logic as optionalAuth but return the user directly
  throw new Error('verifyToken not implemented - use optionalAuth middleware instead');
}

module.exports = {
  authenticateToken,
  optionalAuth,
  verifyToken
};

