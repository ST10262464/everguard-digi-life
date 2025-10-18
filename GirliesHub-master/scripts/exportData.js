require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Mock in-memory data structure (simulating the old server state)
const mockInMemoryData = {
  requests: [
    {
      id: 'MEM001',
      name: 'Sarah M.',
      requestType: 'Finance',
      description: 'Need financial assistance for education',
      status: 'Processing',
      timestamp: new Date().toISOString(),
      location: 'Cape Town',
      submittedBy: 'user123',
      userEmail: 'sarah@example.com'
    },
    {
      id: 'MEM002',
      name: 'Anonymous',
      requestType: 'GBV Support',
      description: 'Sensitive GBV report requiring immediate attention',
      status: 'Urgent',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      location: 'Johannesburg',
      submittedBy: null,
      userEmail: null,
      anonymous: true
    },
    {
      id: 'MEM003',
      name: 'Linda K.',
      requestType: 'Sanitary Aid',
      description: 'Request for sanitary products and hygiene supplies',
      status: 'Completed',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      location: 'Durban',
      submittedBy: 'user456',
      userEmail: 'linda@example.com'
    }
  ],
  users: [
    {
      id: 'user123',
      email: 'sarah@example.com',
      name: 'Sarah M.',
      role: 'user',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user456',
      email: 'linda@example.com',
      name: 'Linda K.',
      role: 'user',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  transactions: [
    {
      id: 'TXN001',
      requestId: 'MEM001',
      userId: 'user123',
      type: 'request_created',
      timestamp: new Date().toISOString(),
      metadata: {
        requestType: 'Finance',
        location: 'Cape Town'
      }
    },
    {
      id: 'TXN002',
      requestId: 'MEM002',
      userId: null,
      type: 'anonymous_request',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        requestType: 'GBV Support',
        location: 'Johannesburg'
      }
    }
  ]
};

class DataExporter {
  constructor() {
    this.exportDir = path.join(__dirname, 'exports');
    this.ensureExportDirectory();
  }

  ensureExportDirectory() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
      console.log(`📁 Created export directory: ${this.exportDir}`);
    }
  }

  async exportInMemoryData() {
    try {
      console.log('🔄 Starting data export...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `in-memory-export-${timestamp}.json`;
      const filepath = path.join(this.exportDir, filename);

      // Add metadata to the export
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          source: 'in-memory-server-data',
          totalRequests: mockInMemoryData.requests.length,
          totalUsers: mockInMemoryData.users.length,
          totalTransactions: mockInMemoryData.transactions.length
        },
        data: mockInMemoryData
      };

      // Write to file
      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
      
      console.log('✅ Data export completed successfully!');
      console.log(`📄 Export file: ${filepath}`);
      console.log(`📊 Export summary:`);
      console.log(`   - Requests: ${mockInMemoryData.requests.length}`);
      console.log(`   - Users: ${mockInMemoryData.users.length}`);
      console.log(`   - Transactions: ${mockInMemoryData.transactions.length}`);
      
      return {
        filepath,
        filename,
        data: exportData
      };

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  async exportFromServer() {
    try {
      console.log('🔄 Attempting to export from running server...');
      
      // This would connect to a running server and export actual data
      // For now, we'll use mock data
      console.log('ℹ️  Using mock data for demonstration');
      
      return await this.exportInMemoryData();
      
    } catch (error) {
      console.error('❌ Server export failed:', error);
      console.log('ℹ️  Falling back to mock data export...');
      return await this.exportInMemoryData();
    }
  }
}

// If run directly, execute the export
if (require.main === module) {
  const exporter = new DataExporter();
  
  async function runExport() {
    try {
      const result = await exporter.exportFromServer();
      console.log('\n🎉 Export completed successfully!');
      console.log(`📁 File saved to: ${result.filepath}`);
      process.exit(0);
    } catch (error) {
      console.error('❌ Export failed:', error);
      process.exit(1);
    }
  }
  
  runExport();
}

module.exports = DataExporter;
