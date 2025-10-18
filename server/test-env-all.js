require('dotenv').config({ path: '../.env' });

console.log('=== ALL Environment Variables ===');
const envVars = Object.keys(process.env).filter(key => 
  key.includes('BDAG') || 
  key.includes('PRIVATE') || 
  key.includes('ENCRYPT') || 
  key.includes('PORT') ||
  key.includes('CONTRACT') ||
  key.includes('FIREBASE') ||
  key.includes('NODE_ENV') ||
  key.includes('ALLOWED')
);

console.log('\nFound variables:', envVars.length);
envVars.forEach(key => {
  const value = process.env[key];
  if (key.includes('PRIVATE') || key.includes('ENCRYPT')) {
    console.log(`${key}: ${value ? value.substring(0, 10) + '...' : 'NOT SET'}`);
  } else {
    console.log(`${key}: ${value}`);
  }
});

console.log('\n=== Checking exact variable names ===');
console.log('process.env.ENCRYPTION_KEY:', typeof process.env.ENCRYPTION_KEY, process.env.ENCRYPTION_KEY ? 'EXISTS' : 'UNDEFINED');
console.log('process.env.ENCRYPTIONKEY:', typeof process.env.ENCRYPTIONKEY, process.env.ENCRYPTIONKEY ? 'EXISTS' : 'UNDEFINED');
console.log('process.env["ENCRYPTION_KEY"]:', typeof process.env["ENCRYPTION_KEY"], process.env["ENCRYPTION_KEY"] ? 'EXISTS' : 'UNDEFINED');

// List ALL keys that contain "ENCR"
console.log('\n=== Any keys containing "ENCR" ===');
Object.keys(process.env).filter(k => k.toUpperCase().includes('ENCR')).forEach(k => {
  console.log(`Found: "${k}" = ${process.env[k] ? process.env[k].substring(0, 20) + '...' : 'empty'}`);
});

