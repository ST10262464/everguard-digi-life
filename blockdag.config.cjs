/**
 * BlockDAG Configuration for EverGuard
 * Network and consensus parameters
 */

module.exports = {
  // Network Configuration
  network: {
    name: 'EverGuard-BlockDAG',
    version: '1.0.0',
    chainId: 1043,
    networkId: 'everguard-blockdag',
    
    // Node Configuration
    node: {
      port: 8080,
      maxPeers: 50,
      syncTimeout: 30000, // 30 seconds
      heartbeatInterval: 10000, // 10 seconds
    },

    // Bootstrap nodes for initial connection
    bootstrapNodes: [
      'localhost:8081',
      'localhost:8082',
      'localhost:8083'
    ]
  },

  // BlockDAG Consensus Parameters
  consensus: {
    // Confirmation threshold (percentage)
    confirmationThreshold: 60,
    
    // Maximum number of parent blocks
    maxParents: 2,
    
    // Tip selection strategy: 'weighted' or 'random'
    tipSelectionStrategy: 'weighted',
    
    // Mining difficulty
    difficulty: 2,
    
    // Block time target (milliseconds)
    blockTimeTarget: 10000, // 10 seconds
    
    // Mining reward
    miningReward: 100,
    
    // Maximum block size (bytes)
    maxBlockSize: 1048576, // 1MB
    
    // Maximum transactions per block
    maxTransactionsPerBlock: 1000
  },

  // Transaction Configuration
  transaction: {
    // Minimum transaction fee
    minFee: 0.001,
    
    // Maximum transaction size (bytes)
    maxSize: 10240, // 10KB
    
    // Transaction timeout (milliseconds)
    timeout: 300000, // 5 minutes
  },

  // Smart Contract Configuration
  contracts: {
    // Gas limit for contract deployment
    deploymentGasLimit: 5000000,
    
    // Gas limit for contract execution
    executionGasLimit: 1000000,
    
    // Gas price (in smallest unit)
    gasPrice: 20000000000, // 20 Gwei equivalent
  },

  // API Configuration
  api: {
    // REST API port
    restPort: 5001,
    
    // WebSocket port
    wsPort: 3002,
    
    // Rate limiting
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 100
    },
    
    // CORS settings
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }
  },

  // Database Configuration
  database: {
    // Database type: 'memory', 'leveldb', 'mongodb'
    type: 'memory',
    
    // Connection string (for external databases)
    connectionString: null,
    
    // Cache size (number of blocks to keep in memory)
    cacheSize: 1000
  },

  // Logging Configuration
  logging: {
    level: 'info', // 'error', 'warn', 'info', 'debug'
    file: './logs/blockdag.log',
    maxFileSize: 10485760, // 10MB
    maxFiles: 5
  },

  // Security Configuration
  security: {
    // Enable/disable mining
    miningEnabled: true,
    
    // Wallet encryption
    walletEncryption: true,
    
    // SSL/TLS configuration
    ssl: {
      enabled: false,
      keyFile: null,
      certFile: null
    }
  },

  // Development Configuration
  development: {
    // Enable development mode
    enabled: true,
    
    // Auto-mine blocks
    autoMining: true,
    
    // Mining interval (milliseconds)
    miningInterval: 5000, // 5 seconds
    
    // Generate test data
    generateTestData: true,
    
    // Mock network delays
    mockNetworkDelay: true
  },

  // Production Configuration
  production: {
    // Enable production optimizations
    enabled: false,
    
    // Strict validation
    strictValidation: true,
    
    // Performance monitoring
    monitoring: true,
    
    // Backup configuration
    backup: {
      enabled: true,
      interval: 3600000, // 1 hour
      location: './backups'
    }
  }
};

