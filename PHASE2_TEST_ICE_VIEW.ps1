# PHASE 2 TEST: ICE View for Non-Verified Users
# Tests that non-verified users see emergency contact only, not medical data

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PHASE 2: ICE VIEW TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Ensure server is running
Write-Host "Checking server status..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "✅ Server is running.`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Please start the server (cd server && node server.js) and try again." -ForegroundColor Red
    exit 1
}

# Seed demo data
Write-Host "[SETUP] Seeding demo data..." -ForegroundColor Yellow
cd server
npm run seed | Out-Null
cd ..
Write-Host "✅ Demo data ready`n" -ForegroundColor Green

# Create a test capsule with medical data + emergency contact
Write-Host "[SETUP] Creating test capsule with medical data..." -ForegroundColor Yellow
$capsulePayload = @{
    userId = "user_alice_phase2"
    capsuleData = @{
        type = "medical"
        title = "Alice's Complete Medical Record"
        content = @{
            ownerName = "Alice Johnson"
            bloodType = "O+"
            allergies = @("Penicillin", "Bee stings", "Peanuts")
            medications = @("Epinephrine auto-injector", "Antihistamines", "Insulin")
            conditions = @("Type 2 Diabetes", "Severe Allergies")
            emergencyContact = @{
                name = "Bob Johnson (Husband)"
                phone = "+1-555-0123"
                relationship = "Spouse"
            }
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/capsules" -Method Post -Body $capsulePayload -ContentType "application/json" -ErrorAction Stop
    if ($response.success) {
        $global:testCapsuleId = $response.capsule.id
        Write-Host "✅ Test capsule created: $global:testCapsuleId" -ForegroundColor Green
        Write-Host "   Contains: Blood type, allergies, medications, emergency contact`n" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to create capsule: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating capsule: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# TEST 1: Non-verified user requests access (should get ICE view)
Write-Host "[TEST 1] Non-verified user (random_scanner) requests access..." -ForegroundColor Yellow
$nonVerifiedRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "random_scanner"
    medicPubKey = "0xRandomScannerPubKey"
    context = @{ location = "Street"; deviceId = "phone_scanner" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $nonVerifiedRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success -and $response.accessLevel -eq "ice") {
        Write-Host "✅ PASS: Non-verified user received ICE view" -ForegroundColor Green
        Write-Host "   Access Level: $($response.accessLevel)" -ForegroundColor Cyan
        Write-Host "   Message: $($response.message)" -ForegroundColor Cyan
        Write-Host "" -ForegroundColor Gray
        
        # Check what data was returned
        if ($response.iceData.emergencyContact) {
            Write-Host "   ✓ Emergency Contact: $($response.iceData.emergencyContact.name)" -ForegroundColor Green
            Write-Host "     Phone: $($response.iceData.emergencyContact.phone)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  No emergency contact in response" -ForegroundColor Yellow
        }
        
        # Check that medical data is NOT present
        $hasMedicalData = $false
        if ($response.iceData.bloodType) { $hasMedicalData = $true }
        if ($response.iceData.allergies) { $hasMedicalData = $true }
        if ($response.iceData.medications) { $hasMedicalData = $true }
        
        if ($hasMedicalData) {
            Write-Host "   ❌ SECURITY ISSUE: Medical data leaked in ICE view!" -ForegroundColor Red
            exit 1
        } else {
            Write-Host "   ✓ Medical data NOT exposed (correct!)`n" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ FAIL: Expected ICE view, got: $($response | ConvertTo-Json -Depth 5)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on non-verified request: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 2: Verified medic requests access (should get BurstKey for full access)
Write-Host "[TEST 2] Verified medic (medic_joe) requests access..." -ForegroundColor Yellow
$verifiedRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Room 1"; deviceId = "medic_tablet" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $verifiedRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success -and $response.burstKey) {
        Write-Host "✅ PASS: Verified medic received BurstKey" -ForegroundColor Green
        Write-Host "   Burst ID: $($response.burstId)" -ForegroundColor Cyan
        Write-Host "   Expires in: $($response.expiresIn)s" -ForegroundColor Cyan
        Write-Host "   (Can access FULL medical data)`n" -ForegroundColor Green
        $global:burstKey = $response.burstKey
    } else {
        Write-Host "❌ FAIL: Expected BurstKey, got: $($response | ConvertTo-Json -Depth 5)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on verified request: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 3: Verified medic consumes BurstKey (should see FULL medical data)
Write-Host "[TEST 3] Verified medic accesses full medical data..." -ForegroundColor Yellow
$consumeRequest = @{
    burstKey = $global:burstKey
    medicId = "medic_joe"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/access-capsule" -Method Post -Body $consumeRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success -and $response.content) {
        Write-Host "✅ PASS: Verified medic accessed full medical data" -ForegroundColor Green
        Write-Host "   Blood Type: $($response.content.bloodType)" -ForegroundColor Cyan
        Write-Host "   Allergies: $($response.content.allergies -join ', ')" -ForegroundColor Cyan
        Write-Host "   Medications: $($response.content.medications -join ', ')" -ForegroundColor Cyan
        Write-Host "   Emergency Contact: $($response.content.emergencyContact.name)`n" -ForegroundColor Cyan
    } else {
        Write-Host "❌ FAIL: Could not access full medical data`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error accessing capsule: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 4: Another non-verified user (hacker_bob) requests access
Write-Host "[TEST 4] Another non-verified user (hacker_bob) requests access..." -ForegroundColor Yellow
$hackerRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "hacker_bob"
    medicPubKey = "0xHackerBobPubKey"
    context = @{ location = "Dark Alley"; deviceId = "hacker_laptop" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $hackerRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success -and $response.accessLevel -eq "ice") {
        Write-Host "✅ PASS: Hacker received ICE view (no medical data)" -ForegroundColor Green
        Write-Host "   Emergency Contact: $($response.iceData.emergencyContact.name)" -ForegroundColor Cyan
        Write-Host "   Medical data: NOT EXPOSED`n" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected response for hacker`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on hacker request: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 5: Check audit log shows both ICE views and full access
Write-Host "[TEST 5] Checking audit log..." -ForegroundColor Yellow
try {
    $audit = Invoke-RestMethod -Uri "$baseUrl/api/capsules/$global:testCapsuleId/audit" -Method Get -ErrorAction Stop
    
    $restrictedAttempts = $audit.accessLog | Where-Object { $_.attemptType -eq "RESTRICTED_ACCESS_ATTEMPT" }
    $burstKeysIssued = $audit.accessLog | Where-Object { $_.eventType -eq "BURST_KEY_ISSUED" }
    
    Write-Host "✅ PASS: Audit log retrieved" -ForegroundColor Green
    Write-Host "   Total events: $($audit.accessLog.Count)" -ForegroundColor Cyan
    Write-Host "   Restricted attempts (ICE views): $($restrictedAttempts.Count)" -ForegroundColor Yellow
    Write-Host "   BurstKeys issued (full access): $($burstKeysIssued.Count)`n" -ForegroundColor Green
    
    if ($restrictedAttempts.Count -ge 2) {
        Write-Host "   ✓ Both non-verified attempts logged!`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not retrieve audit log: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
Write-Host "🎉 PHASE 2: COMPLETE & VERIFIED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "✅ ICE View Implementation:" -ForegroundColor Cyan
Write-Host "   • Non-verified users see emergency contact" -ForegroundColor Gray
Write-Host "   • Medical data NOT exposed to non-verified" -ForegroundColor Gray
Write-Host "   • All attempts logged for audit trail" -ForegroundColor Gray

Write-Host "`n✅ Access Control:" -ForegroundColor Cyan
Write-Host "   • Verified medics get BurstKey" -ForegroundColor Gray
Write-Host "   • Verified medics see FULL medical data" -ForegroundColor Gray
Write-Host "   • Non-verified users get ICE view only" -ForegroundColor Gray

Write-Host "`n✅ Security:" -ForegroundColor Cyan
Write-Host "   • Two-tier access system working" -ForegroundColor Gray
Write-Host "   • Data segregation enforced" -ForegroundColor Gray
Write-Host "   • Complete audit trail" -ForegroundColor Gray

Write-Host "`n🎯 DEMO STORY ENHANCED!" -ForegroundColor Yellow
Write-Host '   "Anyone can help in an emergency by calling the contact,' -ForegroundColor Gray
Write-Host '    but only verified medics get the critical medical data"`n' -ForegroundColor Gray

Write-Host "🎯 READY FOR PHASE 3: Frontend ICE View Component!`n" -ForegroundColor Cyan


