const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getFirestore, COLLECTIONS } = require('../config/firebase');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, licenseNumber } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, name, role'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Validate role
    if (!['patient', 'medic'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "patient" or "medic"'
      });
    }

    // If medic, require license number
    if (role === 'medic' && !licenseNumber) {
      return res.status(400).json({
        success: false,
        error: 'License number required for medic registration'
      });
    }

    const db = getFirestore();

    // Check if email already exists
    const existingUserQuery = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create user document
    const userData = {
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection(COLLECTIONS.USERS).doc(userId).set(userData);

    // If medic, add to medic registry (but not verified by default)
    if (role === 'medic') {
      const medicData = {
        id: userId,
        name,
        licenseNumber,
        verified: false, // New medics need to be verified by admin
        publicKey: `0x${crypto.randomBytes(20).toString('hex')}`, // Generate a demo public key
        createdAt: new Date().toISOString()
      };
      await db.collection(COLLECTIONS.MEDIC_REGISTRY).doc(userId).set(medicData);
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    await db.collection('sessions').doc(token).set({
      userId,
      createdAt: new Date().toISOString(),
      expiresAt
    });

    console.log(`✅ [AUTH] User registered: ${email} (${userId}) - Role: ${role}`);

    // Return user data (without password) and token
    const { password: _, ...userDataWithoutPassword } = userData;
    res.status(201).json({
      success: true,
      user: {
        id: userId,
        ...userDataWithoutPassword
      },
      token,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('❌ [AUTH] Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed: ' + error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password'
      });
    }

    const db = getFirestore();

    // Find user by email
    const userQuery = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    await db.collection('sessions').doc(token).set({
      userId,
      createdAt: new Date().toISOString(),
      expiresAt
    });

    console.log(`✅ [AUTH] User logged in: ${email} (${userId})`);

    // Return user data (without password) and token
    const { password: _, ...userDataWithoutPassword } = userData;
    res.json({
      success: true,
      user: {
        id: userId,
        ...userDataWithoutPassword
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ [AUTH] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed: ' + error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (destroy session)
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided'
      });
    }

    const db = getFirestore();
    await db.collection('sessions').doc(token).delete();

    console.log(`✅ [AUTH] User logged out`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ [AUTH] Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed: ' + error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user data
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const db = getFirestore();
    const sessionDoc = await db.collection('sessions').doc(token).get();

    if (!sessionDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const sessionData = sessionDoc.data();
    const expiresAt = sessionData.expiresAt.toDate();

    if (expiresAt < new Date()) {
      await db.collection('sessions').doc(token).delete();
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(sessionData.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    const { password: _, ...userDataWithoutPassword } = userData;

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        ...userDataWithoutPassword
      }
    });
  } catch (error) {
    console.error('❌ [AUTH] Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data: ' + error.message
    });
  }
});

module.exports = router;

