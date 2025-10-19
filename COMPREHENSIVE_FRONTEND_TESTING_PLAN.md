# 🧪 Comprehensive Frontend Testing Plan

**Purpose**: Verify all Phase 3 enhancements and ensure complete EverGuard frontend functionality  
**Test Environment**: `http://localhost:5173` (Frontend) + `http://localhost:5001` (Backend API)  
**Duration**: ~30-45 minutes

---

## 🚀 Pre-Test Setup

### 1. Start Services
```powershell
# Terminal 1: Backend (if not already running)
cd server
node server.js

# Terminal 2: Frontend (already running)
npm run dev
```

### 2. Seed Demo Data
```powershell
cd server
npm run seed
cd ..
```

### 3. Create Test Capsule via API
```powershell
.\create-test-capsule.ps1
```

---

## 📋 Test Suite

### ✅ PHASE 0: Basic Functionality

#### Test 1.1: Homepage Load
- [ ] Navigate to `http://localhost:5173`
- [ ] Verify Welcome page loads
- [ ] Check hero image displays
- [ ] Verify "Get Started" button works

**Expected**: Clean, professional landing page

#### Test 1.2: Dashboard Navigation
- [ ] Click "Get Started" or navigate to Dashboard
- [ ] Verify all 6 capsule types display:
  - Medical (Heart icon, red gradient)
  - Legal & Will (Scale icon, purple gradient)
  - Financial (Wallet icon, green gradient)
  - Education (GraduationCap icon)
  - Safety & GBV (Shield icon)
  - Legacy (Heart icon)
- [ ] Check hover effects work
- [ ] Verify responsive design (resize browser)

**Expected**: All capsules visible with proper styling

---

### ✅ PHASE 1 & 2: Backend Integration

#### Test 2.1: Capsule Detail View
- [ ] Click on "Medical Capsule"
- [ ] Verify capsule detail page loads
- [ ] Check all 4 tabs present:
  - Overview
  - QR Code
  - Permissions
  - History

**Expected**: Capsule detail page with tabbed navigation

#### Test 2.2: Overview Tab
- [ ] Verify emergency information card displays
- [ ] Check blood type shows: "O+"
- [ ] Verify emergency contact displays
- [ ] Check allergies section (Penicillin, Peanuts)
- [ ] Verify medications section
- [ ] Check conditions section

**Expected**: Complete medical information displayed in organized cards

#### Test 2.3: QR Code Tab
- [ ] Click "QR Code" tab
- [ ] Wait for QR code to load (~2 seconds)
- [ ] Verify QR code image displays
- [ ] Check "Download QR Code" button works
- [ ] Try "Print QR Code" button (opens print dialog)
- [ ] Verify tip card shows at bottom

**Expected**: QR code loads and can be downloaded/printed

#### Test 2.4: Permissions Tab
- [ ] Click "Permissions" tab
- [ ] Verify 3 permission cards display:
  - Dr. Sarah Johnson (Full Access, Active)
  - City General Hospital (Emergency Only, Active)
  - John Doe (View Only, Pending)
- [ ] Check status badges display correctly
- [ ] Hover over badges to see tooltips

**Expected**: Permission cards with proper status indicators

---

### ✅ PHASE 3: New Features

#### Test 3.1: Enhanced Audit Timeline (NEW)
- [ ] Click "History" tab
- [ ] Wait for audit log to load from API
- [ ] Verify new timeline design with:
  - Icons for each event type
  - Color-coded events
  - Relative timestamps ("2h ago", etc.)
  - Event details (accessor, location)
- [ ] Check scroll area works (if many events)
- [ ] Verify different event types:
  - 🟢 BURST_KEY_ISSUED (green)
  - 🔵 BURST_KEY_CONSUMED (blue)
  - 🟠 RESTRICTED_ACCESS_ATTEMPT (orange)
  - 🔴 ACTIVE_KEY_BLOCKED (red)

**Expected**: Visual timeline with color-coded events and full details

#### Test 3.2: Status Badge Components (NEW)
- [ ] Go back to "Permissions" tab
- [ ] Verify status badges use new design:
  - Active: Green with Shield icon
  - Consumed: Blue with CheckCircle icon
  - Expired: Gray with XCircle icon
- [ ] Hover over badges to see tooltips
- [ ] Check tooltips show appropriate information

