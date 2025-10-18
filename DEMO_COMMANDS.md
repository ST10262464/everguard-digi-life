# EverGuard PulseKey - Demo Commands

## 🚀 Quick Start

### 1. Start the Server
```bash
cd server
node server.js
```

Server will start on `http://localhost:5001`

---

## 🎬 Live Demo Commands

### Step 1: Show Contract on BlockDAG
**Browser**: Open https://bdagscan.com/awakening/address/0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c

Say: *"This is our smart contract on BlockDAG. Real blockchain, not simulated."*

---

### Step 2: Create Emergency Medical Capsule

```bash
curl -X POST http://localhost:5001/api/capsules \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "alice_demo",
    "capsuleData": {
      "type": "medical",
      "title": "Alice Emergency Data",
      "content": {
        "bloodType": "AB+",
        "allergies": ["Penicillin", "Bee stings"],
        "medications": ["Insulin", "Beta blockers"],
        "conditions": ["Type 1 Diabetes", "Heart condition"],
        "emergencyContact": {
          "name": "John Doe",
          "phone": "+1-555-9999"
        },
        "dnr": false
      }
    }
  }'
```

**Expected**: Instant response (< 100ms)
**Say**: *"Capsule created instantly. Encryption and blockchain logging happen in milliseconds."*

**Save the capsule ID** from response (e.g., `cap_1`)

---

### Step 3: Emergency Scenario - Request Access

Say: *"Alice collapses. Paramedic arrives and requests emergency access."*

```bash
curl -X POST http://localhost:5001/api/emergency/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "capsuleId": "cap_1",
    "medicId": "paramedic_mike",
    "medicPubKey": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
    "context": {
      "location": "Downtown Hospital ER",
      "deviceId": "ambulance_unit_7",
      "attestation": "critical_emergency"
    }
  }'
```

**Expected**: Instant BurstKey issuance
**Say**: *"System issues a temporary, single-use BurstKey. Valid for 10 minutes."*

**Save the burstKey** from response

---

### Step 4: Access Medical Data with BurstKey

```bash
curl -X POST http://localhost:5001/api/emergency/access-capsule \
  -H "Content-Type: application/json" \
  -d '{
    "burstKey": "YOUR_BURST_KEY_HERE",
    "medicId": "paramedic_mike"
  }'
```

**Expected**: Decrypted medical data
**Say**: *"Paramedic instantly sees blood type, allergies, medications. Life saved!"*

**Point out**:
- Blood Type: AB+
- Allergies: Penicillin, Bee stings
- Emergency Contact: John Doe

---

### Step 5: Demonstrate Single-Use Security

Say: *"What if someone tries to reuse the BurstKey?"*

```bash
# Run the same command again
curl -X POST http://localhost:5001/api/emergency/access-capsule \
  -H "Content-Type: application/json" \
  -d '{
    "burstKey": "YOUR_BURST_KEY_HERE",
    "medicId": "paramedic_mike"
  }'
```

**Expected**: 403 Forbidden - "BurstKey already consumed"
**Say**: *"Single-use enforcement. Security and privacy protected."*

---

### Step 6: Show Audit Trail

```bash
curl http://localhost:5001/api/capsules/cap_1/audit
```

**Expected**: Complete access log
**Say**: *"Every access is logged. Complete transparency and compliance."*

---

### Step 7: Show Blockchain Transactions

```bash
curl http://localhost:5001/api/capsules/cap_1/transactions
```

**Expected**: Transaction hashes and blockchain IDs
**Say**: *"Here are the actual blockchain transactions. Let me show you on the explorer."*

**Browser**: Copy a TX hash and open:
`https://bdagscan.com/awakening/tx/PASTE_TX_HASH_HERE`

---

### Step 8: Show Queue System (Technical Excellence)

```bash
curl http://localhost:5001/api/queue/status
```

**Expected**: Queue statistics
**Say**: *"Our queue system handles blockchain operations in the background. Production-ready architecture."*

---

## 🎯 Key Talking Points

### For Each Step:

1. **Instant Responses** → "Notice how fast? No waiting for blockchain."
2. **Real Blockchain** → "Not simulated. Real transactions on BlockDAG."
3. **Security First** → "Encryption + Single-use + Audit trail."
4. **Life-Saving** → "In an emergency, every second counts."
5. **Production Ready** → "This is deployable today."

---

## 🏆 Closing Statement

> "EverGuard demonstrates the perfect balance of security and accessibility. We built a production-ready system that saves lives while leveraging BlockDAG's capabilities. Real blockchain. Real encryption. Real impact."

---

## 🔧 Troubleshooting

### If server is not running:
```bash
cd server
node server.js
```

### If port 5001 is in use:
```bash
# Stop existing process
Get-Process node | Stop-Process -Force

# Restart
cd server
node server.js
```

### Check server health:
```bash
curl http://localhost:5001/health
```

Expected: `{"status":"healthy",...}`

---

## 📱 Alternative: PowerShell Demo (Windows)

### All-in-One Demo Script
```bash
powershell -ExecutionPolicy Bypass -File FINAL_BLOCKCHAIN_TEST.ps1
```

This runs the complete demo automatically!

---

## 🎥 Video Recording Tips

1. **Split screen**: Code editor + Terminal
2. **Zoom in**: Make text readable
3. **Slow down**: Speak clearly, pause between commands
4. **Highlight**: Point out instant responses
5. **Show explorer**: Prove blockchain is real

---

## ⏱️ Timing Guide

| Step | Duration | Total |
|------|----------|-------|
| Intro + Show Contract | 15s | 0:15 |
| Create Capsule | 25s | 0:40 |
| Request Access | 20s | 1:00 |
| Access Data | 20s | 1:20 |
| Show Security | 15s | 1:35 |
| Audit + Blockchain | 20s | 1:55 |
| Closing | 5s | 2:00 |

---

**Ready to win! 🏆**

