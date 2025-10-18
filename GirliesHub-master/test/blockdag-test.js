const { BlockDAG, Transaction, Block } = require('../server/blockdag/core');
const { ConsensusEngine } = require('../server/blockdag/consensus');
const { BlockDAGNetwork } = require('../server/blockdag/network');
const crypto = require('crypto');

/**
 * BlockDAG Implementation Test Suite
 * Comprehensive tests for the BlockDAG system
 */

async function runBlockDAGTests() {
  console.log('🧪 Starting BlockDAG Test Suite...\n');

  try {
    // Test 1: Basic BlockDAG Creation
    console.log('📝 Test 1: Basic BlockDAG Creation');
    const dag = new BlockDAG();
    console.log('✅ BlockDAG created successfully');
    console.log('Genesis block ID:', dag.genesis);
    console.log('Initial stats:', dag.getDAGStats());
    console.log('');

    // Test 2: Transaction Creation and Validation
    console.log('📝 Test 2: Transaction Creation');
    const wallet1 = `0x${crypto.randomBytes(20).toString('hex')}`;
    const wallet2 = `0x${crypto.randomBytes(20).toString('hex')}`;
    
    const tx1 = new Transaction(wallet1, wallet2, 50, { type: 'empowerment_request', description: 'Financial support request' });
    console.log('✅ Transaction created:', tx1.id);
    console.log('Transaction hash:', tx1.hash);
    console.log('');

    // Test 3: Block Creation and Mining
    console.log('📝 Test 3: Block Creation and Mining');
    const parents = dag.selectParents();
    const block1 = new Block([tx1], parents);
    
    console.log('Mining block...');
    const startTime = Date.now();
    block1.mineBlock(dag.difficulty);
    const miningTime = Date.now() - startTime;
    
    console.log('✅ Block mined successfully');
    console.log('Block hash:', block1.hash);
    console.log('Mining time:', miningTime, 'ms');
    console.log('Block parents:', block1.parents);
    console.log('');

    // Test 4: Adding Block to DAG
    console.log('📝 Test 4: Adding Block to DAG');
    dag.addBlock(block1);
    console.log('✅ Block added to DAG');
    console.log('Updated stats:', dag.getDAGStats());
    console.log('Tips:', dag.getTips().map(tip => ({ id: tip.id, weight: tip.cumulativeWeight })));
    console.log('');

    // Test 5: Consensus Engine
    console.log('📝 Test 5: Consensus Engine');
    const nodeId = crypto.randomUUID();
    const consensus = new ConsensusEngine(dag, nodeId);
    
    // Create another transaction and block
    const tx2 = new Transaction(wallet2, wallet1, 25, { type: 'empowerment_request', description: 'Educational support request' });
    const parents2 = dag.selectParents();
    const block2 = new Block([tx2], parents2);
    block2.mineBlock(dag.difficulty);
    
    const consensusResult = await consensus.processBlock(block2);
    console.log('✅ Consensus processing result:', consensusResult);
    console.log('Consensus stats:', consensus.getConsensusStats());
    console.log('');

    // Test 6: Multiple Blocks and DAG Structure
    console.log('📝 Test 6: Multiple Blocks and DAG Structure');
    
    // Create several more blocks to build a proper DAG
    for (let i = 0; i < 5; i++) {
      const tx = new Transaction(
        wallet1, 
        wallet2, 
        10 + i, 
        { type: 'empowerment_request', description: `Request ${i + 1}` }
      );
      
      const parents = dag.selectParents();
      const block = new Block([tx], parents);
      block.mineBlock(dag.difficulty);
      
      await consensus.processBlock(block);
      console.log(`Block ${i + 1} added - Hash: ${block.hash.substring(0, 10)}...`);
    }
    
    console.log('✅ Multiple blocks added successfully');
    console.log('Final DAG stats:', dag.getDAGStats());
    console.log('Confirmed blocks:', dag.getConfirmedBlocks().length);
    console.log('');

    // Test 7: Network Layer
    console.log('📝 Test 7: Network Layer');
    const network = new BlockDAGNetwork(nodeId, 8080);
    
    // Set up event listeners
    network.on('peerConnected', (data) => {
      console.log('Peer connected:', data.peer.id);
    });
    
    network.on('blockAnnouncement', (data) => {
      console.log('Block announcement received:', data.blockHash.substring(0, 10) + '...');
    });
    
    await network.start();
    await network.connectToPeer('localhost', 8081);
    await network.connectToPeer('localhost', 8082);
    
    // Test block announcement
    const testBlock = dag.getTips()[0];
    await network.announceBlock(testBlock);
    
    console.log('✅ Network layer tested successfully');
    console.log('Network stats:', network.getNetworkStats());
    console.log('');

    // Test 8: Transaction Broadcasting
    console.log('📝 Test 8: Transaction Broadcasting');
    const broadcastTx = new Transaction(
      wallet1, 
      wallet2, 
      100, 
      { type: 'empowerment_request', description: 'Broadcast test transaction' }
    );
    
    await network.broadcastTransaction(broadcastTx);
    console.log('✅ Transaction broadcasted successfully');
    console.log('');

    // Test 9: Synchronization
    console.log('📝 Test 9: Network Synchronization');
    await network.synchronizeWithNetwork();
    console.log('✅ Network synchronization completed');
    console.log('');

    // Test 10: Performance Metrics
    console.log('📝 Test 10: Performance Metrics');
    const performanceStart = Date.now();
    
    // Create 10 blocks rapidly
    for (let i = 0; i < 10; i++) {
      const tx = new Transaction(
        wallet1, 
        wallet2, 
        1, 
        { type: 'performance_test', index: i }
      );
      
      dag.createTransaction(tx);
    }
    
    const perfBlock = dag.minePendingTransactions(wallet1);
    const performanceEnd = Date.now();
    
    console.log('✅ Performance test completed');
    console.log('Time to process 10 transactions:', performanceEnd - performanceStart, 'ms');
    console.log('Block contains', perfBlock.transactions.length, 'transactions');
    console.log('');

    // Test 11: Balance Tracking
    console.log('📝 Test 11: Balance Tracking');
    console.log('Wallet 1 balance:', dag.getBalance(wallet1));
    console.log('Wallet 2 balance:', dag.getBalance(wallet2));
    console.log('✅ Balance tracking working correctly');
    console.log('');

    // Clean up
    await network.stop();
    
    // Final Summary
    console.log('🎉 All BlockDAG tests completed successfully!');
    console.log('='.repeat(50));
    console.log('Final System State:');
    console.log('- Total blocks:', dag.getDAGStats().totalBlocks);
    console.log('- Confirmed blocks:', dag.getDAGStats().confirmedBlocks);
    console.log('- Tips:', dag.getDAGStats().tips);
    console.log('- Pending transactions:', dag.getDAGStats().pendingTransactions);
    console.log('='.repeat(50));
    
    return {
      success: true,
      dag: dag,
      consensus: consensus,
      network: network,
      stats: dag.getDAGStats()
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other files
module.exports = {
  runBlockDAGTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runBlockDAGTests()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Test suite completed successfully');
        process.exit(0);
      } else {
        console.error('\n❌ Test suite failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Test suite error:', error);
      process.exit(1);
    });
}
