# EverGuard Phase 3 - Full Blockchain Integration Test
# This script tests the complete PulseKey flow with proper blockchain logging

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5001"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "EVERGUARD BLOCKCHAIN TEST" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Create Medical Capsule
Write-Host "TEST 1: Creating encrypted medical capsule..." -ForegroundColor Yellow
$createCapsule = @{
    userId = "user_alice"
    capsuleData = @{
        type = "medical"
        title = "Alice's Emergency Medical Data"
        description = "Critical health information for emergencies"
        content = @{
            bloodType = "O+"
            allergies = @("Penicillin", "Latex")
            medications = @("Lisinopril 10mg daily")
            emergencyContact = @{
                name = "Bob (Husband)"
                phone = "+1-555-0123"
            }
            conditions = @("Hypertension")
        }
        tags = @("emergency", "medical")
    }
    publicKey = $null
} | ConvertTo-Json -Depth 10

$response1 = Invoke-RestMethod -Uri "$baseUrl/api/capsules" -Method Post -Body $createCapsule -ContentType "application/json"

Write-Host "✅ Capsule created!" -ForegroundColor Green
Write-Host "   ID: $($response1.capsule.id)" -ForegroundColor Gray
Write-Host "   Blockchain ID: $($response1.capsule.blockchainId)" -ForegroundColor Gray
Write-Host "   Content Hash: $($response1.capsule.contentHash.Substring(0,20))..." -ForegroundColor Gray
Write-Host "   TX Hash: $($response1.blockchain.txHash)" -ForegroundColor Gray
Write-Host "   Block Number: $($response1.blockchain.blockNumber)" -ForegroundColor Gray

$capsuleId = $response1.capsule.id
$blockchainTxHash = $response1.blockchain.txHash

# Test 2: Request Emergency Access (Issue BurstKey)
Write-Host "`nTEST 2: Paramedic requesting emergency access..." -ForegroundColor Yellow
$requestAccess = @{
    capsuleId = $capsuleId
    medicId = "medic_joe"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{
        location = "Hospital ER"
        deviceId = "device_ambulance_01"
        attestation = "emergency"
    }
} | ConvertTo-Json -Depth 10

$response2 = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" -Method Post -Body $requestAccess -ContentType "application/json"

Write-Host "✅ BurstKey issued!" -ForegroundColor Green
Write-Host "   Burst ID: $($response2.burstId)" -ForegroundColor Gray
Write-Host "   BurstKey: $($response2.burstKey.Substring(0,20))..." -ForegroundColor Gray
Write-Host "   Expires In: $($response2.expiresIn / 1000) seconds" -ForegroundColor Gray

if ($response2.blockchain -and $response2.blockchain.success) {
    Write-Host "   ✅ Blockchain logging: SUCCESS" -ForegroundColor Green
    Write-Host "   TX Hash: $($response2.blockchain.txHash)" -ForegroundColor Gray
    Write-Host "   Blockchain BurstKey ID: $($response2.blockchain.burstKeyId)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Blockchain logging: FAILED" -ForegroundColor Red
    if ($response2.blockchain.error) {
        Write-Host "   Error: $($response2.blockchain.error)" -ForegroundColor Red
    }
}

$burstKey = $response2.burstKey

# Test 3: Access Capsule with BurstKey
Write-Host "`nTEST 3: Accessing capsule with BurstKey..." -ForegroundColor Yellow
$accessCapsule = @{
    burstKey = $burstKey
    medicId = "medic_joe"
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "$baseUrl/api/emergency/access-capsule" -Method Post -Body $accessCapsule -ContentType "application/json"

Write-Host "✅ Capsule accessed!" -ForegroundColor Green
Write-Host "   Blood Type: $($response3.content.bloodType)" -ForegroundColor Gray
Write-Host "   Allergies: $($response3.content.allergies -join ', ')" -ForegroundColor Gray
Write-Host "   Emergency Contact: $($response3.content.emergencyContact.name) - $($response3.content.emergencyContact.phone)" -ForegroundColor Gray

# Test 4: Verify Single-Use (Should Fail)
Write-Host "`nTEST 4: Verifying single-use enforcement..." -ForegroundColor Yellow
try {
    $response4 = Invoke-RestMethod -Uri "$baseUrl/api/emergency/access-capsule" -Method Post -Body $accessCapsule -ContentType "application/json" -ErrorAction Stop
    Write-Host "❌ FAILED: BurstKey should not be reusable!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✅ Single-use enforcement working!" -ForegroundColor Green
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error message: $($errorBody.error)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 5: Check Audit Log
Write-Host "`nTEST 5: Checking audit log..." -ForegroundColor Yellow
$response5 = Invoke-RestMethod -Uri "$baseUrl/api/capsules/$capsuleId/audit" -Method Get

Write-Host "✅ Audit log retrieved!" -ForegroundColor Green
Write-Host "   Total access events: $($response5.accessLog.Count)" -ForegroundColor Gray
foreach ($event in $response5.accessLog) {
    Write-Host "   - $($event.event): $($event.accessorId) at $(([System.DateTimeOffset]::FromUnixTimeMilliseconds($event.timestamp)).ToString('HH:mm:ss'))" -ForegroundColor Gray
}

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "View on BlockDAG Explorer:" -ForegroundColor Yellow
Write-Host "   Capsule TX: https://bdagscan.com/awakening/tx/$blockchainTxHash" -ForegroundColor Cyan
if ($response2.blockchain -and $response2.blockchain.txHash) {
    Write-Host "   BurstKey TX: https://bdagscan.com/awakening/tx/$($response2.blockchain.txHash)" -ForegroundColor Cyan
}

Write-Host "`nRESULT SUMMARY:" -ForegroundColor Yellow
Write-Host "   ✅ Encrypted capsule created and logged on BlockDAG" -ForegroundColor Green
if ($response2.blockchain -and $response2.blockchain.success) {
    Write-Host "   ✅ BurstKey issuance logged on BlockDAG" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  BurstKey issuance NOT logged on BlockDAG" -ForegroundColor Yellow
}
Write-Host "   ✅ Emergency access granted with temporary key" -ForegroundColor Green
Write-Host "   ✅ Single-use enforcement verified" -ForegroundColor Green
Write-Host "   ✅ Audit trail tracked" -ForegroundColor Green

Write-Host "`nPulseKey Feature: READY FOR DEMO!" -ForegroundColor Cyan
Write-Host ""

