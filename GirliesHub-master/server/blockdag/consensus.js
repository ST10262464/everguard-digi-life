const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * BlockDAG Consensus Mechanism
 * Implements GHOST-like protocol for DAG-based consensus
 */

class ConsensusEngine extends EventEmitter {
  constructor(blockDAG, nodeId) {
    super();
    this.blockDAG = blockDAG;
    this.nodeId = nodeId;
    this.confirmationThreshold = 0.6; // 60% cumulative weight threshold
    this.maxParents = 2;
    this.tipSelectionStrategy = 'weighted'; // 'weighted' or 'random'
    this.orphanBlocks = new Map(); // Blocks waiting for parents
    this.conflictResolution = new Map(); // Track conflicting transactions
  }

  /**
   * Validate a new block according to consensus rules
   */
  validateBlock(block) {
    const validationResult = {
      valid: true,
      errors: []
    };

    // Check basic block structure
    if (!block.id || !block.hash || !block.timestamp) {
      validationResult.valid = false;
      validationResult.errors.push('Invalid block structure');
      return validationResult;
    }

    // Verify block hash
    const calculatedHash = block.calculateHash();
    if (block.hash !== calculatedHash) {
      validationResult.valid = false;
      validationResult.errors.push('Invalid block hash');
      return validationResult;
    }

    // Check if parents exist
    for (const parentId of block.parents) {
      if (!this.blockDAG.blocks.has(parentId)) {
        validationResult.valid = false;
        validationResult.errors.push(`Parent block ${parentId} not found`);
        return validationResult;
      }
    }

    // Validate parent selection rules
    if (block.parents.length > this.maxParents) {
      validationResult.valid = false;
      validationResult.errors.push(`Too many parents: ${block.parents.length} > ${this.maxParents}`);
      return validationResult;
    }

    // Check for double spending
    const doubleSpendCheck = this.checkDoubleSpending(block);
    if (!doubleSpendCheck.valid) {
      validationResult.valid = false;
      validationResult.errors.push(...doubleSpendCheck.errors);
      return validationResult;
    }

    // Validate transactions
    for (const tx of block.transactions) {
      if (!tx.isValid()) {
        validationResult.valid = false;
        validationResult.errors.push(`Invalid transaction: ${tx.id}`);
        return validationResult;
      }
    }

    // Check timestamp validity (not too far in future)
    const maxFutureTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    if (block.timestamp > maxFutureTime) {
      validationResult.valid = false;
      validationResult.errors.push('Block timestamp too far in future');
      return validationResult;
    }

    return validationResult;
  }

  /**
   * Check for double spending conflicts
   */
  checkDoubleSpending(block) {
    const result = { valid: true, errors: [] };
    const spentOutputs = new Set();

    // Get all confirmed transactions to check against
    const confirmedTxs = this.getConfirmedTransactions();
    const confirmedOutputs = new Set();
    
    for (const tx of confirmedTxs) {
      if (tx.from) {
        confirmedOutputs.add(`${tx.from}-${tx.amount}-${tx.timestamp}`);
      }
    }

    // Check transactions in this block
    for (const tx of block.transactions) {
      if (tx.from) {
        const outputKey = `${tx.from}-${tx.amount}-${tx.timestamp}`;
        
        // Check if already spent in confirmed transactions
        if (confirmedOutputs.has(outputKey)) {
          result.valid = false;
          result.errors.push(`Double spending detected: ${tx.id}`);
        }
        
        // Check if spent multiple times in this block
        if (spentOutputs.has(outputKey)) {
          result.valid = false;
          result.errors.push(`Double spending within block: ${tx.id}`);
        }
        
        spentOutputs.add(outputKey);
      }
    }

    return result;
  }

  /**
   * Get all confirmed transactions from the DAG
   */
  getConfirmedTransactions() {
    const confirmedBlocks = this.blockDAG.getConfirmedBlocks();
    const transactions = [];
    
    for (const block of confirmedBlocks) {
      transactions.push(...block.transactions);
    }
    
    return transactions;
  }

  /**
   * Select parents for a new block using weighted tip selection
   */
  selectParents() {
    const tips = this.blockDAG.getTips();
    
    if (tips.length === 0) {
      return [this.blockDAG.genesis];
    }

    if (this.tipSelectionStrategy === 'weighted') {
      return this.weightedTipSelection(tips);
    } else {
      return this.randomTipSelection(tips);
    }
  }

  /**
   * Weighted tip selection based on cumulative weight
   */
  weightedTipSelection(tips) {
    // Sort tips by cumulative weight (descending)
    const sortedTips = tips.sort((a, b) => b.cumulativeWeight - a.cumulativeWeight);
    
    // Select top tips up to maxParents
    const selectedParents = sortedTips.slice(0, this.maxParents);
    
    // If we need more parents and have more tips, use weighted random selection
    if (selectedParents.length < this.maxParents && tips.length > this.maxParents) {
      const remaining = tips.slice(this.maxParents);
      const totalWeight = remaining.reduce((sum, tip) => sum + tip.cumulativeWeight, 0);
      
      while (selectedParents.length < this.maxParents && remaining.length > 0) {
        const random = Math.random() * totalWeight;
        let weightSum = 0;
        
        for (let i = 0; i < remaining.length; i++) {
          weightSum += remaining[i].cumulativeWeight;
          if (random <= weightSum) {
            selectedParents.push(remaining[i]);
            remaining.splice(i, 1);
            break;
          }
        }
      }
    }

    return selectedParents.map(tip => tip.id);
  }

