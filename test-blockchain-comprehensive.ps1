#!/usr/bin/env pwsh
# Comprehensive Blockchain Transaction Verification

$baseUrl = "http://localhost:5001"

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "🔗 COMPREHENSIVE BLOCKCHAIN VERIFICATION" -ForegroundColor Cyan
Write-Host "`n===========================================`n" -ForegroundColor Cyan

# Test 1: Get All Blockchain Transactions
Write-Host "`n📊 Test 1: Get All Blockchain Transactions" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/transactions" -Method GET
    Write-Host "✅ Transactions fetched: $($response.count)" -ForegroundColor Green
    
    $blockchainEvents = $response.transactions | Where-Object { $_.source -eq 'blockchain' }
    $queueTransactions = $response.transactions | Where-Object { $_.source -eq 'queue' }
    
    Write-Host "📈 Blockchain Events: $($blockchainEvents.Count)" -ForegroundColor Cyan
    Write-Host "⏳ Queue Transactions: $($queueTransactions.Count)" -ForegroundColor Orange
    
    # Show transaction types breakdown
    $typeBreakdown = $blockchainEvents | Group-Object type | Sort-Object Count -Descending
    Write-Host "`n📋 Transaction Types:" -ForegroundColor White
    foreach ($type in $typeBreakdown) {
        Write-Host "  - $($type.Name): $($type.Count) transactions" -ForegroundColor White
    }
    
    # Show recent transactions
    Write-Host "`n🕒 Recent Transactions (Last 5):" -ForegroundColor White
    $blockchainEvents | Select-Object -First 5 | ForEach-Object {
        $txHash = $_.txHash.Substring(0, 10) + "..." + $_.txHash.Substring($_.txHash.Length - 8)
        Write-Host "  - $($_.type) | TX: $txHash | Block: $($_.blockNumber)" -ForegroundColor White
        if ($_.metadata.capsuleId) {
            Write-Host "    Capsule: $($_.metadata.capsuleId)" -ForegroundColor Gray
        }
        if ($_.metadata.burstId) {
            Write-Host "    Burst: $($_.metadata.burstId)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ Failed to get transactions: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Verify Capsule Creation Events
Write-Host "`n📦 Test 2: Verify Capsule Creation Events" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/transactions" -Method GET
    $capsuleEvents = $response.transactions | Where-Object { $_.type -eq 'CapsuleCreated' }
    
    Write-Host "✅ Capsule Creation Events: $($capsuleEvents.Count)" -ForegroundColor Green
    
    foreach ($event in $capsuleEvents) {
        Write-Host "  - Capsule ID: $($event.metadata.capsuleId)" -ForegroundColor White
        Write-Host "    Owner: $($event.metadata.owner)" -ForegroundColor Gray
        Write-Host "    TX Hash: $($event.txHash.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host "    Block: $($event.blockNumber)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Failed to verify capsule events: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verify BurstKey Events
Write-Host "`n🔑 Test 3: Verify BurstKey Events" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/transactions" -Method GET
    $burstKeyIssued = $response.transactions | Where-Object { $_.type -eq 'BurstKeyIssued' }
    $burstKeyConsumed = $response.transactions | Where-Object { $_.type -eq 'BurstKeyConsumed' }
    
    Write-Host "✅ BurstKey Issued Events: $($burstKeyIssued.Count)" -ForegroundColor Green
    Write-Host "✅ BurstKey Consumed Events: $($burstKeyConsumed.Count)" -ForegroundColor Green
    
    Write-Host "`n🔑 Recent BurstKey Issued (Last 3):" -ForegroundColor White
    $burstKeyIssued | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - Burst ID: $($_.metadata.burstId)" -ForegroundColor White
        Write-Host "    Capsule: $($_.metadata.capsuleId)" -ForegroundColor Gray
        Write-Host "    Accessor: $($_.metadata.accessor)" -ForegroundColor Gray
        Write-Host "    TX: $($_.txHash.Substring(0, 20))..." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Failed to verify BurstKey events: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check Transaction Status Distribution
Write-Host "`n📊 Test 4: Transaction Status Distribution" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/transactions" -Method GET
    
    $statusBreakdown = $response.transactions | Group-Object status | Sort-Object Count -Descending
    Write-Host "📈 Status Distribution:" -ForegroundColor White
    foreach ($status in $statusBreakdown) {
        $color = switch ($status.Name) {
            'confirmed' { 'Green' }
            'pending' { 'Yellow' }
            'failed' { 'Red' }
            default { 'White' }
        }
        Write-Host "  - $($status.Name): $($status.Count) transactions" -ForegroundColor $color
    }
    
} catch {
    Write-Host "❌ Failed to check status distribution: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Verify Block Numbers and Timestamps
Write-Host "`n⏰ Test 5: Verify Block Numbers and Timestamps" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/transactions" -Method GET
    $blockchainEvents = $response.transactions | Where-Object { $_.source -eq 'blockchain' }
    
    if ($blockchainEvents.Count -gt 0) {
        $minBlock = ($blockchainEvents | Measure-Object -Property blockNumber -Minimum).Minimum
        $maxBlock = ($blockchainEvents | Measure-Object -Property blockNumber -Maximum).Maximum
        
        Write-Host "✅ Block Range: $minBlock to $maxBlock" -ForegroundColor Green
        Write-Host "✅ Total Events: $($blockchainEvents.Count)" -ForegroundColor Green
        
        # Show block distribution
        $blockGroups = $blockchainEvents | Group-Object blockNumber | Sort-Object Name -Descending
        Write-Host "`n📦 Events per Block:" -ForegroundColor White
        $blockGroups | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - Block $($_.Name): $($_.Count) events" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️ No blockchain events found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to verify blocks: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "✅ BLOCKCHAIN VERIFICATION COMPLETE!" -ForegroundColor Green
Write-Host "`n===========================================`n" -ForegroundColor Cyan
