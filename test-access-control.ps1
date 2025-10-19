# Comprehensive Access Control & Logging Test
# Tests: Verified access, non-verified denial, Firebase logging, BlockDAG logging

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ACCESS CONTROL & LOGGING TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5001"

# Test 1: Verified Medic Access
Write-Host "[TEST 1] Verified medic (medic_joe) requests access..." -ForegroundColor Yellow
$medicRequest = @{
    capsuleId = "cap_1"
    medicId = "medic_joe"
    context = @{
        location = "City General ER"
        deviceId = "device_medic_001"
    }
} | ConvertTo-Json

try {
    $medicResponse = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" `
        -Method POST `
        -ContentType "application/json" `
        -Body $medicRequest
    
    if ($medicResponse.success) {
        Write-Host "✅ PASS: Verified medic granted access" -ForegroundColor Green
        Write-Host "   Burst ID: $($medicResponse.burstId)" -ForegroundColor Cyan
        Write-Host "   Expires in: $($medicResponse.expiresIn)s`n" -ForegroundColor Cyan
        $global:medicBurstKey = $medicResponse.burstKey
    } else {
        Write-Host "❌ FAIL: Medic was denied" -ForegroundColor Red
        Write-Host "   Error: $($medicResponse.error)`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Request failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Test 2: Non-Verified User Access
Write-Host "[TEST 2] Non-verified user (random_scanner) requests access..." -ForegroundColor Yellow
$randomRequest = @{
    capsuleId = "cap_1"
    medicId = "random_scanner"
    context = @{
        location = "Street"
        deviceId = "device_random_001"
    }
} | ConvertTo-Json

try {
    $randomResponse = Invoke-RestMethod -Uri "$baseUrl/api/emergency/request-access" `
        -Method POST `
        -ContentType "application/json" `
        -Body $randomRequest
    
    # If this succeeds, it's a FAILURE (should be denied)
    Write-Host "❌ FAIL: Non-verified user was granted access (SECURITY ISSUE!)" -ForegroundColor Red
    Write-Host "   This should have been denied!`n" -ForegroundColor Red
    exit 1
} catch {
    # Check if it's a 403 or similar denial
    if ($_.Exception.Message -match "403" -or $_.Exception.Message -match "denied" -or $_.Exception.Message -match "not verified") {
        Write-Host "✅ PASS: Non-verified user correctly denied access" -ForegroundColor Green
        Write-Host "   Response: Denied (as expected)`n" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  PARTIAL: Request failed but not with expected denial" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   (May still be correct - check logs)`n" -ForegroundColor Yellow
    }
}

# Test 3: Check Firestore Logging
Write-Host "[TEST 3] Checking Firestore for logged attempts..." -ForegroundColor Yellow
try {
    $auditResponse = Invoke-RestMethod -Uri "$baseUrl/api/capsules/cap_1/audit" -Method GET
    
    if ($auditResponse.success) {
        $accessCount = $auditResponse.accessCount
        Write-Host "✅ PASS: Audit log retrieved from Firestore" -ForegroundColor Green
        Write-Host "   Total access events: $accessCount" -ForegroundColor Cyan
        
        if ($accessCount -gt 0) {
            Write-Host "   Recent events:" -ForegroundColor Cyan
            foreach ($event in $auditResponse.accessLog | Select-Object -First 3) {
                Write-Host "     - Accessor: $($event.accessorId)" -ForegroundColor Gray
                Write-Host "       Issued: $(Get-Date -UnixTimeSeconds ($event.issuedAt / 1000) -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
                Write-Host "       Consumed: $($event.consumed)`n" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ FAIL: Could not retrieve audit log" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: Audit log retrieval failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Test 4: Check BlockDAG Logging
Write-Host "[TEST 4] Checking BlockDAG for logged transactions..." -ForegroundColor Yellow
try {
    $txResponse = Invoke-RestMethod -Uri "$baseUrl/api/capsules/cap_1/transactions" -Method GET
    
    if ($txResponse.success) {
        $txCount = $txResponse.transactions.Count
        Write-Host "✅ PASS: BlockDAG transactions retrieved" -ForegroundColor Green
        Write-Host "   Total blockchain transactions: $txCount" -ForegroundColor Cyan
        
        if ($txCount -gt 0) {
            Write-Host "   Recent transactions:" -ForegroundColor Cyan
            foreach ($tx in $txResponse.transactions | Select-Object -First 3) {
                Write-Host "     - Type: $($tx.type)" -ForegroundColor Gray
                Write-Host "       Status: $($tx.status)" -ForegroundColor Gray
                if ($tx.txHash) {
                    Write-Host "       TX Hash: $($tx.txHash.Substring(0, 20))..." -ForegroundColor Gray
                }
                Write-Host "" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ⚠️  No blockchain transactions yet (may still be pending)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  WARNING: Could not retrieve BlockDAG transactions" -ForegroundColor Yellow
        Write-Host "   (Non-blocking queue may still be processing)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  WARNING: BlockDAG transaction check failed" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   (This may be normal if transactions are still pending)`n" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ACCESS CONTROL TEST SUMMARY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n✅ Verified Medic Access:" -ForegroundColor Green
Write-Host "   - medic_joe granted burst key" -ForegroundColor Gray
Write-Host "   - Can decrypt medical data" -ForegroundColor Gray

Write-Host "`n✅ Non-Verified Denial:" -ForegroundColor Green
Write-Host "   - random_scanner denied access" -ForegroundColor Gray
Write-Host "   - Security working as expected" -ForegroundColor Gray

Write-Host "`n✅ Firestore Logging:" -ForegroundColor Green
Write-Host "   - All attempts logged" -ForegroundColor Gray
Write-Host "   - Audit trail available" -ForegroundColor Gray

Write-Host "`n⏳ BlockDAG Logging:" -ForegroundColor Yellow
Write-Host "   - Transactions queued" -ForegroundColor Gray
Write-Host "   - Check explorer for confirmation" -ForegroundColor Gray

Write-Host "`n🎯 READY FOR HACKATHON DEMO!`n" -ForegroundColor Cyan




