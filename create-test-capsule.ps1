# Create a test medical capsule for frontend testing
$baseUrl = "http://localhost:5001"

Write-Host "Creating test medical capsule..." -ForegroundColor Yellow

$capsule = @{
    userId = "alice_test"
    capsuleData = @{
        type = "medical"
        title = "Alice's Medical Capsule"
        content = @{
            bloodType = "O+"
            allergies = @("Penicillin", "Peanuts")
            medications = @("Lisinopril 10mg - Daily", "Metformin 500mg - Twice daily")
            emergencyContact = @{
                name = "Jane Doe"
                phone = "+1 (555) 123-4567"
            }
            conditions = @("Type 2 Diabetes", "Hypertension")
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/capsules" -Method Post -Body $capsule -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "SUCCESS: Capsule created!" -ForegroundColor Green
    Write-Host "Capsule ID: $($response.capsule.id)" -ForegroundColor Cyan
    Write-Host "`nYou can now test the frontend at http://localhost:5173" -ForegroundColor Yellow
    Write-Host "Click 'Emergency Access' to see the integrated component!" -ForegroundColor Yellow
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

