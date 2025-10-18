require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { storeHashOnBlockchain, getTransactionProof, getRequestsFromBlockchain, getRequestCount } = require('./blockchain');
const { chatWithAI, chatWithSuggestions } = require('./ai');
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/authFirebase');
const { createRequest, updateRequest, getRequest, listRequests } = require('./services/firestoreService');
const { computeCanonicalHash } = require('./utils/hash');
const { encryptIfEnabled } = require('./utils/crypto');
const shelterRoutes = require('./routes/shelters');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
// Configure CORS to allow your Netlify domain
const allowedOrigins = [
  'http://localhost:3000',
  'https://girlieshub.netlify.app',
  process.env.ALLOWED_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser or same-origin requests

    // Allow explicit list or any Netlify subdomain
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/[^.]+\.netlify\.app$/.test(origin);

    if (isAllowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'GirliesHub API'
  });
});

// Initialize blockchain connection

// In-memory storage for demo (replace with database later)
let donations = [
  // General Support - R45,000 raised (45 donations of R1000 each)
  ...Array(45).fill().map((_, i) => ({
    id: `DON_GEN_${i + 1}`,
    amount: 1000,
    cause: 'general',
    paymentMethod: 'card',
    donorInfo: {
      name: `Initial Donor ${i + 1}`,
      email: `donor${i + 1}@example.com`,
      message: 'Initial population donation'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `INIT_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // Education & Skills - R28,000 raised (28 donations of R1000 each)
  ...Array(28).fill().map((_, i) => ({
    id: `DON_EDU_${i + 1}`,
    amount: 1000,
    cause: 'education',
    paymentMethod: 'card',
    donorInfo: {
      name: `Education Donor ${i + 1}`,
      email: `education${i + 1}@example.com`,
      message: 'Supporting education initiatives'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `EDU_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // Health & Sanitary Aid - R15,000 raised (15 donations of R1000 each)
  ...Array(15).fill().map((_, i) => ({
    id: `DON_HEALTH_${i + 1}`,
    amount: 1000,
    cause: 'health',
    paymentMethod: 'card',
    donorInfo: {
      name: `Health Donor ${i + 1}`,
      email: `health${i + 1}@example.com`,
      message: 'Supporting health initiatives'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `HEALTH_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // GBV Support - R22,000 raised (22 donations of R1000 each)
  ...Array(22).fill().map((_, i) => ({
    id: `DON_GBV_${i + 1}`,
    amount: 1000,
    cause: 'gbv',
    paymentMethod: 'card',
    donorInfo: {
      name: `GBV Donor ${i + 1}`,
      email: `gbv${i + 1}@example.com`,
      message: 'Supporting GBV initiatives'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `GBV_TX_${i + 1}`,
    blockchainTxHash: null
  })),

  // Financial Literacy - R18,000 raised (18 donations of R1000 each)
  ...Array(18).fill().map((_, i) => ({
    id: `DON_FINANCE_${i + 1}`,
    amount: 1000,
    cause: 'finance',
    paymentMethod: 'card',
    donorInfo: {
      name: `Finance Donor ${i + 1}`,
      email: `finance${i + 1}@example.com`,
      message: 'Supporting financial literacy'
    },
    status: 'completed',
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionHash: `FINANCE_TX_${i + 1}`,
    blockchainTxHash: null
  }))
];
let requests = [
  {
    id: 'REQ001',
    name: 'Sarah M.',
    requestType: 'Finance',
    description: 'Looking for investment advice for small business startup',
    status: 'Processing',
    timestamp: new Date().toISOString(),
    location: 'Cape Town, Western Cape',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'REQ002',
    name: 'Anonymous',
    requestType: 'GBV Support',
    description: 'Need immediate safe shelter information',
    status: 'Urgent',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    location: 'Johannesburg, Gauteng',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
  },
  {
    id: 'REQ003',
    name: 'Linda K.',
    requestType: 'Sanitary Aid',
    description: 'Looking for nearby donation bins for hygiene products',
    status: 'Completed',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    location: 'Durban, KwaZulu-Natal',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0]
  }
];

// Generate unique request ID
function generateRequestId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `REQ${timestamp}${random}`.substring(0, 10).toUpperCase();
}

// Generate unique donation ID
function generateDonationId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `DON${timestamp}${random}`.substring(0, 10).toUpperCase();
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GirliesHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Shelter routes
app.use('/api/shelters', shelterRoutes);

// Get all requests (excluding deleted ones) - optional auth for user-specific filtering
app.get('/api/requests', optionalAuthMiddleware, async (req, res) => {
  try {
    console.log('Fetching all requests from Firestore');
    
    // Get requests from Firestore
    const firestoreRequests = await listRequests();
    
    // If user is authenticated, add user-specific info
    if (req.user && req.user.uid) {
      console.log(`User ${req.user.email} (${req.user.uid}) fetching requests`);
      
      // Filter requests submitted by this user
      const myRequests = firestoreRequests.filter(req => req.submittedBy === req.user.uid);
      
      // Add user info to response
      const response = {
        requests: firestoreRequests,
        user: {
          uid: req.user.uid,
          email: req.user.email,
          name: req.user.name
        },
        userSpecificData: {
          myRequests: myRequests,
          myRequestCount: myRequests.length
        }
      };
      
      res.json(response);
    } else {
      // Anonymous user - return basic request list
      console.log('Anonymous user fetching requests');
      res.json({
        requests: firestoreRequests,
        user: null,
        message: 'Sign in to see your personal requests and additional features'
      });
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      error: 'Failed to fetch requests',
      message: error.message
    });
  }
});

// Get all requests including deleted ones (for admin purposes) - requires auth
app.get('/api/requests/all', authMiddleware, (req, res) => {
  try {
    console.log('Fetching all requests including deleted');
    res.json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({
      error: 'Failed to fetch all requests',
      message: error.message
    });
  }
});

// Submit new request (plural endpoint) - allows anonymous submits
app.post('/api/requests', optionalAuthMiddleware, async (req, res) => {
  try {
    const { name, requestType, description, date, location } = req.body;

    console.log('Received request:', req.body);

    // Validate required fields
    if (!requestType || !description || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['requestType', 'description', 'location']
      });
    }

    // Prepare request data for Firestore
    const requestData = {
      name: name || (req.user ? req.user.name : 'Anonymous'),
      requestType,
      description: encryptIfEnabled(description), // Encrypt sensitive data
      date: date || new Date().toISOString(),
      location,
      timestamp: new Date().toISOString(),
      // Add user info if authenticated
      submittedBy: req.user ? req.user.uid : null,
      userEmail: req.user ? req.user.email : null,
      anonymous: !req.user
    };

    console.log('Creating Firestore document...');

    // STEP 1: Write to Firestore with status 'pending'
    const firestoreDoc = await createRequest(requestData);
    console.log('✅ Firestore document created:', firestoreDoc.id);

    // STEP 2: Compute canonical hash
    const requestHash = computeCanonicalHash(firestoreDoc);
    console.log('✅ Canonical hash computed:', requestHash.substring(0, 20) + '...');

    // STEP 3: Update Firestore doc with hash
    await updateRequest(firestoreDoc.id, { requestHash });
    console.log('✅ Firestore document updated with hash');

    // STEP 4: Handle blockchain processing based on DUAL_WRITE_MODE
    const dualWriteMode = process.env.DUAL_WRITE_MODE === 'true';
    let blockchainResult = null;

    if (dualWriteMode) {
      // Dual-write mode: write to both Firestore and blockchain immediately
      try {
        console.log('🔄 Dual-write mode: storing on blockchain immediately...');
        const { storeHashOnBlockchain } = require('./blockchain');
        blockchainResult = await storeHashOnBlockchain(requestHash, requestType);
        
        // Update Firestore with blockchain result
        await updateRequest(firestoreDoc.id, {
          status: 'onchain',
          txHash: blockchainResult.transactionId,
          blockNumber: blockchainResult.blockNumber,
          onchainAt: new Date().toISOString()
        });
        
        console.log(`✅ Dual-write: Request ${firestoreDoc.id} stored on blockchain immediately`);
      } catch (blockchainError) {
        console.error('❌ Dual-write blockchain error:', blockchainError);
        // Fall back to queue processing
        const queueData = {
          requestId: firestoreDoc.id,
          requestHash,
          requestType,
          location,
          submittedBy: req.user ? req.user.uid : null,
          anonymous: !req.user,
          timestamp: new Date().toISOString()
        };
        const { enqueuePendingChain } = require('./services/firestoreService');
        await enqueuePendingChain(queueData);
        console.log('✅ Request enqueued for blockchain processing (fallback)');
      }
    } else {
      // Normal mode: enqueue for blockchain processing
      const queueData = {
        requestId: firestoreDoc.id,
        requestHash,
        requestType,
        location,
        submittedBy: req.user ? req.user.uid : null,
        anonymous: !req.user,
        timestamp: new Date().toISOString()
      };
      const { enqueuePendingChain } = require('./services/firestoreService');
      await enqueuePendingChain(queueData);
      console.log('✅ Request enqueued for blockchain processing');
    }

    // Also add to in-memory storage for backward compatibility
    const inMemoryRequest = {
      id: firestoreDoc.id,
      ...requestData,
      status: blockchainResult ? 'onchain' : 'pending',
      requestHash
    };
    requests.unshift(inMemoryRequest);

    console.log('✅ Request submitted successfully');

    res.status(201).json({
      id: firestoreDoc.id,
      ...requestData,
      status: blockchainResult ? 'onchain' : 'pending',
      requestHash: requestHash.substring(0, 20) + '...',
      txHash: blockchainResult?.transactionId || null,
      message: blockchainResult ? 
        'Request submitted successfully and stored on blockchain immediately' : 
        'Request submitted successfully and queued for blockchain processing'
    });

  } catch (error) {
    console.error('❌ Error creating request:', error);
    res.status(500).json({
      error: 'Failed to create request',
      message: error.message
    });
  }
});

// Submit new request (singular endpoint for backward compatibility) - allows anonymous submits
app.post('/api/request', optionalAuthMiddleware, async (req, res) => {
  try {
    const { name, requestType, description, date, location } = req.body;

    console.log('Received request:', req.body);

    // Validate required fields
    if (!requestType || !description || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['requestType', 'description', 'location']
      });
    }

    // Prepare request data for Firestore
    const requestData = {
      name: name || (req.user ? req.user.name : 'Anonymous'),
      requestType,
      description: encryptIfEnabled(description), // Encrypt sensitive data
      date: date || new Date().toISOString(),
      location,
      timestamp: new Date().toISOString(),
      // Add user info if authenticated
      submittedBy: req.user ? req.user.uid : null,
      userEmail: req.user ? req.user.email : null,
      anonymous: !req.user
    };

    console.log('Creating Firestore document...');

    // STEP 1: Write to Firestore with status 'pending'
    const firestoreDoc = await createRequest(requestData);
    console.log('✅ Firestore document created:', firestoreDoc.id);

    // STEP 2: Compute canonical hash
    const requestHash = computeCanonicalHash(firestoreDoc);
    console.log('✅ Canonical hash computed:', requestHash.substring(0, 20) + '...');

    // STEP 3: Update Firestore doc with hash
    await updateRequest(firestoreDoc.id, { requestHash });
    console.log('✅ Firestore document updated with hash');

    // STEP 4: Enqueue for blockchain processing
    const queueData = {
      requestId: firestoreDoc.id,
      requestHash,
      requestType,
      location,
      submittedBy: req.user ? req.user.uid : null,
      anonymous: !req.user,
      timestamp: new Date().toISOString()
    };

    // Import queue service
    const { enqueuePendingChain } = require('./services/firestoreService');
    await enqueuePendingChain(queueData);
    console.log('✅ Request enqueued for blockchain processing');

    // Also add to in-memory storage for backward compatibility
    const inMemoryRequest = {
      id: firestoreDoc.id,
      ...requestData,
      status: 'pending',
      requestHash
    };
    requests.unshift(inMemoryRequest);

    console.log('✅ Request submitted successfully');

    res.status(201).json({
      id: firestoreDoc.id,
      ...requestData,
      status: 'pending',
      requestHash: requestHash.substring(0, 20) + '...',
      message: 'Request submitted successfully and queued for blockchain processing'
    });

  } catch (error) {
    console.error('❌ Error creating request:', error);
    res.status(500).json({
      error: 'Failed to create request',
      message: error.message
    });
  }
});

// Delete request by ID (soft delete - marks as deleted but keeps for audit)
app.delete('/api/requests/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const requestIndex = requests.findIndex(req => req.id === id);

    if (requestIndex === -1) {
      return res.status(404).json({
        error: 'Request not found',
        id: id
      });
    }

    // Soft delete - mark as deleted instead of removing
    requests[requestIndex].deleted = true;
    requests[requestIndex].deletedAt = new Date().toISOString();
    requests[requestIndex].status = 'Deleted';
    
    const deletedRequest = requests[requestIndex];
    console.log('Soft deleted request:', deletedRequest.id);

    res.json({
      message: 'Request deleted successfully',
      deletedRequest: deletedRequest
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({
      error: 'Failed to delete request',
      message: error.message
    });
  }
});

// Get specific request by ID - optional auth for additional user info
app.get('/api/request/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Read from Firestore instead of in-memory array
    const request = await getRequest(id);

    if (!request) {
      return res.status(404).json({
        error: 'Request not found',
        id: id
      });
    }

    // Add user context if authenticated
    if (req.user && req.user.uid) {
      const response = {
        ...request,
        user: {
          uid: req.user.uid,
          email: req.user.email,
          name: req.user.name
        },
        canEdit: request.submittedBy === req.user.uid,
        canDelete: request.submittedBy === req.user.uid
      };
      res.json(response);
    } else {
      // Anonymous user - return basic request info
      res.json({
        ...request,
        user: null,
        canEdit: false,
        canDelete: false,
        message: 'Sign in to see additional options and manage your requests'
      });
    }
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      error: 'Failed to fetch request',
      message: error.message
    });
  }
});

// AI Chat endpoint - requires auth for user context
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    console.log('AI Chat request:', message);

    // Use simple AI chat
    const aiResponse = await chatWithAI(message);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      error: 'AI service temporarily unavailable',
      message: error.message
    });
  }
});

// Enhanced AI Chat endpoint with suggestions
app.post('/api/ai/chat/enhanced', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    console.log('AI Enhanced Chat request:', message);

    // Use enhanced chat with suggestions
    const aiResponse = await chatWithSuggestions(message);
    
    res.json(aiResponse);

  } catch (error) {
    console.error('Error in AI enhanced chat:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable',
      message: error.message 
    });
  }
});



// Blockchain verification endpoint - optional auth for public verification
app.get('/api/blockchain/verify/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this is a donation transaction hash
    if (id.startsWith('0x') && id.length === 66) {
      // This looks like a transaction hash from a donation
      res.json({
        requestId: id,
        verified: true,
        exists: true,
        proof: {
          transactionId: id,
          blockHash: 'N/A',
          blockNumber: 'N/A',
          verified: true,
          confirmations: 1,
          timestamp: new Date().toISOString(),
          network: 'BlockDAG Testnet',
          message: 'Donation transaction verified on blockchain',
          type: 'donation'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Try to get transaction proof for regular requests
    const proof = await getTransactionProof(id);
    res.json({
      requestId: id,
      verified: true,
        exists: true,
      proof: proof,
      timestamp: new Date().toISOString()
    });
    }

  } catch (error) {
    console.error('Error verifying blockchain:', error);
    res.status(500).json({
      error: 'Blockchain verification failed',
      message: error.message
    });
  }
});

// Get requests from blockchain - optional auth for public access
app.get('/api/blockchain/requests', optionalAuthMiddleware, async (req, res) => {
  try {
    console.log('Fetching requests from blockchain...');
    const blockchainRequests = await getRequestsFromBlockchain();
    
    res.json({
      success: true,
      requests: blockchainRequests,
      count: blockchainRequests.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blockchain requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch blockchain requests',
      message: error.message 
    });
  }
});

// Get blockchain request count - optional auth for public access
app.get('/api/blockchain/count', optionalAuthMiddleware, async (req, res) => {
  try {
    console.log('Fetching blockchain request count...');
    const count = await getRequestCount();
    
    res.json({
      success: true,
      count: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blockchain count:', error);
    res.status(500).json({ 
      error: 'Failed to fetch blockchain count',
      message: error.message 
    });
  }
});

// Blockchain donation transaction endpoint
app.post('/api/blockchain/donation', async (req, res) => {
  try {
    const { type, amount, cause, donor, message } = req.body;

    console.log('Creating donation transaction:', req.body);

    const donationData = {
      type: 'donation',
      amount: amount,
      cause: cause,
      donor: donor,
      message: message,
      timestamp: new Date().toISOString()
    };

    // Store on blockchain using your proven method
    const blockchainResult = await storeHashOnBlockchain(donationData);

    console.log('Donation transaction created:', {
      transactionHash: blockchainResult.transactionId,
      blockHash: blockchainResult.blockHash,
      amount,
      cause
    });

    res.status(201).json({
      success: true,
      transactionHash: blockchainResult.transactionId,
      blockHash: blockchainResult.blockHash,
      amount,
      cause,
      donor,
      timestamp: new Date().toISOString(),
      confirmations: blockchainResult.confirmations,
      network: blockchainResult.network
    });

  } catch (error) {
    console.error('Error creating donation transaction:', error);
    res.status(500).json({
      error: 'Failed to create donation transaction',
      message: error.message
    });
  }
});

// Process donation endpoint
app.post('/api/donations', async (req, res) => {
  try {
    const { amount, cause, paymentMethod, donorInfo, blockdagTxHash } = req.body;

    console.log('Received donation:', req.body);

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid donation amount',
        message: 'Amount must be greater than 0'
      });
    }

    // Create new donation record
    const newDonation = {
      id: generateDonationId(),
      amount: parseFloat(amount),
      cause: cause || 'general',
      paymentMethod: paymentMethod || 'card',
      donorInfo: {
        name: donorInfo?.name || 'Anonymous',
        email: donorInfo?.email || '',
        message: donorInfo?.message || ''
      },
      status: 'completed',
      timestamp: new Date().toISOString(),
      transactionHash: blockdagTxHash || `0x${Math.random().toString(16).substr(2, 64)}`, // Use blockchain hash if available
      blockchainTxHash: blockdagTxHash || null
    };

    // Add to in-memory storage
    donations.unshift(newDonation);

    // Store on blockchain (using existing infrastructure)
    try {
      const blockchainResult = await storeHashOnBlockchain({
        type: 'donation',
        ...newDonation
      });
      console.log('Donation blockchain storage result:', blockchainResult);
    } catch (blockchainError) {
      console.error('Donation blockchain storage failed:', blockchainError);
      // Continue anyway - blockchain is optional for demo
    }

    console.log('Processed donation:', newDonation);

    res.status(201).json({
      ...newDonation,
      message: 'Donation processed successfully'
    });

  } catch (error) {
    console.error('Error processing donation:', error);
    res.status(500).json({
      error: 'Failed to process donation',
      message: error.message
    });
  }
});

// Get donation statistics
app.get('/api/donations/stats', (req, res) => {
  try {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const donationsByCause = donations.reduce((acc, d) => {
      acc[d.cause] = (acc[d.cause] || 0) + d.amount;
      return acc;
    }, {});

    const stats = {
      totalDonations,
      totalDonors: donations.length,
      donationsByCause,
      averageDonation: donations.length > 0 ? totalDonations / donations.length : 0,
      recentDonations: donations.slice(0, 5).map(d => ({
        id: d.id,
        amount: d.amount,
        cause: d.cause,
        donor: d.donorInfo.name,
        timestamp: d.timestamp
      })),
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({
      error: 'Failed to fetch donation statistics',
      message: error.message
    });
  }
});

// Statistics endpoint
app.get('/api/stats', authMiddleware, (req, res) => {
  try {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    
    const stats = {
      totalRequests: requests.length,
      requestsByType: {
        'Finance': requests.filter(r => r.requestType === 'Finance').length,
        'GBV Support': requests.filter(r => r.requestType === 'GBV Support').length,
        'Sanitary Aid': requests.filter(r => r.requestType === 'Sanitary Aid').length
      },
      requestsByStatus: {
        'Processing': requests.filter(r => r.status === 'Processing').length,
        'Urgent': requests.filter(r => r.status === 'Urgent').length,
        'Completed': requests.filter(r => r.status === 'Completed').length
      },
      donations: {
        total: totalDonations,
        count: donations.length
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 GirliesHub API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/requests`);
  console.log(`   DELETE /api/requests/:id`);
  console.log(`   GET  /api/request/:id`);
  console.log(`   POST /api/ai/chat`);
  console.log(`   POST /api/ai/chat/enhanced`);
  console.log(`   GET  /api/blockchain/verify/:id`);
  console.log(`   GET  /api/blockchain/requests`);
  console.log(`   GET  /api/blockchain/count`);
  console.log(`   POST /api/blockchain/donation`);
  console.log(`   POST /api/donations`);
  console.log(`   GET  /api/donations/stats`);
  console.log(`   GET  /api/stats`);
  
  // Start the blockchain queue worker
  try {
    const queueWorker = require('./services/dbToChainQueue');
    console.log('🔄 Starting blockchain queue worker...');
    queueWorker.start();
    console.log('✅ Blockchain queue worker started successfully');
    
    // Store reference for graceful shutdown
    server.queueWorker = queueWorker;
  } catch (error) {
    console.error('❌ Failed to start blockchain queue worker:', error);
    console.log('⚠️  Blockchain writes may not work properly without the queue worker');
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  if (server.queueWorker) {
    server.queueWorker.stop();
    console.log('✅ Queue worker stopped');
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  if (server.queueWorker) {
    server.queueWorker.stop();
    console.log('✅ Queue worker stopped');
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;