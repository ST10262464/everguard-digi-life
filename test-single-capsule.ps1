# Simple test to create one capsule and see blockchain logs
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5001"

Write-Host "Testing capsule creation..." -ForegroundColor Yellow

$createCapsule = @{
    userId = "user_test"
    capsuleData = @{
        type = "medical"
        title = "Test Capsule"
        content = @{ test = "data" }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/capsules" -Method Post -Body $createCapsule -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
}

