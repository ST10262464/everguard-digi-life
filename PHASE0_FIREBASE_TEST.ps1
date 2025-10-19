# Phase 0: Firebase Integration Test Script
# Tests Firebase/Firestore integration for EverGuard

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PHASE 0: FIREBASE INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Seed Demo Data
Write-Host "[TEST 1] Seeding demo data to Firebase..." -ForegroundColor Yellow
cd server
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ FAILED: Seed script error" -ForegroundColor Red
    exit 1
}
cd ..
Write-Host "✅ PASS: Demo data seeded successfully`n" -ForegroundColor Green

Start-Sleep -Seconds 2

# Test 2: Start Server (check Firebase initialization)
Write-Host "[TEST 2] Starting server (Firebase should initialize)..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    cd $using:PWD\server
    node server.js
}

Start-Sleep -Seconds 5

# Check if server started successfully
$serverOutput = Receive-Job $serverJob
if ($serverOutput -match "Firebase.*initialized" -or $serverOutput -match "Server running") {
    Write-Host "✅ PASS: Server started with Firebase`n" -ForegroundColor Green
} else {
    Write-Host "❌ FAILED: Server did not initialize Firebase properly" -ForegroundColor Red
    Write-Host "Server output:" -ForegroundColor Yellow
    Write-Host $serverOutput
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

# Test 3: Create Capsule (test Firestore write)
Write-Host "[TEST 3] Creating test capsule (Firestore write)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$capsuleData = @{
    userId = "user_alice"
    type = "medical"
    title = "Alice's Medical Capsule"
    content = @{
        bloodType = "O+"
        allergies = @("Penicillin", "Peanuts")
        medications = @("Lisinopril 10mg", "Metformin 500mg")
        conditions = @("Type 2 Diabetes", "Hypertension")
        emergencyContact = @{
            name = "Jane Doe"
            phone = "+1 (555) 123-4567"
            relationship = "Sister"
        }
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules" `
    -Method POST `
    -ContentType "application/json" `
    -Body $capsuleData `
    -ErrorAction Stop

if ($response.success) {
    Write-Host "✅ PASS: Capsule created in Firestore" -ForegroundColor Green
    Write-Host "   Capsule ID: $($response.capsule.id)" -ForegroundColor Cyan
    $global:testCapsuleId = $response.capsule.id
} else {
    Write-Host "❌ FAILED: Capsule creation failed" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

Start-Sleep -Seconds 3

# Test 4: Retrieve Capsule (test Firestore read)
Write-Host "`n[TEST 4] Retrieving capsule from Firestore..." -ForegroundColor Yellow

$capsule = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/$global:testCapsuleId" `
    -Method GET `
    -ErrorAction Stop

if ($capsule.capsule.id -eq $global:testCapsuleId) {
    Write-Host "✅ PASS: Capsule retrieved from Firestore" -ForegroundColor Green
    Write-Host "   Owner: $($capsule.capsule.ownerId)" -ForegroundColor Cyan
    Write-Host "   Type: $($capsule.capsule.capsuleType)" -ForegroundColor Cyan
} else {
    Write-Host "❌ FAILED: Capsule retrieval failed" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

Start-Sleep -Seconds 2

# Test 5: Issue BurstKey (test Firestore write)
Write-Host "`n[TEST 5] Issuing BurstKey (Firestore write)..." -ForegroundColor Yellow

$burstKeyRequest = @{
    capsuleId = $global:testCapsuleId
    requesterId = "medic_joe"
    context = @{
        location = "ER - Room 3"
        deviceId = "device_123"
    }
} | ConvertTo-Json

$burstResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/request-access" `
    -Method POST `
    -ContentType "application/json" `
    -Body $burstKeyRequest `
    -ErrorAction Stop

if ($burstResponse.success) {
    Write-Host "✅ PASS: BurstKey issued and stored in Firestore" -ForegroundColor Green
    Write-Host "   Burst ID: $($burstResponse.burstId)" -ForegroundColor Cyan
    Write-Host "   Expires in: $($burstResponse.expiresIn) seconds" -ForegroundColor Cyan
    $global:testBurstKey = $burstResponse.burstKey
} else {
    Write-Host "❌ FAILED: BurstKey issuance failed" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

Start-Sleep -Seconds 2

# Test 6: Access Capsule with BurstKey
Write-Host "`n[TEST 6] Accessing capsule with BurstKey..." -ForegroundColor Yellow

$accessRequest = @{
    burstKey = $global:testBurstKey
    requesterId = "medic_joe"
} | ConvertTo-Json

$accessResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/access-capsule" `
    -Method POST `
    -ContentType "application/json" `
    -Body $accessRequest `
    -ErrorAction Stop

if ($accessResponse.success) {
    Write-Host "✅ PASS: Capsule accessed with BurstKey" -ForegroundColor Green
    Write-Host "   Blood Type: $($accessResponse.emergencyData.bloodType)" -ForegroundColor Cyan
    Write-Host "   Allergies: $($accessResponse.emergencyData.allergies -join ', ')" -ForegroundColor Cyan
} else {
    Write-Host "❌ FAILED: Capsule access failed" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

Start-Sleep -Seconds 2

# Test 7: Verify BurstKey Consumed (Firestore update)
Write-Host "`n[TEST 7] Verifying BurstKey marked as consumed..." -ForegroundColor Yellow

try {
    $accessResponse2 = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/access-capsule" `
        -Method POST `
        -ContentType "application/json" `
        -Body $accessRequest `
        -ErrorAction Stop
    
    Write-Host "❌ FAILED: BurstKey was not marked as consumed (should fail on second use)" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
} catch {
    if ($_.Exception.Message -match "already consumed" -or $_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ PASS: BurstKey correctly marked as consumed in Firestore" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        Stop-Job $serverJob
        Remove-Job $serverJob
        exit 1
    }
}

# Test 8: Audit Log Retrieval
Write-Host "`n[TEST 8] Retrieving audit log from Firestore..." -ForegroundColor Yellow

$auditLog = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/$global:testCapsuleId/audit" `
    -Method GET `
    -ErrorAction Stop

if ($auditLog.success -and $auditLog.accessLog.Count -gt 0) {
    Write-Host "✅ PASS: Audit log retrieved from Firestore" -ForegroundColor Green
    Write-Host "   Total access events: $($auditLog.accessCount)" -ForegroundColor Cyan
} else {
    Write-Host "❌ FAILED: Audit log retrieval failed" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Stop-Job $serverJob
Remove-Job $serverJob

# Final Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   PHASE 0: ALL TESTS PASSED ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n📊 Test Results:" -ForegroundColor Cyan
Write-Host "   ✅ Firebase initialization" -ForegroundColor Green
Write-Host "   ✅ Firestore writes (capsules)" -ForegroundColor Green
Write-Host "   ✅ Firestore reads (capsules)" -ForegroundColor Green
Write-Host "   ✅ Firestore writes (burst keys)" -ForegroundColor Green
Write-Host "   ✅ Firestore updates (consumed status)" -ForegroundColor Green
Write-Host "   ✅ Firestore queries (audit log)" -ForegroundColor Green

Write-Host "`n🎯 Ready for Phase 1: Status Enum + Strict Blocking!" -ForegroundColor Cyan
Write-Host "`n"




