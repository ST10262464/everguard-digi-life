require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const QRCode = require('qrcode');
const { initializeFirebase, getFirestore, COLLECTIONS } = require('./config/firebase');
const { getConnectionStatus, storeCapsuleOnBlockchain, issueBurstKeyOnChain, consumeBurstKeyOnChain } = require('./blockchain');
const { createCapsule, getCapsule, getDecryptedCapsuleContent, getIceData, listUserCapsules, getAllCapsules, updateCapsuleBlockchainId } = require('./services/capsuleService');
const { issueBurstKey, verifyAndConsumeBurstKey, getCapsuleBurstKeys, updateBurstKeyBlockchainId, checkActiveBurstKey } = require('./utils/burstKey');
const { computeCanonicalHash } = require('./utils/hash');
const { addPendingTransaction, updateTransactionStatus, getCapsuleTransactions, getQueueStats } = require('./utils/transactionQueue');
const { logRestrictedAccessAttempt, logActiveKeyBlocked, logBurstKeyIssued, logBurstKeyConsumed, getCapsuleAuditLog } = require('./utils/auditLog');
const { getChatResponse } = require('./services/aiService');

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error('❌ [STARTUP] Failed to initialize Firebase:', error.message);
  console.error('⚠️  [STARTUP] Server will not start without Firebase connection');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:8080')
  .split(',')
  .map(origin => origin.trim());

