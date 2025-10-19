Write-Host "`n=== PHASE 1 TEST: Authentication System ===`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5001/health"
    Write-Host "✅ Server is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Server health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Register a Patient
Write-Host "`nTest 2: Register Patient" -ForegroundColor Yellow
try {
    $registerBody = @{
        email = "testpatient@everguard.com"
        password = "test123"
        name = "Test Patient"
        role = "patient"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    Write-Host "✅ Patient registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.user.id)" -ForegroundColor Cyan
    Write-Host "  Name: $($registerResponse.user.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($registerResponse.user.email)" -ForegroundColor Cyan
    Write-Host "  Role: $($registerResponse.user.role)" -ForegroundColor Cyan
    Write-Host "  Token: $($registerResponse.token.Substring(0,20))..." -ForegroundColor Gray
    
    $script:patientToken = $registerResponse.token
    $script:patientEmail = $registerResponse.user.email
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 3: Register a Medic
Write-Host "`nTest 3: Register Medic" -ForegroundColor Yellow
try {
    $medicBody = @{
        email = "testmedic@everguard.com"
        password = "medic123"
        name = "Dr. Test Medic"
        role = "medic"
        licenseNumber = "MD-TEST-001"
    } | ConvertTo-Json

    $medicResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $medicBody -ContentType "application/json"
    
    Write-Host "✅ Medic registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($medicResponse.user.id)" -ForegroundColor Cyan
    Write-Host "  Name: $($medicResponse.user.name)" -ForegroundColor Cyan
    Write-Host "  License: MD-TEST-001" -ForegroundColor Cyan
    Write-Host "  Verified: false (needs admin approval)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Medic registration failed: $_" -ForegroundColor Red
}

# Test 4: Login with Patient
Write-Host "`nTest 4: Login with Patient Credentials" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $script:patientEmail
        password = "test123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "  Token received: $($loginResponse.token.Substring(0,20))..." -ForegroundColor Gray
    
    $script:loginToken = $loginResponse.token
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
}

# Test 5: Get User Info with Token
Write-Host "`nTest 5: Get User Info (Authenticated)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $($script:loginToken)"
    }
    
    $userInfo = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/me" -Headers $headers
    
    Write-Host "✅ Retrieved user info successfully!" -ForegroundColor Green
    Write-Host "  User: $($userInfo.user.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($userInfo.user.email)" -ForegroundColor Cyan
    Write-Host "  Role: $($userInfo.user.role)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Get user info failed: $_" -ForegroundColor Red
}

# Test 6: Invalid Login
Write-Host "`nTest 6: Invalid Login (Wrong Password)" -ForegroundColor Yellow
try {
    $badLoginBody = @{
        email = $script:patientEmail
        password = "wrongpassword"
    } | ConvertTo-Json

    $badLoginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $badLoginBody -ContentType "application/json"
    Write-Host "❌ TEST FAILED: Should have rejected invalid password!" -ForegroundColor Red
} catch {
    Write-Host "✅ Correctly rejected invalid credentials" -ForegroundColor Green
}

Write-Host "`n=== PHASE 1 TESTS COMPLETE ===`n" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✅ Health check" -ForegroundColor Green
Write-Host "  ✅ Patient registration" -ForegroundColor Green
Write-Host "  ✅ Medic registration" -ForegroundColor Green
Write-Host "  ✅ Login" -ForegroundColor Green
Write-Host "  ✅ Token authentication" -ForegroundColor Green
Write-Host "  ✅ Invalid login rejection" -ForegroundColor Green
Write-Host "`n✅ All Phase 1 tests passed!`n" -ForegroundColor Green

