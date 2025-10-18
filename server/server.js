require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getConnectionStatus, storeCapsuleOnBlockchain, issueBurstKeyOnChain, consumeBurstKeyOnChain } = require('./blockchain');
const { createCapsule, getCapsule, getDecryptedCapsuleContent, listUserCapsules, getAllCapsules } = require('./services/capsuleService');
const { issueBurstKey, verifyAndConsumeBurstKey, getCapsuleBurstKeys } = require('./utils/burstKey');
const { computeCanonicalHash } = require('./utils/hash');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Create a new capsule
app.post('/api/capsules', async (req, res) => {
  try {
    const { userId, capsuleData, publicKey } = req.body;
    
    if (!userId || !capsuleData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, capsuleData'
      });
    }
    
    // Create capsule
    const capsule = await createCapsule(userId, capsuleData, publicKey);
    
    // Store hash on BlockDAG
    let blockchainResult = null;
    try {
      blockchainResult = await storeCapsuleOnBlockchain(
        capsule.contentHash,
        capsule.capsuleType
      );
      console.log('✅ [API] Capsule logged on BlockDAG:', blockchainResult.txHash);
    } catch (blockchainError) {
      console.error('⚠️  [API] Failed to log on BlockDAG:', blockchainError.message);
      // Continue even if blockchain logging fails
    }
    
    res.json({
      success: true,
      capsule: capsule,
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error('❌ [API] Error creating capsule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get capsule by ID
app.get('/api/capsules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const capsule = await getCapsule(id);
    
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // Return capsule without encrypted content
    res.json({
      success: true,
      capsule: {
        id: capsule.id,
        ownerId: capsule.ownerId,
        capsuleType: capsule.capsuleType,
        contentHash: capsule.contentHash,
        metadata: capsule.metadata,
        status: capsule.status,
        createdAt: capsule.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all capsules (for demo)
app.get('/api/capsules', async (req, res) => {
  try {
    const { userId } = req.query;
    
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
    
    // TODO: Verify medic credentials (for now, accept all requests)
    console.log(`👨‍⚕️ [API] Medic verification: ${medicId} - APPROVED (demo mode)`);
    
    // Issue BurstKey
    const burstKeyResult = await issueBurstKey(
      capsuleId,
      medicId,
      medicPubKey,
      context
    );
    
    // Log on BlockDAG
    let blockchainResult = null;
    try {
      const contextHash = computeCanonicalHash(JSON.stringify(context || {}));
      blockchainResult = await issueBurstKeyOnChain(
        capsule.id,
        medicPubKey || medicId,
        burstKeyResult.expiresAt,
        contextHash
      );
      console.log('✅ [API] BurstKey logged on BlockDAG');
    } catch (blockchainError) {
      console.error('⚠️  [API] Failed to log BurstKey on BlockDAG:', blockchainError.message);
    }
    
    res.json({
      success: true,
      burstKey: burstKeyResult.burstKey,
      burstId: burstKeyResult.burstId,
      expiresAt: burstKeyResult.expiresAt,
      expiresIn: burstKeyResult.expiresIn,
      blockchain: blockchainResult
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
    
    // Log consumption on BlockDAG
    try {
      await consumeBurstKeyOnChain(verifyResult.burstId);
      console.log('✅ [API] BurstKey consumption logged on BlockDAG');
    } catch (blockchainError) {
      console.error('⚠️  [API] Failed to log consumption on BlockDAG:', blockchainError.message);
    }
    
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
    
    // Get BurstKeys from memory
    const burstKeys = await getCapsuleBurstKeys(id);
    
    res.json({
      success: true,
      capsuleId: id,
      accessCount: burstKeys.length,
      accessLog: burstKeys
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
  console.log('  GET  /api/capsules/:id/audit            - Get access log');
  console.log('');
  console.log('  🚨 Emergency Access (PulseKey):');
  console.log('  POST /api/emergency/request-access      - Request BurstKey');
  console.log('  POST /api/emergency/access-capsule      - Use BurstKey');
  console.log('');
  console.log('✅ Server ready!');
  console.log('🚀 ========================================');
  console.log('');
});

module.exports = app;