console.log('🔓 [CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log(`🔍 [CORS] Request from origin: ${origin}`);
    if (!origin) return callback(null, true); // Allow non-browser requests
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ [CORS] Origin allowed: ${origin}`);
      return callback(null, true);
    }
    console.error(`❌ [CORS] Origin rejected: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes and middleware
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const axios = require('axios');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// EverGuard Guardian AI chat endpoint
app.post('/api/ai/chat/enhanced', async (req, res) => {
  try {
    console.log('🤖 [AI] Received chat request');
    
    const { message, sessionId } = req.body || {};
    
    if (!message) {
      console.log('❌ [AI] No message provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing field: message' 
      });
    }
    
    // Use sessionId from client, or generate one based on IP (for anonymous users)
    const chatSessionId = sessionId || req.ip || 'default';
    
    console.log('🤖 [AI] Processing message:', message.substring(0, 50) + '... (session:', chatSessionId.substring(0, 10) + '...)');
    
    // Get AI response from Gemini service with conversation context
    const aiResult = await getChatResponse(message, chatSessionId);
    
    console.log('✅ [AI] Response generated successfully');
    
    return res.json({ 
      success: true, 
      response: aiResult.response, 
      suggestions: aiResult.suggestions,
      sessionId: chatSessionId
    });
    
  } catch (error) {
    console.error('❌ [AI] Error in endpoint:', error.message);
    console.error('Stack:', error.stack);
    
    // Return helpful fallback
    return res.status(500).json({ 
      success: false, 
      error: 'AI service temporarily unavailable',
      fallback: {
        response: 'The Guardian AI is currently offline, but your data remains secure. Please try again in a moment, or explore the EverGuard features directly.',
        suggestions: ['View my capsules', 'Check emergency access', 'Review security features']
      }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'EverGuard API',
    version: '1.0.0'
  });
});

// Blockchain status endpoint
app.get('/api/blockchain/status', async (req, res) => {
  try {
    const status = await getConnectionStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============ Capsule Management Routes ============

// Create a new capsule (with optional auth)
app.post('/api/capsules', optionalAuth, async (req, res) => {
  try {
    let { userId, capsuleData, publicKey } = req.body;
    
    // If user is authenticated, use their ID (overrides body userId for security)
    if (req.user) {
      userId = req.user.id;
      console.log(`🔐 [API] Creating capsule for authenticated user: ${userId}`);
    }
    
    if (!userId || !capsuleData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, capsuleData'
      });
    }
    
    // Create capsule
    const capsule = await createCapsule(userId, capsuleData, publicKey);
    
    // Store hash on BlockDAG (non-blocking with queue)
    let blockchainStatus = { status: 'queued', message: 'Transaction queued for processing' };
    
    // Process blockchain transaction asynchronously
    setImmediate(async () => {
      try {
        const blockchainResult = await storeCapsuleOnBlockchain(
          capsule.contentHash,
          capsule.capsuleType
        );
        
        console.log('✅ [API] Capsule logged on BlockDAG:', blockchainResult.txHash);
        
        // Add to queue
        const queuedTx = addPendingTransaction('capsule', blockchainResult.txHash, {
          capsuleId: capsule.id,
          contentHash: capsule.contentHash
        });
        
        // Update capsule with blockchain ID
        if (blockchainResult && blockchainResult.capsuleId !== null) {
          await updateCapsuleBlockchainId(capsule.id, blockchainResult.capsuleId);
          updateTransactionStatus(queuedTx.txId, 'confirmed', blockchainResult);
        }
      } catch (blockchainError) {
        console.error('⚠️  [API] Failed to log on BlockDAG:', blockchainError.message);
        // System continues to work without blockchain
      }
    });
    
    res.json({
      success: true,
      capsule: capsule,
      blockchain: blockchainStatus
    });
  } catch (error) {
    console.error('❌ [API] Error creating capsule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get capsule by ID (with optional auth for owner access)
app.get('/api/capsules/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const capsule = await getCapsule(id);
    
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // For capsule owners, return decrypted content
    // For others, return only metadata
    let capsuleData = {
      id: capsule.id,
      ownerId: capsule.ownerId,
      capsuleType: capsule.capsuleType,
      contentHash: capsule.contentHash,
      metadata: capsule.metadata,
      status: capsule.status,
      createdAt: capsule.createdAt
    };
    
    // Check if user is authenticated and owns this capsule
    if (req.user && req.user.id === capsule.ownerId) {
      console.log(`🔐 [API] Owner accessing capsule: ${id}`);
      // Owner can see decrypted content
      const decryptedCapsule = await getDecryptedCapsuleContent(id);
      capsuleData = {
        ...capsuleData,
        content: decryptedCapsule.content
      };
    } else {
      console.log(`🔒 [API] Non-owner accessing capsule: ${id}`);
    }
    
    res.json({
      success: true,
      capsule: capsuleData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate QR code for a capsule
app.get('/api/capsules/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify capsule exists
    const capsule = await getCapsule(id);
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // Generate QR code data
    const qrData = JSON.stringify({
      capsuleId: id,
      type: 'emergency_access',
      platform: 'EverGuard'
    });
    
    // Generate QR code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      capsuleId: id,
      capsuleType: capsule.capsuleType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all capsules (for demo) or user-specific (with optional auth)
app.get('/api/capsules', optionalAuth, async (req, res) => {
  try {
    let { userId } = req.query;
    
    // If user is authenticated, return only their capsules
    if (req.user) {
      userId = req.user.id;
      console.log(`🔐 [API] Fetching capsules for authenticated user: ${userId}`);
    }
    
    let capsules;
    if (userId) {
      capsules = await listUserCapsules(userId);
    } else {
      capsules = await getAllCapsules();
    }
    
    res.json({
      success: true,
      count: capsules.length,
      capsules: capsules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============ Emergency Access Routes (PulseKey) ============

// Request emergency access (issue BurstKey)
app.post('/api/emergency/request-access', async (req, res) => {
  try {
    const { capsuleId, medicId, medicPubKey, context } = req.body;
    
    if (!capsuleId || !medicId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: capsuleId, medicId'
      });
    }
    
    // Verify capsule exists
    const capsule = await getCapsule(capsuleId);
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // Verify medic credentials against Firestore registry
    const db = getFirestore();
    const medicDoc = await db.collection(COLLECTIONS.MEDIC_REGISTRY).doc(medicId).get();
    
    if (!medicDoc.exists) {
      console.log(`🚨 [API] Non-verified user: ${medicId} - Returning ICE view`);
      
      // Log restricted access attempt
      await logRestrictedAccessAttempt(
        capsuleId,
        medicId,
        'Not in medic registry',
        context
      );
      
      // PHASE 2: Return ICE data instead of denying access
      try {
        const iceData = await getIceData(capsuleId);
        
        return res.status(200).json({
          success: true,
          accessLevel: 'ice', // Indicates restricted access
          message: 'Limited access granted - Emergency contact information only',
          iceData: iceData,
          fullAccessRequires: 'Verified medical professional credentials'
        });
      } catch (iceError) {
        console.error(`❌ [API] Error retrieving ICE data:`, iceError);
        return res.status(500).json({
          success: false,
          error: 'Unable to retrieve emergency contact information'
        });
      }
    }
    
    const medicData = medicDoc.data();
    if (!medicData.verified) {
      console.log(`🚨 [API] Unverified medic: ${medicId} - Returning ICE view`);
      
      // Log restricted access attempt
      await logRestrictedAccessAttempt(
        capsuleId,
        medicId,
        'Medical credentials not verified',
        context
      );
      
      // PHASE 2: Return ICE data for unverified medics too
      try {
        const iceData = await getIceData(capsuleId);
        
        return res.status(200).json({
          success: true,
          accessLevel: 'ice', // Indicates restricted access
          message: 'Limited access granted - Emergency contact information only',
          iceData: iceData,
          fullAccessRequires: 'Verified medical professional credentials',
          note: 'Your medical credentials are pending verification'
        });
      } catch (iceError) {
        console.error(`❌ [API] Error retrieving ICE data:`, iceError);
        return res.status(500).json({
          success: false,
          error: 'Unable to retrieve emergency contact information'
        });
      }
    }
    
    console.log(`✅ [API] Medic verification: ${medicId} (${medicData.name}) - APPROVED`);
    console.log(`   License: ${medicData.licenseNumber}`);
    
    // PHASE 1: Check for active BurstKey (strict blocking)
    const existingActiveKey = await checkActiveBurstKey(medicId, capsuleId);
    if (existingActiveKey) {
      console.log(`⛔ [API] Active BurstKey exists: ${existingActiveKey.burstId}`);
      console.log(`   Expires at: ${new Date(existingActiveKey.expiresAt).toISOString()}`);
      
      // Log blocked attempt
      await logActiveKeyBlocked(
        capsuleId,
        medicId,
        existingActiveKey.burstId,
        context
      );
      
      return res.status(409).json({
        success: false,
        error: 'Active BurstKey already exists',
        existingKey: {
          burstId: existingActiveKey.burstId,
          expiresAt: new Date(existingActiveKey.expiresAt).toISOString(),
          expiresIn: Math.floor((existingActiveKey.expiresAt - Date.now()) / 1000)
        }
      });
    }
    
    // Issue BurstKey
    const burstKeyResult = await issueBurstKey(
      capsuleId,
      medicId,
      medicPubKey,
      context
    );
    
    // Log BurstKey issuance to audit log
    await logBurstKeyIssued(
      capsuleId,
      burstKeyResult.burstId,
      medicId,
      burstKeyResult.expiresAt,
      null // txHash will be added when blockchain confirms
    );
    
    // Log on BlockDAG (non-blocking)
    let blockchainStatus = { status: 'pending', message: 'BurstKey issuance will be logged on blockchain' };
    
    // Process blockchain transaction asynchronously
    setImmediate(async () => {
      try {
        // Check if capsule has blockchain ID
        if (capsule.blockchainId === null || capsule.blockchainId === undefined) {
          console.warn('⚠️  [API] Capsule has no blockchain ID - skipping BurstKey blockchain logging');
          return;
        }
        
        const contextHash = computeCanonicalHash(JSON.stringify(context || {}));
        const blockchainResult = await issueBurstKeyOnChain(
          capsule.blockchainId,
          medicPubKey || medicId,
          burstKeyResult.expiresAt,
          contextHash
        );
        
        if (blockchainResult.success) {
          console.log('✅ [API] BurstKey logged on BlockDAG');
          
          // Add to queue
          const queuedTx = addPendingTransaction('burstkey', blockchainResult.txHash, {
            capsuleId: capsule.id,
            burstId: burstKeyResult.burstId
          });
          
          // Update BurstKey with blockchain ID
          if (blockchainResult.burstKeyId) {
            await updateBurstKeyBlockchainId(burstKeyResult.burstKey, blockchainResult.burstKeyId);
            updateTransactionStatus(queuedTx.txId, 'confirmed', blockchainResult);
          }
        }
      } catch (blockchainError) {
        console.error('⚠️  [API] Failed to log BurstKey on BlockDAG:', blockchainError.message);
        // System continues to work without blockchain
      }
    });
    
    res.json({
      success: true,
      burstKey: burstKeyResult.burstKey,
      burstId: burstKeyResult.burstId,
      expiresAt: burstKeyResult.expiresAt,
      expiresIn: burstKeyResult.expiresIn,
      blockchain: blockchainStatus
    });
  } catch (error) {
    console.error('❌ [API] Error requesting access:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Use BurstKey to access capsule
app.post('/api/emergency/access-capsule', async (req, res) => {
  try {
    const { burstKey, medicId } = req.body;
    
    if (!burstKey || !medicId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: burstKey, medicId'
      });
    }
    
    // Verify and consume BurstKey
    const verifyResult = await verifyAndConsumeBurstKey(burstKey, medicId);
    
    if (!verifyResult.valid) {
      return res.status(403).json({
        success: false,
        error: verifyResult.error
      });
    }
    
    // Get decrypted capsule content
    const capsule = await getDecryptedCapsuleContent(verifyResult.capsuleId);
    
    // Log BurstKey consumption to audit log
    await logBurstKeyConsumed(
      verifyResult.capsuleId,
      burstKey,
      medicId,
      null // txHash will be added when blockchain confirms
    );
    
    // Log consumption on BlockDAG (non-blocking)
    setImmediate(async () => {
      try {
        // Only log if we have a blockchain BurstKey ID
        if (verifyResult.blockchainBurstKeyId !== null && verifyResult.blockchainBurstKeyId !== undefined) {
          const consumptionResult = await consumeBurstKeyOnChain(verifyResult.blockchainBurstKeyId);
          
          if (consumptionResult.success) {
            console.log('✅ [API] BurstKey consumption logged on BlockDAG');
            
            // Add to queue
            addPendingTransaction('consumption', consumptionResult.txHash, {
              capsuleId: verifyResult.capsuleId,
              burstId: verifyResult.burstId
            });
          }
        } else {
          console.warn('⚠️  [API] No blockchain BurstKey ID - skipping consumption logging');
        }
      } catch (blockchainError) {
        console.error('⚠️  [API] Failed to log consumption on BlockDAG:', blockchainError.message);
        // System continues to work without blockchain
      }
    });
    
    res.json({
      success: true,
      capsuleId: capsule.id,
      capsuleType: capsule.capsuleType,
      content: capsule.content,
      burstId: verifyResult.burstId,
      metadata: capsule.metadata
    });
  } catch (error) {
    console.error('❌ [API] Error accessing capsule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get capsule blockchain transactions
app.get('/api/capsules/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify capsule exists
    const capsule = await getCapsule(id);
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    const transactions = getCapsuleTransactions(id);
    
    res.json({
      success: true,
      capsuleId: id,
      blockchainId: capsule.blockchainId,
      transactions: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get transaction queue status
app.get('/api/queue/status', async (req, res) => {
  try {
    const stats = getQueueStats();
    
    res.json({
      success: true,
      queue: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get capsule access log (audit trail)
app.get('/api/capsules/:id/audit', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify capsule exists
    const capsule = await getCapsule(id);
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // Get full audit log from Firestore (includes RESTRICTED_ACCESS_ATTEMPT, ACTIVE_KEY_BLOCKED, etc.)
    const auditLog = await getCapsuleAuditLog(id);
    
    // Also get BurstKeys for backward compatibility
    const burstKeys = await getCapsuleBurstKeys(id);
    
    res.json({
      success: true,
      capsuleId: id,
      accessCount: burstKeys.length,
      accessLog: auditLog.length > 0 ? auditLog : burstKeys, // Prefer full audit log if available
      burstKeys: burstKeys // Keep for backward compatibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test encryption endpoint
app.get('/api/test/encryption', (req, res) => {
  const crypto = require('./utils/crypto');
  
  try {
    const testData = 'Hello EverGuard!';
    
    if (!crypto.isEncryptionEnabled()) {
      return res.json({
        success: false,
        message: 'Encryption not enabled - set ENCRYPTION_KEY in .env'
      });
    }
    
    const encrypted = crypto.encrypt(testData);
    const decrypted = crypto.decrypt(encrypted);
    
    res.json({
      success: true,
      original: testData,
      encrypted: encrypted.substring(0, 50) + '...',
      decrypted: decrypted,
      match: testData === decrypted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🏥 EverGuard API Server');
  console.log('🚀 ========================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 BlockDAG RPC: ${process.env.BDAG_RPC_URL || 'https://rpc.primordial.bdagscan.com'}`);
  console.log(`📝 Contract: ${process.env.CONTRACT_ADDRESS || 'Not deployed yet'}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  GET  /health                            - Health check');
  console.log('  GET  /api/blockchain/status             - Blockchain status');
  console.log('  GET  /api/test/encryption               - Test encryption');
  console.log('');
  console.log('  📦 Capsule Management:');
  console.log('  POST /api/capsules                      - Create capsule');
  console.log('  GET  /api/capsules                      - List capsules');
  console.log('  GET  /api/capsules/:id                  - Get capsule');
  console.log('  GET  /api/capsules/:id/qrcode           - Generate QR code');
  console.log('  GET  /api/capsules/:id/audit            - Get access log');
  console.log('  GET  /api/capsules/:id/transactions     - Get blockchain TXs');
  console.log('');
  console.log('  🚨 Emergency Access (PulseKey):');
  console.log('  POST /api/emergency/request-access      - Request BurstKey');
  console.log('  POST /api/emergency/access-capsule      - Use BurstKey');
  console.log('');
  console.log('  📊 Transaction Queue:');
  console.log('  GET  /api/queue/status                  - Queue statistics');
  console.log('');
  console.log('✅ Server ready!');
  console.log('🚀 ========================================');
  console.log('');
});

module.exports = app;

