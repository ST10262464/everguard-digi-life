// API Configuration for GirliesHub
export const API_CONFIG = {
  // Backend URL - use environment variable in production, fallback to proxy in development
  BASE_URL: process.env.REACT_APP_API_URL || '',
  
  // API endpoints
  ENDPOINTS: {
    REQUESTS: '/api/requests',
    BLOCKCHAIN: {
      REQUESTS: '/api/blockchain/requests',
      VERIFY: '/api/blockchain/verify',
      COUNT: '/api/blockchain/count',
      DONATION: '/api/blockchain/donation'
    },
    DONATIONS: '/api/donations',
    DONATIONS_STATS: '/api/donations/stats',
    AI_CHAT: '/api/ai/chat',
    AI_CHAT_ENHANCED: '/api/ai/chat/enhanced',
    STATS: '/api/stats',
    HEALTH: '/api/health'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  if (API_CONFIG.BASE_URL) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  }
  // In development, use relative URL (proxy will handle it)
  return endpoint;
};

export default API_CONFIG;

