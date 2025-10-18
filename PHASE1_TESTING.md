# Phase 1: Backend Foundation - Testing Guide

## ✅ What We Just Built

- ✅ Created `server/` directory structure
- ✅ Copied and adapted `crypto.js` (AES-256-GCM encryption)
- ✅ Copied and adapted `blockchain.js` (BlockDAG integration)
- ✅ Created `hash.js` utility
- ✅ Set up `hardhat.config.js` for BlockDAG
- ✅ Created `blockdag.config.js`
- ✅ Created basic `server.js` with health check
- ✅ Set up package.json files

## 📋 Testing Steps

### Step 1: Install Dependencies

```bash
# Install root dependencies (Hardhat + blockchain tools)
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Step 2: Generate Encryption Key

Generate a secure encryption key for AES-256-GCM:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters).

### Step 3: Create .env File

Create a `.env` file in the root directory:

```bash
# Copy the example
cp env.example .env
```

Edit `.env` and add:
1. Your encryption key from Step 2
2. Your private key from the previous hackathon (from GirliesHub)
3. Leave CONTRACT_ADDRESS empty for now (we'll add it after deployment)

**Example .env:**
```
BDAG_RPC_URL=https://rpc.primordial.bdagscan.com
PRIVATE_KEY=0x1234...your_private_key_from_girlieshub
CONTRACT_ADDRESS=

ENCRYPTION_KEY=a1b2c3d4e5f6...your_64_char_hex_key

FIREBASE_PROJECT_ID=everguard-digi-life
FIREBASE_SERVICE_ACCOUNT_PATH=./server/secrets/firebase-service-account.json

PORT=5001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 4: Start the Server

```bash
cd server
node server.js
```

**Expected output:**
```
🚀 ========================================
🏥 EverGuard API Server
🚀 ========================================
📍 Server running on: http://localhost:5001
🌐 Environment: development
🔗 BlockDAG RPC: https://rpc.primordial.bdagscan.com
📝 Contract: Not deployed yet

📋 Available endpoints:
  GET  /health                     - Health check
  GET  /api/blockchain/status      - Blockchain status
  GET  /api/test/encryption        - Test encryption

✅ Server ready!
```

### Step 5: Test Health Check

Open a new terminal and run:

```bash
curl http://localhost:5001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-18T...",
  "service": "EverGuard API",
  "version": "1.0.0"
}
```

### Step 6: Test Encryption

```bash
curl http://localhost:5001/api/test/encryption
```

**Expected response:**
```json
{
  "success": true,
  "original": "Hello EverGuard!",
  "encrypted": "AbCdEf123456...",
  "decrypted": "Hello EverGuard!",
  "match": true
}
```

If you get `"success": false` saying encryption not enabled, double-check your ENCRYPTION_KEY in `.env`.

### Step 7: Test BlockDAG Connection

```bash
curl http://localhost:5001/api/blockchain/status
```

**Expected response:**
```json
{
  "success": true,
  "connected": true,
  "network": "BlockDAG",
  "blockNumber": 12345,
  "wallet": "0x1234...your_wallet_address",
  "contract": null
}
```

Note: `contract` will be `null` until we deploy in Phase 2.

## ✅ Phase 1 Checklist

Mark each as complete:

- [ ] Server starts without errors
- [ ] `/health` endpoint returns `{"status":"healthy"}`
- [ ] `/api/test/encryption` successfully encrypts and decrypts
- [ ] `/api/blockchain/status` shows `"connected": true`
- [ ] Wallet address appears in blockchain status
- [ ] No error messages in console

## ❌ Troubleshooting

### Error: "Cannot find module 'express'"
**Solution:** Run `cd server && npm install`

### Error: "ENCRYPTION_KEY not set"
**Solution:** 
1. Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to `.env` file as `ENCRYPTION_KEY=...`

### Error: "Encryption key not configured"
**Solution:** Your ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).

### Error: "Failed to connect to BlockDAG"
**Solution:** 
1. Check internet connection
2. Verify BDAG_RPC_URL in .env is correct
3. Try: `curl https://rpc.primordial.bdagscan.com`

### Blockchain status shows "wallet": null
**Solution:** Check that PRIVATE_KEY is set in `.env` and starts with `0x`

## 🎯 Success Criteria

**Phase 1 is complete when:**
- ✅ Server runs without errors
- ✅ Health endpoint works
- ✅ Encryption works (encrypt & decrypt match)
- ✅ BlockDAG connection established
- ✅ Wallet connected

## 🚀 Next: Phase 2

Once all tests pass, we move to **Phase 2: Smart Contract Deployment**.

---

**Need help?** Share the error message and I'll help debug!

