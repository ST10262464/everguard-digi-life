const { firestore, admin } = require('../firebase');

// Firestore collections
const COLLECTIONS = {
  REQUESTS: 'requests',
  GBV_REPORTS: 'gbv_reports',
  TRANSACTIONS: 'transactions',
  DB_CHAIN_QUEUE: 'db_chain_queue',
  USER_ROLES: 'user_roles'
};

// Request operations
async function createRequest(doc) {
  try {
    const requestData = {
      ...doc,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection(COLLECTIONS.REQUESTS).add(requestData);
    console.log(`✅ Created request document: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...requestData
    };
  } catch (error) {
    console.error('❌ Error creating request:', error);
    throw error;
  }
}

async function updateRequest(requestId, update) {
  try {
    const updateData = {
      ...update,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await firestore.collection(COLLECTIONS.REQUESTS).doc(requestId).update(updateData);
    console.log(`✅ Updated request document: ${requestId}`);
    
    return { id: requestId, ...updateData };
  } catch (error) {
    console.error('❌ Error updating request:', error);
    throw error;
  }
}

async function getRequest(requestId) {
  try {
    const doc = await firestore.collection(COLLECTIONS.REQUESTS).doc(requestId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('❌ Error getting request:', error);
    throw error;
  }
}

async function listRequests(filters = {}) {
  try {
    let query = firestore.collection(COLLECTIONS.REQUESTS);
    
    // Apply filters (limit to one filter to avoid composite index issues)
    if (filters.submittedBy) {
      query = query.where('submittedBy', '==', filters.submittedBy);
    } else if (filters.requestType) {
      query = query.where('requestType', '==', filters.requestType);
    } else if (filters.status) {
      query = query.where('status', '==', filters.status);
    } else if (filters.anonymous !== undefined) {
      query = query.where('anonymous', '==', filters.anonymous);
    }
    
    const snapshot = await query.get();
    const requests = [];
    
    snapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Apply additional filters in memory
    let filteredRequests = requests;
    if (filters.submittedBy && filters.requestType) {
      filteredRequests = filteredRequests.filter(r => r.requestType === filters.requestType);
    }
    if (filters.submittedBy && filters.status) {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status);
    }
    if (filters.submittedBy && filters.anonymous !== undefined) {
      filteredRequests = filteredRequests.filter(r => r.anonymous === filters.anonymous);
    }
    
    // Sort in memory to avoid index requirement
    filteredRequests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bTime - aTime; // newest first
    });
    
    return filteredRequests;
  } catch (error) {
    console.error('❌ Error listing requests:', error);
    throw error;
  }
}

// GBV Report operations
async function createGBVReport(doc) {
  try {
    const reportData = {
      ...doc,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection(COLLECTIONS.GBV_REPORTS).add(reportData);
    console.log(`✅ Created GBV report document: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...reportData
    };
  } catch (error) {
    console.error('❌ Error creating GBV report:', error);
    throw error;
  }
}

async function getGBVReports(filters = {}) {
  try {
    let query = firestore.collection(COLLECTIONS.GBV_REPORTS);
    
    // Apply filters
    if (filters.submittedBy) {
      query = query.where('submittedBy', '==', filters.submittedBy);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    const reports = [];
    
    snapshot.forEach(doc => {
      reports.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reports;
  } catch (error) {
    console.error('❌ Error getting GBV reports:', error);
    throw error;
  }
}

// Transaction operations
async function createTransaction(doc) {
  try {
    const transactionData = {
      ...doc,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection(COLLECTIONS.TRANSACTIONS).add(transactionData);
    console.log(`✅ Created transaction document: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...transactionData
    };
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    throw error;
  }
}

async function getTransactionsByUser(uid) {
  try {
    const snapshot = await firestore.collection(COLLECTIONS.TRANSACTIONS)
      .where('userId', '==', uid)
      .get();
    
    const transactions = [];
    
    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort in memory to avoid index requirement
    transactions.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bTime - aTime; // newest first
    });
    
    return transactions;
  } catch (error) {
    console.error('❌ Error getting user transactions:', error);
    throw error;
  }
}

// Queue operations for blockchain processing
async function enqueuePendingChain(doc) {
  try {
    const queueData = {
      ...doc,
      status: 'pending',
      queuedAt: admin.firestore.FieldValue.serverTimestamp(),
      attempts: 0,
      lastAttempt: null
    };

    const docRef = await firestore.collection(COLLECTIONS.DB_CHAIN_QUEUE).add(queueData);
    console.log(`✅ Enqueued document for blockchain processing: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...queueData
    };
  } catch (error) {
    console.error('❌ Error enqueueing for blockchain:', error);
    throw error;
  }
}

// Get pending queue items
async function getPendingQueueItems() {
  try {
    const snapshot = await firestore.collection(COLLECTIONS.DB_CHAIN_QUEUE)
      .where('status', '==', 'pending')
      .get();
    
    const items = [];
    
    snapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort in memory to avoid index requirement
    items.sort((a, b) => {
      const aTime = a.queuedAt?.toDate?.() || new Date(a.queuedAt) || new Date(0);
      const bTime = b.queuedAt?.toDate?.() || new Date(b.queuedAt) || new Date(0);
      return aTime - bTime; // oldest first (FIFO)
    });
    
    return items;
  } catch (error) {
    console.error('❌ Error getting pending queue items:', error);
    throw error;
  }
}

// Update queue item status
async function updateQueueItemStatus(itemId, status, updateData = {}) {
  try {
    const update = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...updateData
    };

    await firestore.collection(COLLECTIONS.DB_CHAIN_QUEUE).doc(itemId).update(update);
    console.log(`✅ Updated queue item ${itemId} status to: ${status}`);
    
    return { id: itemId, ...update };
  } catch (error) {
    console.error('❌ Error updating queue item status:', error);
    throw error;
  }
}

module.exports = {
  // Request operations
  createRequest,
  updateRequest,
  getRequest,
  listRequests,
  
  // GBV Report operations
  createGBVReport,
  getGBVReports,
  
  // Transaction operations
  createTransaction,
  getTransactionsByUser,
  
  // Queue operations
  enqueuePendingChain,
  getPendingQueueItems,
  updateQueueItemStatus,
  
  // Collections
  COLLECTIONS
};
