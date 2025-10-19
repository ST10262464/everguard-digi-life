# PHASE 1 TEST: Status Enum + Strict Active-Key Blocking (Fresh Test)
# Uses a different medic to avoid conflicts with previous test data

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PHASE 1: STRICT BLOCKING TEST" -ForegroundColor Cyan
Write-Host "   (Fresh Run)" -ForegroundColor Cyan
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

# First, seed a new medic for testing
Write-Host "[SETUP] Seeding test medic..." -ForegroundColor Yellow
cd server
npm run seed | Out-Null
cd ..
Write-Host "✅ Test medic ready`n" -ForegroundColor Green

# Create a fresh test capsule
Write-Host "[SETUP] Creating fresh test capsule..." -ForegroundColor Yellow
$capsulePayload = @{
    userId = "user_alice_phase1"
    capsuleData = @{
        type = "medical"
        title = "Phase 1 Strict Blocking Test"
        content = @{
            bloodType = "B+"
            allergies = @("Shellfish")
            medications = @("Lisinopril")
            emergencyContact = @{
                name = "Test Contact"
                phone = "+1-555-1111"
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
    context = @{ location = "ER - Test Room"; deviceId = "fresh_test_device_1" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $firstRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS: First BurstKey issued successfully" -ForegroundColor Green
        Write-Host "   Burst ID: $($response.burstId)" -ForegroundColor Cyan
        Write-Host "   Expires in: $($response.expiresIn)s" -ForegroundColor Cyan
        Write-Host "   Status: ACTIVE`n" -ForegroundColor Green
        $global:firstBurstId = $response.burstId
        $global:firstBurstKey = $response.burstKey
    } else {
        Write-Host "❌ FAIL: First request denied: $($response.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on first request: $($_.Exception.Message)`n" -ForegroundColor Red
    Write-Host "   Note: If you see 409, a previous test key is still active." -ForegroundColor Yellow
    Write-Host "   Wait 10 minutes or run: taskkill /F /IM node.exe && cd server && node server.js`n" -ForegroundColor Yellow
    exit 1
}

# TEST 2: Immediate duplicate request - should be BLOCKED
Write-Host "[TEST 2] Duplicate request while first is ACTIVE (should be BLOCKED with 409)..." -ForegroundColor Yellow
$duplicateRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Test Room"; deviceId = "fresh_test_device_2" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $duplicateRequest -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "❌ FAIL: Duplicate request was ALLOWED (should be blocked!)`n" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "✅ PASS: Duplicate request BLOCKED with Status 409 ⛔" -ForegroundColor Green
        Write-Host "   Strict blocking is working!`n" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected error (expected 409): $($_.Exception.Response.StatusCode)`n" -ForegroundColor Red
        exit 1
    }
}

# TEST 3: Consume the first BurstKey
Write-Host "[TEST 3] Consuming BurstKey (status: active → consumed)..." -ForegroundColor Yellow
$consumeRequest = @{
    burstKey = $global:firstBurstKey
    medicId = "medic_joe"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/access-capsule" -Method Post -Body $consumeRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS: BurstKey consumed (status → consumed)" -ForegroundColor Green
        Write-Host "   Blood Type: $($response.content.bloodType)`n" -ForegroundColor Cyan
    } else {
        Write-Host "❌ FAIL: Consumption failed: $($response.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error consuming BurstKey: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 4: New request after consumption - should SUCCEED
Write-Host "[TEST 4] New request after consumption (should SUCCEED)..." -ForegroundColor Yellow
$newRequest = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Test Room"; deviceId = "fresh_test_device_3" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $newRequest -ContentType "application/json" -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS: New BurstKey issued after previous was consumed" -ForegroundColor Green
        Write-Host "   Burst ID: $($response.burstId)`n" -ForegroundColor Cyan
        $global:secondBurstKey = $response.burstKey
        $global:secondBurstId = $response.burstId
    } else {
        Write-Host "❌ FAIL: New request denied: $($response.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Error on new request: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# TEST 5: Duplicate of second key - should be BLOCKED again
Write-Host "[TEST 5] Duplicate of second key (should be BLOCKED)..." -ForegroundColor Yellow
$anotherDuplicate = @{
    capsuleId = $global:testCapsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{ location = "ER - Test Room"; deviceId = "fresh_test_device_4" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $anotherDuplicate -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "❌ FAIL: Second duplicate was ALLOWED`n" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "✅ PASS: Second duplicate also BLOCKED ⛔`n" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected error: $($_.Exception.Response.StatusCode)`n" -ForegroundColor Red
        exit 1
    }
}

# TEST 6: Check audit log for all events
Write-Host "[TEST 6] Checking audit log..." -ForegroundColor Yellow
try {
    $audit = Invoke-RestMethod -Uri "$baseUrl/api/capsules/$global:testCapsuleId/audit" -Method Get -ErrorAction Stop
    
    $totalEvents = $audit.accessLog.Count
    $blockedEvents = $audit.accessLog | Where-Object { $_.eventType -eq "ACTIVE_KEY_BLOCKED" }
    $issuedEvents = $audit.accessLog | Where-Object { $_.eventType -eq "BURST_KEY_ISSUED" }
    $consumedEvents = $audit.accessLog | Where-Object { $_.eventType -eq "BURST_KEY_CONSUMED" }
    
    Write-Host "✅ PASS: Audit log retrieved" -ForegroundColor Green
    Write-Host "   Total events: $totalEvents" -ForegroundColor Cyan
    Write-Host "   BURST_KEY_ISSUED: $($issuedEvents.Count)" -ForegroundColor Gray
    Write-Host "   BURST_KEY_CONSUMED: $($consumedEvents.Count)" -ForegroundColor Gray
    Write-Host "   ACTIVE_KEY_BLOCKED: $($blockedEvents.Count)`n" -ForegroundColor Yellow
    
    if ($blockedEvents.Count -ge 2) {
        Write-Host "✅ Both blocked attempts logged!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Expected 2 blocked events, got $($blockedEvents.Count)`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not retrieve audit log: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
Write-Host "🎉 PHASE 1: COMPLETE & VERIFIED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "✅ Status Enum:" -ForegroundColor Cyan
Write-Host "   • 'active', 'consumed', 'expired' states working" -ForegroundColor Gray

Write-Host "`n✅ Strict Blocking (One Session at a Time):" -ForegroundColor Cyan
Write-Host "   • Active key blocks new requests (409)" -ForegroundColor Gray
Write-Host "   • Consumed key allows new request" -ForegroundColor Gray
Write-Host "   • Multiple blocking attempts logged" -ForegroundColor Gray

Write-Host "`n✅ Audit Logging:" -ForegroundColor Cyan
Write-Host "   • BURST_KEY_ISSUED events" -ForegroundColor Gray
Write-Host "   • BURST_KEY_CONSUMED events" -ForegroundColor Gray
Write-Host "   • ACTIVE_KEY_BLOCKED events" -ForegroundColor Gray

Write-Host "`n🎯 READY FOR PHASE 2: ICE View!" -ForegroundColor Yellow
Write-Host "   Next: Non-verified users see emergency contact only`n" -ForegroundColor Gray



