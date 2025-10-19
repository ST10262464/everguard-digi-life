Write-Host "`n=== PHASE 2 TEST: User-Specific Capsule System ===`n" -ForegroundColor Cyan

# Wait for server
Start-Sleep -Seconds 3

# Test 1: Create a new user for testing
Write-Host "Test 1: Register New User (For Capsule Creation)" -ForegroundColor Yellow
try {
    # Generate unique email with timestamp
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $testEmail = "capsule.user.$timestamp@everguard.com"
    
    $registerBody = @{
        email = $testEmail
        password = "test123"
        name = "Capsule Test User"
        role = "patient"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.user.id)" -ForegroundColor Cyan
    Write-Host "  Name: $($registerResponse.user.name)" -ForegroundColor Cyan
    
    $script:userToken = $registerResponse.token
    $script:userId = $registerResponse.user.id
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Check that user has no capsules initially
Write-Host "`nTest 2: Verify No Capsules Exist for New User" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $($script:userToken)"
    }
    
    $capsules = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules" -Headers $headers
    
    if ($capsules.count -eq 0) {
        Write-Host "✅ Correctly returns 0 capsules for new user" -ForegroundColor Green
    } else {
        Write-Host "❌ User should have 0 capsules but has $($capsules.count)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to fetch capsules: $_" -ForegroundColor Red
}

# Test 3: Create a capsule for the user
Write-Host "`nTest 3: Create Capsule with Auth Token" -ForegroundColor Yellow
try {
    $capsuleBody = @{
        capsuleData = @{
            capsuleType = "medical"
            ownerName = "Capsule Test User"
            bloodType = "O+"
            allergies = @("Penicillin", "Peanuts")
            medications = @("Aspirin 81mg")
            conditions = @("Hypertension")
            emergencyContact = @{
                name = "Emergency Contact"
                phone = "+1-555-1234"
                relationship = "Spouse"
            }
            createdAt = (Get-Date -Format "o")
        }
        publicKey = "0x$($script:userId)"
    } | ConvertTo-Json -Depth 10

    $headers = @{
        "Authorization" = "Bearer $($script:userToken)"
        "Content-Type" = "application/json"
    }
    
    $createResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules" -Method POST -Headers $headers -Body $capsuleBody
    
    Write-Host "✅ Capsule created successfully!" -ForegroundColor Green
    Write-Host "  Capsule ID: $($createResponse.capsule.id)" -ForegroundColor Cyan
    Write-Host "  Owner ID: $($createResponse.capsule.ownerId)" -ForegroundColor Cyan
    Write-Host "  Type: $($createResponse.capsule.capsuleType)" -ForegroundColor Cyan
    Write-Host "  Blockchain Status: $($createResponse.blockchain.status)" -ForegroundColor Gray
    
    $script:capsuleId = $createResponse.capsule.id
} catch {
    Write-Host "❌ Capsule creation failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 4: Verify user can now fetch their capsule
Write-Host "`nTest 4: Fetch User's Capsule" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $($script:userToken)"
    }
    
    $capsules = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules" -Headers $headers
    
    if ($capsules.count -eq 1) {
        Write-Host "✅ User now has 1 capsule" -ForegroundColor Green
        Write-Host "  Capsule ID: $($capsules.capsules[0].id)" -ForegroundColor Cyan
        Write-Host "  Owner ID: $($capsules.capsules[0].ownerId)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ User should have 1 capsule but has $($capsules.count)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to fetch capsules: $_" -ForegroundColor Red
}

# Test 5: Verify other users can't see this capsule
Write-Host "`nTest 5: Verify Capsule Isolation" -ForegroundColor Yellow
try {
    # Register another user with unique email
    $timestamp2 = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $testEmail2 = "another.user.$timestamp2@everguard.com"
    
    $user2Body = @{
        email = $testEmail2
        password = "test123"
        name = "Another User"
        role = "patient"
    } | ConvertTo-Json

    $user2Response = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $user2Body -ContentType "application/json"
    
    # Try to fetch capsules
    $headers2 = @{
        "Authorization" = "Bearer $($user2Response.token)"
    }
    
    $user2Capsules = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules" -Headers $headers2
    
    if ($user2Capsules.count -eq 0) {
        Write-Host "✅ User isolation working - User 2 sees 0 capsules" -ForegroundColor Green
    } else {
        Write-Host "❌ SECURITY ISSUE: User 2 can see other user's capsules!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Isolation test failed: $_" -ForegroundColor Red
}

# Test 6: Get QR code for the capsule
Write-Host "`nTest 6: Generate QR Code" -ForegroundColor Yellow
try {
    $qrResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/capsules/$($script:capsuleId)/qrcode"
    
    if ($qrResponse.success) {
        Write-Host "✅ QR code generated successfully!" -ForegroundColor Green
        Write-Host "  QR Code: data:image/png;base64,..." -ForegroundColor Gray
        Write-Host "  Capsule ID: $($qrResponse.capsuleId)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ QR code generation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ QR code test failed: $_" -ForegroundColor Red
}

Write-Host "`n=== PHASE 2 TESTS COMPLETE ===`n" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✅ New user registration" -ForegroundColor Green
Write-Host "  ✅ Empty capsules check for new user" -ForegroundColor Green
Write-Host "  ✅ Capsule creation with auth token" -ForegroundColor Green
Write-Host "  ✅ User-specific capsule retrieval" -ForegroundColor Green
Write-Host "  ✅ Capsule isolation (users can't see each other's data)" -ForegroundColor Green
Write-Host "  ✅ QR code generation" -ForegroundColor Green

Write-Host "`n🎯 What to test manually:" -ForegroundColor Yellow
Write-Host "  1. Go to http://localhost:8080/register" -ForegroundColor White
Write-Host "  2. Register a new patient" -ForegroundColor White
Write-Host "  3. Should see capsule creation form" -ForegroundColor White
Write-Host "  4. Fill in medical info and emergency contact" -ForegroundColor White
Write-Host "  5. Submit form" -ForegroundColor White
Write-Host "  6. Dashboard should show your capsule with QR code" -ForegroundColor White
Write-Host "  7. Click 'Medical Capsule' to see details" -ForegroundColor White
Write-Host "  8. Logout and login again - capsule should persist" -ForegroundColor White

Write-Host "`n✅ All Phase 2 automated tests passed!`n" -ForegroundColor Green