**Expected**: Color-coded status badges with icons and helpful tooltips

#### Test 3.3: Emergency Fields Helper (NEW)
**Note**: This component should be visible when creating a new capsule

- [ ] Go back to Dashboard
- [ ] Look for "Create Capsule" or similar button
- [ ] Check if Emergency Fields Helper displays
- [ ] Verify 6 suggested fields:
  - Blood Type (CRITICAL badge)
  - Allergies (CRITICAL badge)
  - Current Medications (CRITICAL badge)
  - Medical Conditions (CRITICAL badge)
  - Emergency Contact (CRITICAL badge)
  - Patient Name
- [ ] Check hover effects on field cards
- [ ] Verify icons display correctly
- [ ] Check example text shows

**Expected**: Helpful field suggestions with examples and critical indicators

---

### ✅ ADVANCED: ICE View (NEW)

#### Test 4.1: Test ICE View with API
**Note**: Since ICE view is triggered by API, test it separately

**Terminal Test**:
```powershell
# Test non-verified user access
$request = @{
    capsuleId = "cap_1"
    medicId = "random_scanner"
    medicPubKey = "0xRandomPubKey"
    context = @{ location = "Test"; deviceId = "test" }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/request-access" -Method Post -Body $request -ContentType "application/json"

# Check response
$response | ConvertTo-Json
```

**Expected Response**:
```json
{
  "success": true,
  "accessLevel": "ice",
  "message": "Limited access granted - Emergency contact information only",
  "iceData": {
    "capsuleId": "cap_1",
    "ownerName": "...",
    "emergencyContact": {
      "name": "...",
      "phone": "..."
    }
  }
}
```

#### Test 4.2: ICE View Component Display
**Note**: To test the ICE View component visually, we'd need to integrate it into the emergency access flow

- [ ] The IceView component is ready at `src/components/IceView.tsx`
- [ ] It should display when non-verified users scan QR codes
- [ ] Shows ONLY emergency contact
- [ ] Has "Call Emergency Contact" and "Call 911" buttons
- [ ] Shows restricted access notice

**For full integration**: Would need to add QR scan flow to frontend

---

### ✅ RESPONSIVE DESIGN

#### Test 5.1: Mobile View (< 768px)
- [ ] Resize browser to mobile width (~375px)
- [ ] Verify dashboard grid stacks vertically
- [ ] Check capsule cards remain readable
- [ ] Test navigation still works
- [ ] Verify all buttons are tap-friendly
- [ ] Check audit timeline is scrollable

**Expected**: All content readable and functional on mobile

#### Test 5.2: Tablet View (768px - 1024px)
- [ ] Resize to tablet width (~768px)
- [ ] Verify 2-column grid layout
- [ ] Check spacing is appropriate
- [ ] Test all interactive elements

**Expected**: Optimized tablet layout

#### Test 5.3: Desktop View (> 1024px)
- [ ] Resize to full desktop width
- [ ] Verify proper use of space
- [ ] Check max-width containers
- [ ] Test all layouts

**Expected**: Clean desktop experience with proper spacing

---

### ✅ PERFORMANCE & ERROR HANDLING

#### Test 6.1: Loading States
- [ ] Refresh page and observe loading indicators
- [ ] Check QR code loading spinner
- [ ] Verify audit log loading state
- [ ] Test slow network (throttle in DevTools)

**Expected**: Graceful loading indicators, no blank screens

#### Test 6.2: Error Handling
- [ ] Stop backend server
- [ ] Try to load capsule detail
- [ ] Try to fetch QR code
- [ ] Try to load audit log
- [ ] Restart backend
- [ ] Verify recovery

**Expected**: User-friendly error messages, graceful degradation

#### Test 6.3: Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Check for console errors

**Expected**: Works in all modern browsers

---

### ✅ ACCESSIBILITY

#### Test 7.1: Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Check tab order is logical
- [ ] Test Enter/Space to activate buttons

**Expected**: Full keyboard accessibility

#### Test 7.2: Screen Reader (Optional)
- [ ] Enable screen reader (NVDA/JAWS on Windows)
- [ ] Navigate through page
- [ ] Verify labels are read correctly
- [ ] Check ARIA labels present

**Expected**: Semantic HTML with proper labels

---

