const queueWorker = require('./services/dbToChainQueue');

console.log('🚀 Starting blockchain queue worker...');
queueWorker.start();

// Keep the process running
process.on('SIGINT', () => {
  console.log('🛑 Stopping queue worker...');
  queueWorker.stop();
  process.exit(0);
});
