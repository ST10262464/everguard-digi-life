const { verifyIdToken } = require('../firebase');

// Helper function to extract UID from token
async function getUidFromToken(token) {
  try {
    const decodedToken = await verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error extracting UID from token:', error.message);
    throw error;
  }
}

// Helper function to check if user is authenticated
function isAuthenticated(req) {
  return req.user && req.user.uid;
}

// Helper function to get user info safely
function getUserInfo(req) {
  return req.user || { uid: null, email: null, name: null };
}

module.exports = {
  getUidFromToken,
  isAuthenticated,
  getUserInfo
};

