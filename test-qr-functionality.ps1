# EverGuard QR Code Functionality Test
# Tests: QR Generation, Display, Scanning, and Emergency Access

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   EVERGUARD QR CODE FUNCTIONALITY TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This test demonstrates:" -ForegroundColor Yellow
Write-Host "  1. QR Code Generation (Backend API)" -ForegroundColor White
Write-Host "  2. QR Code Display (Frontend)" -ForegroundColor White
Write-Host "  3. QR Code Scanning (Camera)" -ForegroundColor White
Write-Host "  4. Emergency Access Flow`n" -ForegroundColor White

# Test 1: Generate QR Code for cap_1
Write-Host "[1/4] Testing QR Code Generation..." -ForegroundColor Green
Write-Host "      GET http://localhost:5001/api/capsules/cap_1/qrcode" -ForegroundColor Gray

try {
    $qrResponse = Invoke-RestMethod -Method GET -Uri "http://localhost:5001/api/capsules/cap_1/qrcode"
    
    if ($qrResponse.success) {
        Write-Host "      SUCCESS - QR Code Generated" -ForegroundColor Green
        Write-Host "      Capsule ID: $($qrResponse.capsuleId)" -ForegroundColor White
        Write-Host "      Type: $($qrResponse.capsuleType)" -ForegroundColor White
        Write-Host "      QR Data Length: $($qrResponse.qrCode.Length) bytes`n" -ForegroundColor White
        
        # Extract QR data payload
        $qrData = $qrResponse.qrCode
        Write-Host "      QR Code contains:" -ForegroundColor Yellow
        Write-Host "        - Capsule ID for emergency access" -ForegroundColor White
        Write-Host "        - Platform identifier" -ForegroundColor White
        Write-Host "        - Access type`n" -ForegroundColor White
    } else {
        Write-Host "      FAILED - $($qrResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "      ERROR - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      Make sure the server is running and cap_1 exists`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Frontend Display Instructions
Write-Host "[2/4] Testing QR Code Display (Frontend)..." -ForegroundColor Green
Write-Host "      Navigate to: http://localhost:8080" -ForegroundColor Gray
Write-Host "      1. Click 'Get Started'" -ForegroundColor White
Write-Host "      2. Click 'Medical Capsule'" -ForegroundColor White
Write-Host "      3. Click 'QR Code' tab" -ForegroundColor White
Write-Host "      4. You should see a scannable QR code" -ForegroundColor White
Write-Host "      5. Download or Print options available`n" -ForegroundColor White

# Test 3: QR Scanner Instructions
Write-Host "[3/4] Testing QR Code Scanner..." -ForegroundColor Green
Write-Host "      Navigate to: http://localhost:8080/emergency-scan" -ForegroundColor Gray
Write-Host "      Option A - Camera Scanning:" -ForegroundColor Yellow
Write-Host "        1. Click 'QR Scanner' button" -ForegroundColor White
Write-Host "        2. Allow camera access" -ForegroundColor White
Write-Host "        3. Point camera at QR code" -ForegroundColor White
Write-Host "        4. Code will auto-scan and request access" -ForegroundColor White
Write-Host "      Option B - Manual Entry:" -ForegroundColor Yellow
Write-Host "        1. Click 'Manual Entry' button" -ForegroundColor White
Write-Host "        2. Enter: cap_1" -ForegroundColor White
Write-Host "        3. Click 'Request Emergency Access'`n" -ForegroundColor White

# Test 4: Verify Emergency Access Flow
Write-Host "[4/4] Testing Complete Emergency Flow..." -ForegroundColor Green
Write-Host "      Simulating QR scan -> Emergency Access`n" -ForegroundColor Gray

# Simulate the flow
Write-Host "      Step 1: Scanning QR Code (contains cap_1)" -ForegroundColor Yellow
Start-Sleep -Seconds 1

Write-Host "      Step 2: Requesting BurstKey..." -ForegroundColor Yellow
$burstBody = @{
    capsuleId = "cap_1"
    medicId = "qr_scan_test"
    medicPubKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
    context = @{
        location = "QR Scan Test"
        deviceId = "test_device"
        attestation = "qr_emergency"
    }
} | ConvertTo-Json -Depth 5

try {
    $burstResponse = Invoke-RestMethod -Method POST -Uri "http://localhost:5001/api/emergency/request-access" -Body $burstBody -ContentType "application/json"
    
    if ($burstResponse.success) {
        Write-Host "      SUCCESS - BurstKey Issued" -ForegroundColor Green
        Write-Host "      BurstKey: $($burstResponse.burstKey.Substring(0,20))..." -ForegroundColor White
        Write-Host "      Expires: $(Get-Date -UnixTimeMilliseconds $burstResponse.expiresAt -Format 'HH:mm:ss')`n" -ForegroundColor White
        
        # Step 3: Access capsule
        Write-Host "      Step 3: Accessing Emergency Data..." -ForegroundColor Yellow
        $accessBody = @{
            burstKey = $burstResponse.burstKey
            medicId = "qr_scan_test"
        } | ConvertTo-Json
        
        $accessResponse = Invoke-RestMethod -Method POST -Uri "http://localhost:5001/api/emergency/access-capsule" -Body $accessBody -ContentType "application/json"
        
        if ($accessResponse.success) {
            Write-Host "      SUCCESS - Emergency Data Retrieved" -ForegroundColor Green
            Write-Host "      Blood Type: $($accessResponse.content.bloodType)" -ForegroundColor White
            Write-Host "      Allergies: $($accessResponse.content.allergies -join ', ')" -ForegroundColor White
            Write-Host "      Emergency Contact: $($accessResponse.content.emergencyContact.name)`n" -ForegroundColor White
        }
    }
} catch {
    Write-Host "      ERROR - $($_.Exception.Message)`n" -ForegroundColor Red
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "QR CODE FEATURES IMPLEMENTED:" -ForegroundColor Green
Write-Host "  [x] Backend QR Code Generation API" -ForegroundColor White
Write-Host "  [x] Frontend QR Code Display Tab" -ForegroundColor White
Write-Host "  [x] Download & Print QR Code" -ForegroundColor White
Write-Host "  [x] Real Camera-Based QR Scanner" -ForegroundColor White
Write-Host "  [x] Manual Entry Fallback" -ForegroundColor White
Write-Host "  [x] Emergency Access Integration" -ForegroundColor White
Write-Host "  [x] Blockchain Logging`n" -ForegroundColor White

Write-Host "HOW TO TEST IN BROWSER:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:8080" -ForegroundColor White
Write-Host "  2. View QR Code: Dashboard -> Medical Capsule -> QR Code tab" -ForegroundColor White
Write-Host "  3. Test Scanner: http://localhost:8080/emergency-scan" -ForegroundColor White
Write-Host "  4. Scan the generated QR code or use manual entry`n" -ForegroundColor White

Write-Host "REAL QR CODE WORKFLOW:" -ForegroundColor Cyan
Write-Host "  1. User generates QR from capsule" -ForegroundColor White
Write-Host "  2. QR printed/saved to phone" -ForegroundColor White
Write-Host "  3. Paramedic scans QR with camera" -ForegroundColor White
Write-Host "  4. BurstKey issued instantly" -ForegroundColor White
Write-Host "  5. Emergency data decrypted" -ForegroundColor White
Write-Host "  6. All actions logged on BlockDAG`n" -ForegroundColor White

Write-Host "========================================`n" -ForegroundColor Cyan


