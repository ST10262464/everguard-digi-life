# 🧪 USER SWITCHING & AUDIT LOG TEST PLAN

## ✅ **FIXES APPLIED:**

### 1. **User Switcher Now Actually Works!**
   - **Before**: Switcher was cosmetic only - didn't change API calls
   - **After**: Switcher now passes selected user's credentials to API
   - **Effect**: Each user role will get different API responses

### 2. **Dynamic User in API Calls**
   - `EmergencyAccess.tsx`: Now uses `currentUser.medicId` instead of hardcoded "medic_joe"
   - `EmergencyScan.tsx`: Now uses `currentUser.medicId` instead of hardcoded "medic_emergency"
   - All context data now includes user's role

### 3. **Page Reloads on User Switch**
   - Switching users in Emergency Access triggers a re-render
   - All data is fetched fresh with new user credentials
   - State resets to show loading indicator

### 4. **Visual Indicators**
   - User name badge displayed in Emergency Access header
   - "Scanning as: [Name]" shown in QR scanner
   - Makes it crystal clear which user is active

### 5. **Demo Page Deleted**
   - Removed `/demo` route as requested
   - Deleted `src/pages/Demo.tsx`

---

## 🧑‍⚕️ **HOW TO TEST:**

### **A. Test via Dashboard → Emergency Access:**

1. **Start on Dashboard** (after clicking "Get Started")
   - You'll see user switcher in top-right

2. **Switch to "Dr. Joe" (Verified Medic)**
   - Click Emergency Access tile
   - Should see: "Accessing as: Dr. Joe (verified_medic)"
   - Should get full access with BurstKey

3. **Go back, Switch to "Random Bystander"**
   - Click Emergency Access tile again
   - Should see: "Accessing as: Random Bystander (non_verified)"
   - Should get ICE view only (limited data)

4. **Check Audit Log:**
   - Go back to Dashboard
   - Click on Medical Capsule
   - Click "History" tab
   - Should see both access attempts logged

### **B. Test via `/emergency-scan` Page:**

1. **Navigate to** `http://localhost:8080/emergency-scan`
   - User switcher in top-right

2. **Switch to different users and scan `cap_1`:**
   - Dr. Joe → Full access
   - Random Bystander → ICE view only
   - Hacker Bob → Denied/ICE view

3. **Check Audit Log** after each scan

---

## 🔍 **WHAT TO VERIFY:**

### ✅ **Audit Log Should Show:**
- ✅ `BURST_KEY_ISSUED` - When verified medic requests access
- ✅ `BURST_KEY_CONSUMED` - When verified medic accesses capsule
- ✅ `RESTRICTED_ACCESS_ATTEMPT` - When non-verified user tries to access
- ✅ `ACTIVE_KEY_BLOCKED` - If medic tries to request 2nd key while 1st is active

### ✅ **User Behavior:**
- **Dr. Joe (Verified):**
  - ✅ Gets full BurstKey
  - ✅ Sees all medical data
  - ✅ Logged as `BURST_KEY_ISSUED` + `BURST_KEY_CONSUMED`

- **Random Bystander (Non-Verified):**
  - ✅ Gets ICE view only
  - ✅ Sees emergency contact only
  - ✅ Logged as `RESTRICTED_ACCESS_ATTEMPT` with reason "Not in medic registry"

- **Hacker Bob (Non-Verified):**
  - ✅ Gets ICE view only
  - ✅ Sees emergency contact only
  - ✅ Logged as `RESTRICTED_ACCESS_ATTEMPT`

---

## 🐛 **DEBUGGING:**

### **If audit log is empty:**
1. Check server console for `📝 [AUDIT]` logs
2. Verify Firebase connection (should see `✅ [FIREBASE] Initialized`)
3. Check Firestore console: `auditLog` collection should have entries

### **If all users get same response:**
1. Check browser console for user info in requests
2. Check server logs - should show different `medicId` values
3. Verify `medicRegistry` collection in Firestore has `medic_joe` entry

### **If page doesn't reload on user switch:**
1. Check browser console for errors
2. Verify UserRoleSwitcher is calling the updated `onUserChange` handler

---

## 📊 **EXPECTED FIRESTORE DATA:**

### **Collection: `auditLog`**
```json
{
  "eventType": "BURST_KEY_ISSUED",
  "capsuleId": "cap_1",
  "accessorId": "medic_joe",
  "timestamp": "2025-10-19T...",
  "status": "granted",
  "burstId": "burst_abc123",
  "expiresAt": "...",
  "txHash": "0x..."
}

{
  "eventType": "RESTRICTED_ACCESS_ATTEMPT",
  "capsuleId": "cap_1",
  "accessorId": "random_scanner",
  "timestamp": "2025-10-19T...",
  "status": "denied",
  "reason": "Not in medic registry"
}
```

---

## ✅ **SUCCESS CRITERIA:**
- ✅ Switching users triggers immediate re-render
- ✅ API calls use correct user credentials
- ✅ Different responses for verified vs non-verified
- ✅ All attempts logged to Firestore `auditLog`
- ✅ History tab shows all events
- ✅ User badge/name visible in UI

---

🚀 **Try it now and let me know what you see!**


