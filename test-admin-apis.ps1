#!/usr/bin/env pwsh
# Test Admin API Endpoints

$baseUrl = "http://localhost:5001"

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "🔍 TESTING ADMIN API ENDPOINTS" -ForegroundColor Cyan
Write-Host "`n===========================================`n" -ForegroundColor Cyan

# Test 1: Get Admin Stats
Write-Host "`n📊 Test 1: Get Admin Stats" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" -Method GET
    Write-Host "✅ Stats fetched successfully!" -ForegroundColor Green
    Write-Host "Users: $($response.stats.users.total) (Patients: $($response.stats.users.patients), Medics: $($response.stats.users.medics))" -ForegroundColor White
    Write-Host "Capsules: $($response.stats.capsules.total)" -ForegroundColor White
    Write-Host "BurstKeys: $($response.stats.burstKeys.total) (Active: $($response.stats.burstKeys.active), Consumed: $($response.stats.burstKeys.consumed), Expired: $($response.stats.burstKeys.expired))" -ForegroundColor White
    Write-Host "Audit Events: $($response.stats.audit.total)" -ForegroundColor White
    Write-Host "Medics: $($response.stats.medics.total) (Verified: $($response.stats.medics.verified), Pending: $($response.stats.medics.pending))" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to get stats: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
}

# Test 2: Get All Users
Write-Host "`n👥 Test 2: Get All Users" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method GET
    Write-Host "✅ Users fetched: $($response.count)" -ForegroundColor Green
    $response.users | ForEach-Object {
        Write-Host "  - $($_.name) ($($_.email)) - Role: $($_.role)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get users: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get All Capsules
Write-Host "`n🔐 Test 3: Get All Capsules" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/capsules" -Method GET
    Write-Host "✅ Capsules fetched: $($response.count)" -ForegroundColor Green
    $response.capsules | ForEach-Object {
        Write-Host "  - $($_.id) (Owner: $($_.ownerId)) - Type: $($_.capsuleType) - Status: $($_.status)" -ForegroundColor White
        if ($_.blockchainId) {
            Write-Host "    Blockchain ID: $($_.blockchainId)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Failed to get capsules: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get All BurstKeys
Write-Host "`n🔑 Test 4: Get All BurstKeys" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/burstkeys" -Method GET
    Write-Host "✅ BurstKeys fetched: $($response.count)" -ForegroundColor Green
    Write-Host "Stats - Active: $($response.stats.active), Consumed: $($response.stats.consumed), Expired: $($response.stats.expired)" -ForegroundColor White
    $response.burstKeys | ForEach-Object {
        Write-Host "  - $($_.burstId) (Capsule: $($_.capsuleId)) - Status: $($_.computedStatus)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get burst keys: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Audit Logs
Write-Host "`n📝 Test 5: Get Audit Logs" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/audit" -Method GET
    Write-Host "✅ Audit logs fetched: $($response.count)" -ForegroundColor Green
    $response.logs | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.eventType) - Capsule: $($_.capsuleId) - Accessor: $($_.accessorId) - Status: $($_.status)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get audit logs: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Medic Registry
Write-Host "`n⚕️ Test 6: Get Medic Registry" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/medics" -Method GET
    Write-Host "✅ Medics fetched: $($response.count)" -ForegroundColor Green
    Write-Host "Stats - Verified: $($response.stats.verified), Pending: $($response.stats.pending)" -ForegroundColor White
    $response.medics | ForEach-Object {
        $verifiedStatus = if ($_.verified) { "✓ Verified" } else { "⏳ Pending" }
        Write-Host "  - $($_.name) - License: $($_.licenseNumber) - $verifiedStatus" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get medics: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get Blockchain Transactions
Write-Host "`n⛓️ Test 7: Get Blockchain Transactions" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/transactions" -Method GET
    Write-Host "✅ Transactions fetched: $($response.count)" -ForegroundColor Green
    $response.transactions | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.txId) - Type: $($_.type) - Status: $($_.status)" -ForegroundColor White
        if ($_.txHash) {
            Write-Host "    TX Hash: $($_.txHash.Substring(0, 20))..." -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Failed to get transactions: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "✅ ADMIN API TESTING COMPLETE!" -ForegroundColor Green
Write-Host "`n===========================================`n" -ForegroundColor Cyan

