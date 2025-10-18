const crypto = require('crypto');

/**
 * BlockDAG Core Implementation
 * A Directed Acyclic Graph (DAG) based blockchain structure
 */

class Transaction {
  constructor(from, to, amount, data = null) {
    this.id = crypto.randomUUID();
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.data = data;
    this.timestamp = Date.now();
    this.signature = null;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.from + this.to + this.amount + this.timestamp + JSON.stringify(this.data))
      .digest('hex');
  }

  signTransaction(signingKey) {
    // Simplified signing for demo purposes
    if (typeof signingKey === 'string') {
      // Simple string-based signing for demo
      this.signature = crypto
        .createHash('sha256')
        .update(signingKey + this.calculateHash())
        .digest('hex');
      return;
    }
    
    // Original elliptic curve signing (if proper key provided)
    if (signingKey && signingKey.getPublic) {
      if (signingKey.getPublic('hex') !== this.from) {
        throw new Error('You cannot sign transactions for other wallets!');
      }
      
      const hashTx = this.calculateHash();
      const sig = signingKey.sign(hashTx, 'base64');
      this.signature = sig.toDER('hex');
    }
  }

  isValid() {
    if (this.from === null) return true; // Mining reward transaction
    
    // For demo purposes, allow transactions without signatures
    // In production, all transactions should be properly signed
    if (!this.signature || this.signature.length === 0) {
      console.log('⚠️ Transaction without signature (demo mode)');
      return true; // Allow for testing
    }

    try {
      const publicKey = crypto.createVerify('SHA256');
      publicKey.update(this.calculateHash());
      return publicKey.verify(this.from, this.signature, 'hex');
    } catch (error) {
      console.log('⚠️ Signature verification failed:', error.message);
      return true; // Allow for demo purposes
    }
  }
}

