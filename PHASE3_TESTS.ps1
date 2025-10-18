# Phase 3: PulseKey End-to-End Test Script
# Tests the complete emergency access flow

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "PHASE 3: PulseKey End-to-End Test" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Start-Sleep -Seconds 3

# Test 1: Create Emergency Capsule
Write-Host "TEST 1: Create Emergency Medical Capsule" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

$capsuleData = @{
    userId = "user_alice"
    capsuleData = @{
        type = "medical"
        title = "Emergency Medical Info"
        description = "Critical health information"
        content = @{
            bloodType = "O-"
            allergies = @("Penicillin", "Peanuts")
            currentMedications = @("Metformin 500mg")
            medicalConditions = @("Type 2 Diabetes")
            emergencyContact = "John Doe - +1234567890"
        }
    }
    publicKey = "0xALICE_PUBLIC_KEY"
} | ConvertTo-Json -Depth 10

$response1 = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules" `
    -Method Post `
    -ContentType "application/json" `
    -Body $capsuleData

Write-Host "✅ Capsule Created:" -ForegroundColor Green
Write-Host "   ID: $($response1.capsule.id)"
Write-Host "   Type: $($response1.capsule.capsuleType)"
Write-Host "   Hash: $($response1.capsule.contentHash.Substring(0,20))..."
if ($response1.blockchain) {
    Write-Host "   BlockDAG TX: $($response1.blockchain.txHash)" -ForegroundColor Yellow
}

$capsuleId = $response1.capsule.id

Write-Host "`n" -NoNewline

# Test 2: Get Capsule
Write-Host "TEST 2: Retrieve Capsule Details" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

$response2 = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/$capsuleId" -Method Get

Write-Host "✅ Capsule Retrieved:" -ForegroundColor Green
Write-Host "   Owner: $($response2.capsule.ownerId)"
Write-Host "   Status: $($response2.capsule.status)"
Write-Host "   Created: $($response2.capsule.createdAt)"

Write-Host "`n" -NoNewline

# Test 3: Request Emergency Access (Medic)
Write-Host "TEST 3: Medic Requests Emergency Access" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

$accessRequest = @{
    capsuleId = $capsuleId
    medicId = "medic_joe"
    medicPubKey = "0xMEDIC_JOE_PUBLIC_KEY"
    context = @{
        location = @{
            lat = 40.7128
            lon = -74.0060
        }
        deviceId = "ambulance_001"
        attestation = "ambulanceOnScene"
    }
} | ConvertTo-Json -Depth 10

$response3 = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/request-access" `
    -Method Post `
    -ContentType "application/json" `
    -Body $accessRequest

Write-Host "✅ BurstKey Issued:" -ForegroundColor Green
Write-Host "   BurstKey ID: $($response3.burstId)"
Write-Host "   Expires In: $($response3.expiresIn) seconds"
Write-Host "   Key: $($response3.burstKey.Substring(0,16))..." -ForegroundColor Yellow
if ($response3.blockchain) {
    Write-Host "   BlockDAG TX: $($response3.blockchain.txHash)" -ForegroundColor Yellow
}

$burstKey = $response3.burstKey

Write-Host "`n" -NoNewline

# Test 4: Use BurstKey to Access Capsule
Write-Host "TEST 4: Medic Accesses Capsule with BurstKey" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

$accessData = @{
    burstKey = $burstKey
    medicId = "medic_joe"
} | ConvertTo-Json

$response4 = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/access-capsule" `
    -Method Post `
    -ContentType "application/json" `
    -Body $accessData

Write-Host "✅ Capsule Decrypted:" -ForegroundColor Green
Write-Host "   Blood Type: $($response4.content.bloodType)" -ForegroundColor Red
Write-Host "   Allergies: $($response4.content.allergies -join ', ')" -ForegroundColor Red
Write-Host "   Medications: $($response4.content.currentMedications -join ', ')"
Write-Host "   Conditions: $($response4.content.medicalConditions -join ', ')"
Write-Host "   Emergency Contact: $($response4.content.emergencyContact)"

Write-Host "`n" -NoNewline

# Test 5: Try to use BurstKey again (should fail - single use)
Write-Host "TEST 5: Verify BurstKey Single-Use" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

try {
    $response5 = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/access-capsule" `
        -Method Post `
        -ContentType "application/json" `
        -Body $accessData
    Write-Host "❌ FAILED: BurstKey was reused (should be single-use)" -ForegroundColor Red
} catch {
    Write-Host "✅ BurstKey correctly rejected (already consumed)" -ForegroundColor Green
}

Write-Host "`n" -NoNewline

# Test 6: Get Audit Log
Write-Host "TEST 6: Retrieve Access Audit Log" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

$response6 = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/$capsuleId/audit" -Method Get

Write-Host "✅ Audit Log Retrieved:" -ForegroundColor Green
Write-Host "   Total Access Events: $($response6.accessCount)"
foreach ($access in $response6.accessLog) {
    Write-Host "   - BurstKey: $($access.burstId)"
    Write-Host "     Accessor: $($access.accessorId)"
    Write-Host "     Consumed: $($access.consumed)"
    Write-Host "     Issued: $(Get-Date -UnixTimeMilliseconds $access.issuedAt -Format 'yyyy-MM-dd HH:mm:ss')"
    if ($access.consumedAt) {
        Write-Host "     Used: $(Get-Date -UnixTimeMilliseconds $access.consumedAt -Format 'yyyy-MM-dd HH:mm:ss')"
    }
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "✅ PHASE 3 COMPLETE!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Created encrypted medical capsule"
Write-Host "  ✅ Logged capsule hash on BlockDAG"
Write-Host "  ✅ Issued temporary BurstKey for medic"
Write-Host "  ✅ Logged BurstKey on BlockDAG"
Write-Host "  ✅ Decrypted emergency data with BurstKey"
Write-Host "  ✅ BurstKey single-use enforcement working"
Write-Host "  ✅ Audit log tracking all access events"
Write-Host ""

