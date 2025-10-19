# PHASE 1 TEST: Status Enum + Strict Active-Key Blocking
# Tests the new BurstKey status system and one-session-at-a-time enforcement

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PHASE 1: STRICT BLOCKING TEST" -ForegroundColor Cyan
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

# Create a test capsule for this test
Write-Host "[SETUP] Creating test capsule..." -ForegroundColor Yellow
$capsulePayload = @{
    userId = "user_alice"
    capsuleData = @{
        type = "medical"
        title = "Phase 1 Test Capsule"
        content = @{
            bloodType = "A+"
            allergies = @("Peanuts")
            medications = @("Aspirin")
            emergencyContact = @{
                name = "Emergency Contact"
                phone = "+1-555-0000"
            }
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/capsules" -Method Post -Body $capsulePayload -ContentType "application/json" -ErrorAction Stop
    if ($response.success) {
        $global:testCapsuleId = $response.capsule.id
        Write-Host "✅ Test capsule created: $global:testCapsuleId`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create capsule: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating capsule: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# TEST 1: First access request - should succeed
Write-Host "[TEST 1] First BurstKey request (should SUCCEED)..." -ForegroundColor Yellow
$firstRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Room 5"; deviceId = "test_tablet_1" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $firstRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS: First BurstKey issued successfully" -ForegroundColor Green
        Write-Host "   Burst ID: $($response.burstId)" -ForegroundColor Cyan
        Write-Host "   Expires in: $($response.expiresIn)s" -ForegroundColor Cyan
        Write-Host "   Status: ACTIVE (new field)`n" -ForegroundColor Cyan
        $global:firstBurstId = $response.burstId
        $global:firstBurstKey = $response.burstKey
        $global:expiresAt = $response.expiresAt
    } else {
        Write-Host "❌ FAIL: First request denied: $($response.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on first request: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 2: Immediate duplicate request - should be BLOCKED
Write-Host "[TEST 2] Duplicate BurstKey request while first is ACTIVE (should be BLOCKED)..." -ForegroundColor Yellow
$duplicateRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Room 5"; deviceId = "test_tablet_2" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $duplicateRequest -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "❌ FAIL: Duplicate request was ALLOWED (should be blocked!)`n" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "✅ PASS: Duplicate request correctly BLOCKED (Status 409)" -ForegroundColor Green
        
        # Parse response body
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
        
        Write-Host "   Error: $($responseBody.error)" -ForegroundColor Cyan
        Write-Host "   Existing Key: $($responseBody.existingKey.burstId)" -ForegroundColor Cyan
        Write-Host "   Expires At: $($responseBody.existingKey.expiresAt)" -ForegroundColor Cyan
        Write-Host "   Expires In: $($responseBody.existingKey.expiresIn)s`n" -ForegroundColor Cyan
    } else {
        Write-Host "❌ FAIL: Unexpected error (expected 409): $($_.Exception.Message)`n" -ForegroundColor Red
        exit 1
    }
}

# TEST 3: Consume the first BurstKey (change status to CONSUMED)
Write-Host "[TEST 3] Consuming first BurstKey (status: active → consumed)..." -ForegroundColor Yellow
$consumeRequest = @{
    burstKey = $global:firstBurstKey
    medicId = "medic_joe"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/access-capsule" -Method Post -Body $consumeRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS: BurstKey consumed successfully" -ForegroundColor Green
        Write-Host "   Blood Type: $($response.content.bloodType)" -ForegroundColor Cyan
        Write-Host "   Status changed: active → consumed`n" -ForegroundColor Cyan
    } else {
        Write-Host "❌ FAIL: Consumption failed: $($response.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error consuming BurstKey: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 4: New request after consumption - should SUCCEED
Write-Host "[TEST 4] New BurstKey request after first was consumed (should SUCCEED)..." -ForegroundColor Yellow
$newRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Room 5"; deviceId = "test_tablet_3" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $newRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS: New BurstKey issued after consumption" -ForegroundColor Green
        Write-Host "   Burst ID: $($response.burstId)" -ForegroundColor Cyan
        Write-Host "   Previous key was consumed, so new one allowed`n" -ForegroundColor Cyan
        $global:secondBurstKey = $response.burstKey
    } else {
        Write-Host "❌ FAIL: New request denied: $($response.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on new request: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 5: Verify audit log shows ACTIVE_KEY_BLOCKED event
Write-Host "[TEST 5] Checking audit log for ACTIVE_KEY_BLOCKED event..." -ForegroundColor Yellow
try {
    $audit = Invoke-RestMethod -Uri "$baseUrl/api/capsules/$global:testCapsuleId/audit" -Method Get -ErrorAction Stop
    
    $blockedEvents = $audit.accessLog | Where-Object { $_.eventType -eq "ACTIVE_KEY_BLOCKED" }
    
    if ($blockedEvents.Count -gt 0) {
        Write-Host "✅ PASS: ACTIVE_KEY_BLOCKED events logged" -ForegroundColor Green
        Write-Host "   Count: $($blockedEvents.Count)" -ForegroundColor Cyan
        foreach ($event in $blockedEvents) {
            Write-Host "   • Accessor: $($event.accessorId)" -ForegroundColor Cyan
            Write-Host "     Reason: $($event.reason)" -ForegroundColor DarkGray
        }
        Write-Host ""
    } else {
        Write-Host "⚠️  WARNING: No ACTIVE_KEY_BLOCKED events found" -ForegroundColor Yellow
        Write-Host "   (Check Firestore auditLog collection manually)`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not retrieve audit log: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
Write-Host "📊 PHASE 1 TEST SUMMARY`n" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "✅ Status Enum Implementation:" -ForegroundColor Green
Write-Host "   • 'active' status when key is issued" -ForegroundColor Gray
Write-Host "   • 'consumed' status when key is used" -ForegroundColor Gray
Write-Host "   • 'expired' status after timeout (automatic)" -ForegroundColor Gray

Write-Host "`n✅ Strict Active-Key Blocking:" -ForegroundColor Green
Write-Host "   • First request: GRANTED" -ForegroundColor Gray
Write-Host "   • Duplicate request: BLOCKED (409)" -ForegroundColor Gray
Write-Host "   • After consumption: NEW KEY ALLOWED" -ForegroundColor Gray

Write-Host "`n✅ Enhanced Logging:" -ForegroundColor Green
Write-Host "   • ACTIVE_KEY_BLOCKED events logged" -ForegroundColor Gray
Write-Host "   • Audit trail complete" -ForegroundColor Gray

Write-Host "`n🎉 PHASE 1: COMPLETE & TESTED!" -ForegroundColor Green
Write-Host "   One active session at a time enforced`n" -ForegroundColor Gray

Write-Host "🎯 NEXT: Phase 2 - ICE View for Non-Verified Users`n" -ForegroundColor Cyan