  /**
   * Random tip selection
   */
  randomTipSelection(tips) {
    const shuffled = tips.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, this.maxParents).map(tip => tip.id);
  }

  /**
   * Process a new block through consensus
   */
  async processBlock(block) {
    try {
      // Validate the block
      const validation = this.validateBlock(block);
      if (!validation.valid) {
        this.emit('blockRejected', { block, errors: validation.errors });
        return { success: false, errors: validation.errors };
      }

      // Check if we have all parent blocks
      const missingParents = block.parents.filter(parentId => !this.blockDAG.blocks.has(parentId));
      
      if (missingParents.length > 0) {
        // Store as orphan block
        this.orphanBlocks.set(block.id, block);
        this.emit('orphanBlock', { block, missingParents });
        return { success: false, errors: ['Missing parent blocks'], orphaned: true };
      }

      // Add block to DAG
      this.blockDAG.addBlock(block);

      // Check if this block resolves any orphan blocks
      this.processOrphanBlocks();

      // Update confirmation scores
      this.updateConfirmationStatus();

      // Emit events
      this.emit('blockAccepted', { block });
      this.emit('dagUpdated', { stats: this.blockDAG.getDAGStats() });

      return { success: true, blockId: block.id };

    } catch (error) {
      this.emit('consensusError', { error: error.message, block });
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * Process orphan blocks that might now have their parents
   */
  processOrphanBlocks() {
    const processedOrphans = [];
    
    for (const [orphanId, orphanBlock] of this.orphanBlocks) {
      const missingParents = orphanBlock.parents.filter(parentId => !this.blockDAG.blocks.has(parentId));
      
      if (missingParents.length === 0) {
        // All parents now available, process the orphan
        const validation = this.validateBlock(orphanBlock);
        if (validation.valid) {
          this.blockDAG.addBlock(orphanBlock);
          processedOrphans.push(orphanId);
          this.emit('orphanResolved', { block: orphanBlock });
        } else {
          // Invalid orphan, remove it
          processedOrphans.push(orphanId);
          this.emit('orphanRejected', { block: orphanBlock, errors: validation.errors });
        }
      }
    }

    // Remove processed orphans
    for (const orphanId of processedOrphans) {
      this.orphanBlocks.delete(orphanId);
    }
  }

  /**
   * Update confirmation status of all blocks
   */
  updateConfirmationStatus() {
    const previouslyConfirmed = new Set();
    const newlyConfirmed = new Set();

    // Track previously confirmed blocks
    for (const block of this.blockDAG.blocks.values()) {
      if (block.confirmed) {
        previouslyConfirmed.add(block.id);
      }
    }

    // Update confirmation scores
    this.blockDAG.updateConfirmationScores();

    // Find newly confirmed blocks
    for (const block of this.blockDAG.blocks.values()) {
      if (block.confirmed && !previouslyConfirmed.has(block.id)) {
        newlyConfirmed.add(block.id);
        this.emit('blockConfirmed', { block });
      }
    }

    if (newlyConfirmed.size > 0) {
      this.emit('confirmationUpdate', { 
        newlyConfirmed: Array.from(newlyConfirmed),
        totalConfirmed: this.blockDAG.getConfirmedBlocks().length
      });
    }
  }

  /**
   * Resolve conflicts between competing blocks
   */
  resolveConflicts(conflictingBlocks) {
    // Use cumulative weight to resolve conflicts
    const sortedBlocks = conflictingBlocks.sort((a, b) => b.cumulativeWeight - a.cumulativeWeight);
    
    const winner = sortedBlocks[0];
    const losers = sortedBlocks.slice(1);

    this.emit('conflictResolved', { winner, losers });
    
    return winner;
  }

  /**
   * Get consensus statistics
   */
  getConsensusStats() {
    const dagStats = this.blockDAG.getDAGStats();
    
    return {
      ...dagStats,
      orphanBlocks: this.orphanBlocks.size,
      confirmationThreshold: this.confirmationThreshold,
      tipSelectionStrategy: this.tipSelectionStrategy,
      maxParents: this.maxParents,
      nodeId: this.nodeId
    };
  }

  /**
   * Set consensus parameters
   */
  setConsensusParams(params) {
    if (params.confirmationThreshold !== undefined) {
      this.confirmationThreshold = params.confirmationThreshold;
    }
    if (params.maxParents !== undefined) {
      this.maxParents = params.maxParents;
    }
    if (params.tipSelectionStrategy !== undefined) {
      this.tipSelectionStrategy = params.tipSelectionStrategy;
    }
    
    this.emit('consensusParamsUpdated', params);
  }
}

module.exports = {
  ConsensusEngine
};