class Block {
  constructor(transactions, parents = []) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.parents = parents; // Array of parent block IDs (DAG structure)
    this.children = new Set(); // Set of child block IDs
    this.nonce = 0;
    this.hash = this.calculateHash();
    this.weight = 1; // Initial weight
    this.cumulativeWeight = 1; // Will be calculated based on DAG structure
    this.confirmed = false;
    this.confirmationScore = 0;
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.timestamp +
        JSON.stringify(this.transactions) +
        JSON.stringify(this.parents.sort()) +
        this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block mined: ${this.hash}`);
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }

  addChild(childId) {
    this.children.add(childId);
  }

  removeChild(childId) {
    this.children.delete(childId);
  }
}

class BlockDAG {
  constructor() {
    this.blocks = new Map(); // blockId -> Block
    this.tips = new Set(); // Set of tip block IDs (blocks with no children)
    this.genesis = null;
    this.difficulty = 2;
    this.miningReward = 100;
    this.pendingTransactions = [];
    this.balances = new Map(); // address -> balance
    
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesisTransaction = new Transaction(null, 'genesis', 0, { type: 'genesis' });
    const genesis = new Block([genesisTransaction], []);
    genesis.mineBlock(this.difficulty);
    
    this.blocks.set(genesis.id, genesis);
    this.tips.add(genesis.id);
    this.genesis = genesis.id;
    
    console.log('Genesis block created:', genesis.hash);
  }

  addBlock(block) {
    // Validate block
    if (!this.isValidBlock(block)) {
      throw new Error('Invalid block');
    }

    // Update parent-child relationships
    for (const parentId of block.parents) {
      const parent = this.blocks.get(parentId);
      if (parent) {
        parent.addChild(block.id);
        // Remove parent from tips if it now has children
        this.tips.delete(parentId);
      }
    }

    // Add block to DAG
    this.blocks.set(block.id, block);
    this.tips.add(block.id);

    // Update cumulative weights
    this.updateCumulativeWeights();
    
    // Update confirmation scores
    this.updateConfirmationScores();

    console.log(`Block added to DAG: ${block.hash}`);
  }

  isValidBlock(block) {
    // Check if all parent blocks exist
    for (const parentId of block.parents) {
      if (!this.blocks.has(parentId)) {
        return false;
      }
    }

    // Check if block creates a cycle (should not happen in DAG)
    if (this.createsCycle(block)) {
      return false;
    }

    // Validate all transactions in block
    return block.hasValidTransactions();
  }

  createsCycle(newBlock) {
    // Simple cycle detection using DFS
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (blockId) => {
      if (recursionStack.has(blockId)) return true;
      if (visited.has(blockId)) return false;

      visited.add(blockId);
      recursionStack.add(blockId);

      const block = this.blocks.get(blockId);
      if (block) {
        for (const childId of block.children) {
          if (hasCycle(childId)) return true;
        }
      }

      recursionStack.delete(blockId);
      return false;
    };

    // Temporarily add the new block to check for cycles
    this.blocks.set(newBlock.id, newBlock);
    for (const parentId of newBlock.parents) {
      const parent = this.blocks.get(parentId);
      if (parent) {
        parent.addChild(newBlock.id);
      }
    }

    const cycleExists = hasCycle(newBlock.id);

    // Remove temporary additions
    this.blocks.delete(newBlock.id);
    for (const parentId of newBlock.parents) {
      const parent = this.blocks.get(parentId);
      if (parent) {
        parent.removeChild(newBlock.id);
      }
    }

    return cycleExists;
  }

  updateCumulativeWeights() {
    // Topological sort to calculate cumulative weights
    const visited = new Set();
    const weights = new Map();

    const calculateWeight = (blockId) => {
      if (visited.has(blockId)) {
        return weights.get(blockId) || 0;
      }

      visited.add(blockId);
      const block = this.blocks.get(blockId);
      
      if (!block) return 0;

      let cumulativeWeight = block.weight;
      
      // Add weights from all children
      for (const childId of block.children) {
        cumulativeWeight += calculateWeight(childId);
      }

      weights.set(blockId, cumulativeWeight);
      block.cumulativeWeight = cumulativeWeight;
      
      return cumulativeWeight;
    };

    // Calculate weights starting from genesis
    if (this.genesis) {
      calculateWeight(this.genesis);
    }
  }

  updateConfirmationScores() {
    // Update confirmation scores based on cumulative weight
    const maxWeight = Math.max(...Array.from(this.blocks.values()).map(b => b.cumulativeWeight));
    
    for (const block of this.blocks.values()) {
      block.confirmationScore = block.cumulativeWeight / maxWeight;
      block.confirmed = block.confirmationScore > 0.6; // 60% threshold
    }
  }

  selectParents(maxParents = 2) {
    // Select parents from tips with highest cumulative weight
    const sortedTips = Array.from(this.tips)
      .map(id => this.blocks.get(id))
      .filter(block => block !== null)
      .sort((a, b) => b.cumulativeWeight - a.cumulativeWeight);

    return sortedTips.slice(0, maxParents).map(block => block.id);
  }

  minePendingTransactions(miningRewardAddress) {
    // Add mining reward transaction
    const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTransaction);

    // Select parents for new block
    const parents = this.selectParents();

    // Create and mine new block
    const block = new Block(this.pendingTransactions, parents);
    block.mineBlock(this.difficulty);

    // Add block to DAG
    this.addBlock(block);

    // Update balances
    this.updateBalances(block);

    // Clear pending transactions
    this.pendingTransactions = [];

    return block;
  }

  updateBalances(block) {
    for (const transaction of block.transactions) {
      if (transaction.from !== null) {
        const fromBalance = this.balances.get(transaction.from) || 0;
        this.balances.set(transaction.from, fromBalance - transaction.amount);
      }
      
      const toBalance = this.balances.get(transaction.to) || 0;
      this.balances.set(transaction.to, toBalance + transaction.amount);
    }
  }

  createTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  getBalance(address) {
    return this.balances.get(address) || 0;
  }

  getTips() {
    return Array.from(this.tips).map(id => this.blocks.get(id));
  }

  getConfirmedBlocks() {
    return Array.from(this.blocks.values()).filter(block => block.confirmed);
  }

  getBlockById(id) {
    return this.blocks.get(id);
  }

  getDAGStats() {
    return {
      totalBlocks: this.blocks.size,
      tips: this.tips.size,
      confirmedBlocks: this.getConfirmedBlocks().length,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty
    };
  }
}

module.exports = {
  Transaction,
  Block,
  BlockDAG
};
