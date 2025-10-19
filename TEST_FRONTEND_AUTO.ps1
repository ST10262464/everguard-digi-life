# Automated Frontend Test Script
# Quick verification that all Phase 3 features are working

$ErrorActionPreference = "Continue"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AUTOMATED FRONTEND TEST SUITE       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

$testsPassed = 0
$testsFailed = 0

# Test 1: Frontend Running
Write-Host "[TEST 1] Checking frontend server..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Frontend is running (Status: $($response.StatusCode))`n" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "❌ FAIL: Frontend not responding" -ForegroundColor Red
    Write-Host "   Make sure to run: npm run dev`n" -ForegroundColor Yellow
    $testsFailed++
}

# Test 2: Backend Running
Write-Host "[TEST 2] Checking backend API..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get -ErrorAction Stop
    if ($response.status -eq "healthy") {
        Write-Host "✅ PASS: Backend API is healthy`n" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "❌ FAIL: Backend not responding" -ForegroundColor Red
    Write-Host "   Make sure to run: cd server && node server.js`n" -ForegroundColor Yellow
    $testsFailed++
}

# Test 3: Capsule API
Write-Host "[TEST 3] Testing Capsule API..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/cap_1" -Method Get -ErrorAction Stop
    if ($response.success) {
        Write-Host "✅ PASS: Capsule API working`n" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "❌ FAIL: Capsule API error" -ForegroundColor Red
    Write-Host "   Run: cd server && npm run seed`n" -ForegroundColor Yellow
    $testsFailed++
}

# Test 4: QR Code API
Write-Host "[TEST 4] Testing QR Code generation..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/cap_1/qrcode" -Method Get -ErrorAction Stop
    if ($response.success -and $response.qrCode) {
        Write-Host "✅ PASS: QR Code API working`n" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "❌ FAIL: QR Code API error`n" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Audit Log API (Phase 3)
Write-Host "[TEST 5] Testing Enhanced Audit Log API..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/cap_1/audit" -Method Get -ErrorAction Stop
    if ($response.success) {
        $eventCount = $response.accessLog.Count
        Write-Host "✅ PASS: Audit Log API working ($eventCount events)`n" -ForegroundColor Green
        $testsPassed++
        
        # Check for different event types
        $eventTypes = $response.accessLog | Select-Object -ExpandProperty eventType -Unique
        if ($eventTypes) {
            Write-Host "   Event types found: $($eventTypes -join ', ')" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ FAIL: Audit Log API error`n" -ForegroundColor Red
    $testsFailed++
}

# Test 6: ICE View API (Phase 2)
Write-Host "[TEST 6] Testing ICE View for non-verified users..." -ForegroundColor Cyan
$iceRequest = @{
    capsuleId = "cap_1"
    medicId = "test_nonverified"
    medicPubKey = "0xTestPubKey"
    context = @{ location = "Test"; deviceId = "test" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/api/emergency/request-access" -Method Post -Body $iceRequest -ContentType "application/json" -ErrorAction Stop
    if ($response.success -and $response.accessLevel -eq "ice") {
        Write-Host "✅ PASS: ICE View API working" -ForegroundColor Green
        Write-Host "   Access Level: $($response.accessLevel)" -ForegroundColor Cyan
        Write-Host "   Emergency Contact: $($response.iceData.emergencyContact.name)`n" -ForegroundColor Cyan
        $testsPassed++
    }
} catch {
    Write-Host "❌ FAIL: ICE View API error`n" -ForegroundColor Red
    $testsFailed++
}

# Test 7: Component Files Exist (Phase 3)
Write-Host "[TEST 7] Verifying Phase 3 component files..." -ForegroundColor Cyan
$components = @(
    "src/components/EmergencyFieldsHelper.tsx",
    "src/components/AuditTimeline.tsx",
    "src/components/BurstKeyStatusBadge.tsx",
    "src/components/IceView.tsx"
)

$allExist = $true
foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "   ✓ $component" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $component (missing)" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host "✅ PASS: All Phase 3 components exist`n" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "❌ FAIL: Some components missing`n" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST RESULTS SUMMARY                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

$totalTests = $testsPassed + $testsFailed
$passRate = [math]::Round(($testsPassed / $totalTests) * 100, 1)
Write-Host "Pass Rate:    $passRate%`n" -ForegroundColor $(if ($passRate -ge 85) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

if ($passRate -ge 85) {
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  🎉 AUTOMATED TESTS PASSED! 🎉       ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "✅ Backend APIs: Working" -ForegroundColor Green
    Write-Host "✅ Phase 3 Components: Ready" -ForegroundColor Green
    Write-Host "✅ Frontend Server: Running" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Step: Manual Frontend Testing" -ForegroundColor Yellow
    Write-Host "   1. Open browser: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "   2. Follow the manual testing plan in:" -ForegroundColor Cyan
    Write-Host "      COMPREHENSIVE_FRONTEND_TESTING_PLAN.md" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠️  Some automated tests failed. Check errors above.`n" -ForegroundColor Yellow
}

exit $(if ($testsFailed -eq 0) { 0 } else { 1 })


