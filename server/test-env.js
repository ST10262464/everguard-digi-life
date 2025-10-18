require('dotenv').config({ path: '../.env' });

console.log('=== Environment Variable Test ===');
console.log('ENCRYPTION_KEY exists:', !!process.env.ENCRYPTION_KEY);
console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.length : 0);
console.log('ENCRYPTION_KEY value (first 10 chars):', process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.substring(0, 10) + '...' : 'NOT SET');
console.log('PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);
console.log('BDAG_RPC_URL:', process.env.BDAG_RPC_URL);
console.log('PORT:', process.env.PORT);