### ✅ INTEGRATION WITH BACKEND

#### Test 8.1: API Connection
- [ ] Open Browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Click through different tabs
- [ ] Verify API calls:
  - `GET /api/capsules/cap_1` - 200 OK
  - `GET /api/capsules/cap_1/qrcode` - 200 OK
  - `GET /api/capsules/cap_1/audit` - 200 OK
- [ ] Check response data is correct

**Expected**: All API calls successful, data displays correctly

#### Test 8.2: CORS Configuration
- [ ] Verify no CORS errors in console
- [ ] Check all endpoints accessible
- [ ] Test from both localhost:5173 and localhost:8080

**Expected**: No CORS errors

---

## 🐛 Known Issues to Check

### Potential Issues:
1. **QR Code not loading**: Check backend is running, CORS configured
2. **Audit log empty**: Run seed script, create test capsule
3. **Status badges not showing**: Check BurstKey data has `status` field
4. **Timeline not rendering**: Verify audit log API returns proper format
5. **Emergency helper not visible**: May need to add to capsule creation flow

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Phase 0: Basic Functionality
- [ ] Homepage Load: ✅/❌
- [ ] Dashboard Navigation: ✅/❌

### Phase 1 & 2: Backend Integration
- [ ] Capsule Detail View: ✅/❌
- [ ] Overview Tab: ✅/❌
- [ ] QR Code Tab: ✅/❌
- [ ] Permissions Tab: ✅/❌

### Phase 3: New Features
- [ ] Enhanced Audit Timeline: ✅/❌
- [ ] Status Badge Components: ✅/❌
- [ ] Emergency Fields Helper: ✅/❌

### ICE View
- [ ] API Response Correct: ✅/❌
- [ ] Component Ready: ✅/❌

### Responsive Design
- [ ] Mobile View: ✅/❌
- [ ] Tablet View: ✅/❌
- [ ] Desktop View: ✅/❌

### Performance & Errors
- [ ] Loading States: ✅/❌
- [ ] Error Handling: ✅/❌
- [ ] Browser Compatibility: ✅/❌

### Integration
- [ ] API Connection: ✅/❌
- [ ] CORS Configuration: ✅/❌

**Issues Found**: 
[List any issues discovered]

**Overall Status**: ✅ PASS / ❌ FAIL
```

---

## 🎯 Success Criteria

**MUST PASS**:
- ✅ All Phase 0 tests (basic functionality)
- ✅ All Phase 1 & 2 tests (backend integration)
- ✅ At least 80% of Phase 3 tests (new features)
- ✅ Mobile responsiveness
- ✅ No critical console errors
- ✅ API integration working

**NICE TO HAVE**:
- ✅ 100% Phase 3 features working
- ✅ Perfect browser compatibility
- ✅ Full accessibility
- ✅ No performance issues

---

## 🚨 If Tests Fail

### Common Fixes:

1. **Frontend won't start**:
   ```powershell
   npm install
   npm run dev
   ```

2. **Backend not responding**:
   ```powershell
   cd server
   node server.js
   ```

3. **No data showing**:
   ```powershell
   cd server
   npm run seed
   cd ..
   ```

4. **CORS errors**:
   - Check `ALLOWED_ORIGINS` in `.env` includes `http://localhost:5173`
   - Restart backend after changing .env

5. **Components not rendering**:
   - Check browser console for errors
   - Verify imports are correct
   - Check TypeScript compilation

---

## ✅ Final Checklist

After completing all tests:

- [ ] All critical features working
- [ ] No major bugs found
- [ ] Backend API responding correctly
- [ ] Frontend displays all data properly
- [ ] New Phase 3 components integrated
- [ ] Mobile responsive
- [ ] Ready for demo

**If all checked**: 🎉 **READY FOR HACKATHON!** 🏆

---

## 📝 Notes for Demo

Based on testing, prepare to show:
1. ✅ Beautiful dashboard with all capsule types
2. ✅ Complete capsule detail with medical data
3. ✅ QR code generation and download
4. ✅ Enhanced audit timeline with color-coded events
5. ✅ Status badges with tooltips
6. ✅ Emergency fields helper (if integrated)
7. ✅ ICE view for non-verified users (via API demo)

**Backup plan**: If frontend has issues, demo backend API with PowerShell scripts (100% working!)


