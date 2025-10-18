const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * BlockDAG Network Layer
 * Handles peer-to-peer communication and network synchronization
 */

class BlockDAGNetwork extends EventEmitter {
  constructor(nodeId, port = 8080) {
    super();
    this.nodeId = nodeId;
    this.port = port;
    this.peers = new Map(); // peerId -> peer info
    this.isRunning = false;
    this.syncInProgress = false;
    this.networkStats = {
      connectedPeers: 0,
      messagesSent: 0,
      messagesReceived: 0,
      syncOperations: 0
    };
  }

  /**
   * Start the network node
   */
  async start() {
    try {
      this.isRunning = true;
      console.log(`🌐 BlockDAG Network node ${this.nodeId} started on port ${this.port}`);
      this.emit('networkStarted', { nodeId: this.nodeId, port: this.port });
      return true;
    } catch (error) {
      console.error('Failed to start network:', error);
      return false;
    }
  }

  /**
   * Stop the network node
   */
  async stop() {
    this.isRunning = false;
    this.peers.clear();
    console.log(`🛑 BlockDAG Network node ${this.nodeId} stopped`);
    this.emit('networkStopped', { nodeId: this.nodeId });
  }

  /**
   * Connect to a peer
   */
  async connectToPeer(peerAddress, peerPort) {
    const peerId = `${peerAddress}:${peerPort}`;
    
    if (this.peers.has(peerId)) {
      console.log(`Already connected to peer ${peerId}`);
      return true;
    }

    try {
      // Simulate peer connection
      const peerInfo = {
        id: peerId,
        address: peerAddress,
        port: peerPort,
        connected: true,
        lastSeen: Date.now(),
        version: '1.0.0',
        capabilities: ['dag_sync', 'block_relay', 'tx_relay']
      };

      this.peers.set(peerId, peerInfo);
      this.networkStats.connectedPeers++;
      
      console.log(`✅ Connected to peer ${peerId}`);
      this.emit('peerConnected', { peer: peerInfo });
      
      // Start handshake
      await this.performHandshake(peerId);
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Perform handshake with peer
   */
  async performHandshake(peerId) {
    const handshakeData = {
      type: 'handshake',
      nodeId: this.nodeId,
      version: '1.0.0',
      capabilities: ['dag_sync', 'block_relay', 'tx_relay'],
      timestamp: Date.now()
    };

    await this.sendMessage(peerId, handshakeData);
    console.log(`🤝 Handshake completed with ${peerId}`);
  }

  /**
   * Disconnect from a peer
   */
  disconnectFromPeer(peerId) {
    if (this.peers.has(peerId)) {
      this.peers.delete(peerId);
      this.networkStats.connectedPeers--;
      console.log(`❌ Disconnected from peer ${peerId}`);
      this.emit('peerDisconnected', { peerId });
    }
  }

  /**
   * Send message to a specific peer
   */
  async sendMessage(peerId, message) {
    if (!this.peers.has(peerId)) {
      throw new Error(`Peer ${peerId} not connected`);
    }

    const peer = this.peers.get(peerId);
    if (!peer.connected) {
      throw new Error(`Peer ${peerId} is not connected`);
    }

    // Simulate message sending
    const messageWithMetadata = {
      ...message,
      from: this.nodeId,
      to: peerId,
      timestamp: Date.now(),
      messageId: crypto.randomUUID()
    };

    this.networkStats.messagesSent++;
    console.log(`📤 Sent message to ${peerId}:`, message.type);
    this.emit('messageSent', { peerId, message: messageWithMetadata });

    // Simulate network delay and response
    setTimeout(() => {
      this.handleMessage(peerId, messageWithMetadata);
    }, Math.random() * 100 + 50); // 50-150ms delay
  }

  /**
   * Broadcast message to all connected peers
   */
  async broadcastMessage(message) {
    const connectedPeers = Array.from(this.peers.keys()).filter(
      peerId => this.peers.get(peerId).connected
    );

    if (connectedPeers.length === 0) {
      console.log('No connected peers to broadcast to');
      return;
    }

    const broadcastPromises = connectedPeers.map(peerId => 
      this.sendMessage(peerId, message).catch(error => 
        console.error(`Failed to send to ${peerId}:`, error)
      )
    );

    await Promise.allSettled(broadcastPromises);
    console.log(`📡 Broadcasted ${message.type} to ${connectedPeers.length} peers`);
  }

  /**
   * Handle incoming message
   */
  async handleMessage(fromPeerId, message) {
    this.networkStats.messagesReceived++;
    
    switch (message.type) {
      case 'handshake':
        await this.handleHandshake(fromPeerId, message);
        break;
      case 'block_announcement':
        await this.handleBlockAnnouncement(fromPeerId, message);
        break;
      case 'block_request':
        await this.handleBlockRequest(fromPeerId, message);
        break;
      case 'block_response':
        await this.handleBlockResponse(fromPeerId, message);
        break;
      case 'sync_request':
        await this.handleSyncRequest(fromPeerId, message);
        break;
      case 'sync_response':
        await this.handleSyncResponse(fromPeerId, message);
        break;
      case 'transaction':
        await this.handleTransaction(fromPeerId, message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }

    this.emit('messageReceived', { fromPeerId, message });
  }

  /**
   * Handle handshake message
   */
  async handleHandshake(fromPeerId, message) {
    const peer = this.peers.get(fromPeerId);
    if (peer) {
      peer.version = message.version;
      peer.capabilities = message.capabilities;
      peer.lastSeen = Date.now();
    }
    console.log(`🤝 Received handshake from ${fromPeerId}`);
  }

  /**
   * Handle block announcement
   */
  async handleBlockAnnouncement(fromPeerId, message) {
    console.log(`📢 Block announcement from ${fromPeerId}:`, message.blockHash);
    this.emit('blockAnnouncement', { fromPeerId, blockHash: message.blockHash, blockId: message.blockId });
  }

  /**
   * Handle block request
   */
  async handleBlockRequest(fromPeerId, message) {
    console.log(`📥 Block request from ${fromPeerId}:`, message.blockId);
    this.emit('blockRequest', { fromPeerId, blockId: message.blockId });
  }

  /**
   * Handle block response
   */
  async handleBlockResponse(fromPeerId, message) {
    console.log(`📦 Block response from ${fromPeerId}`);
    this.emit('blockResponse', { fromPeerId, block: message.block });
  }

  /**
   * Handle sync request
   */
  async handleSyncRequest(fromPeerId, message) {
    console.log(`🔄 Sync request from ${fromPeerId}`);
    this.emit('syncRequest', { fromPeerId, lastKnownBlock: message.lastKnownBlock });
  }

  /**
   * Handle sync response
   */
  async handleSyncResponse(fromPeerId, message) {
    console.log(`🔄 Sync response from ${fromPeerId}:`, message.blocks.length, 'blocks');
    this.emit('syncResponse', { fromPeerId, blocks: message.blocks });
  }

  /**
   * Handle transaction
   */
  async handleTransaction(fromPeerId, message) {
    console.log(`💰 Transaction from ${fromPeerId}:`, message.transaction.id);
    this.emit('transaction', { fromPeerId, transaction: message.transaction });
  }

  /**
   * Announce new block to network
   */
  async announceBlock(block) {
    const announcement = {
      type: 'block_announcement',
      blockHash: block.hash,
      blockId: block.id,
      timestamp: block.timestamp,
      parentBlocks: block.parents
    };

    await this.broadcastMessage(announcement);
  }

  /**
   * Request block from peers
   */
  async requestBlock(blockId) {
    const request = {
      type: 'block_request',
      blockId: blockId,
      timestamp: Date.now()
    };

    await this.broadcastMessage(request);
  }

  /**
   * Send block to requesting peer
   */
  async sendBlock(peerId, block) {
    const response = {
      type: 'block_response',
      block: block,
      timestamp: Date.now()
    };

    await this.sendMessage(peerId, response);
  }

  /**
   * Synchronize with network
   */
  async synchronizeWithNetwork(lastKnownBlockId = null) {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;
    this.networkStats.syncOperations++;

    try {
      const syncRequest = {
        type: 'sync_request',
        lastKnownBlock: lastKnownBlockId,
        timestamp: Date.now()
      };

      await this.broadcastMessage(syncRequest);
      console.log('🔄 Started network synchronization');
      
      // Wait for sync responses (simplified)
      setTimeout(() => {
        this.syncInProgress = false;
        console.log('✅ Network synchronization completed');
        this.emit('syncCompleted');
      }, 2000);

    } catch (error) {
      console.error('Sync failed:', error);
      this.syncInProgress = false;
      this.emit('syncFailed', { error: error.message });
    }
  }

  /**
   * Broadcast transaction to network
   */
  async broadcastTransaction(transaction) {
    const message = {
      type: 'transaction',
      transaction: transaction,
      timestamp: Date.now()
    };

    await this.broadcastMessage(message);
    console.log(`📡 Broadcasted transaction ${transaction.id}`);
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    return {
      ...this.networkStats,
      isRunning: this.isRunning,
      syncInProgress: this.syncInProgress,
      peers: Array.from(this.peers.values()).map(peer => ({
        id: peer.id,
        address: peer.address,
        port: peer.port,
        connected: peer.connected,
        lastSeen: peer.lastSeen,
        version: peer.version
      }))
    };
  }

  /**
   * Get connected peers
   */
  getConnectedPeers() {
    return Array.from(this.peers.values()).filter(peer => peer.connected);
  }

  /**
   * Check peer health
   */
  checkPeerHealth() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastSeen > timeout) {
        console.log(`⚠️ Peer ${peerId} appears to be offline`);
        peer.connected = false;
        this.emit('peerTimeout', { peerId });
      }
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.checkPeerHealth();
    }, 10000); // Check every 10 seconds
  }
}

module.exports = {
  BlockDAGNetwork
};
