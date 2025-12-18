# Get Firebase Service Account as environment variable for Render
# Run this script to get the minified JSON you need for Render

$jsonPath = "server\secrets\firebase-service-account.json"

Write-Host "`n🔍 Looking for Firebase service account file...`n" -ForegroundColor Cyan

if (Test-Path $jsonPath) {
    Write-Host "✅ File found: $jsonPath`n" -ForegroundColor Green
    
    try {
        # Read and minify JSON
        $jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
        
        Write-Host "=" * 80 -ForegroundColor Gray
        Write-Host "📋 MINIFIED JSON (Copy this entire block):" -ForegroundColor Yellow
        Write-Host "=" * 80 -ForegroundColor Gray
        Write-Host ""
        Write-Host $jsonContent -ForegroundColor White
        Write-Host ""
        Write-Host "=" * 80 -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ Instructions:" -ForegroundColor Green
        Write-Host "   1. Copy the JSON above (the entire one-line string)" -ForegroundColor Cyan
        Write-Host "   2. In Render dashboard, add environment variable:" -ForegroundColor Cyan
        Write-Host "      Key: FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Yellow
        Write-Host "      Value: [Paste the JSON here]" -ForegroundColor Yellow
        Write-Host "   3. Also set: FIREBASE_PROJECT_ID = evergaurd-5d260" -ForegroundColor Cyan
        Write-Host "   4. DO NOT set FIREBASE_SERVICE_ACCOUNT_PATH" -ForegroundColor Red
        Write-Host ""
        
        # Also copy to clipboard if possible
        try {
            $jsonContent | Set-Clipboard
            Write-Host "📋 JSON copied to clipboard!`n" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not copy to clipboard (manual copy required)`n" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Error processing JSON: $_" -ForegroundColor Red
        Write-Host "   Make sure the file is valid JSON`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ File not found: $jsonPath" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root directory`n" -ForegroundColor Yellow
}
