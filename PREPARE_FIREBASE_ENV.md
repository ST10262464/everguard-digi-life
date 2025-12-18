# Prepare Firebase Service Account for Render

## The Problem
Your `firebase-service-account.json` is in `.gitignore`, so it won't be in the Git repository. Render can't access it via file path.

## The Solution
Use the `FIREBASE_SERVICE_ACCOUNT` environment variable instead (already configured in your code!).

---

## Step 1: Get Your Firebase JSON Content

### Option A: Using PowerShell (Windows)

1. **Open PowerShell** in your project root directory

2. **Run this command** to minify the JSON:
   ```powershell
   Get-Content "server\secrets\firebase-service-account.json" | ConvertFrom-Json | ConvertTo-Json -Compress
   ```

3. **Copy the entire output** (it will be one long line)

### Option B: Using Command Line (if you have `jq`)

```bash
cat server/secrets/firebase-service-account.json | jq -c
```

### Option C: Manual Method

1. Open `server/secrets/firebase-service-account.json` in a text editor
2. Copy all the content
3. Go to an online JSON minifier: https://jsonformatter.org/json-minify
4. Paste and minify
5. Copy the minified result (should be one line)

---

## Step 2: Set Environment Variable in Render

1. **In Render dashboard**, before clicking "Create Web Service":
   - Scroll to **"Environment Variables"** section
   - Click **"Add Environment Variable"**

2. **Add these variables** (in this order):

   **Variable 1:**
   - Key: `FIREBASE_PROJECT_ID`
   - Value: `evergaurd-5d260`

   **Variable 2:**
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: `[Paste your minified JSON here - the entire one-line JSON]`
   - ⚠️ **Important**: Paste the ENTIRE minified JSON as the value

   **Other required variables:**
   ```
   PORT=5001
   NODE_ENV=production
   BDAG_RPC_URL=https://rpc.awakening.bdagscan.com
   PRIVATE_KEY=your_blockdag_private_key
   CONTRACT_ADDRESS=0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c
   ENCRYPTION_KEY=your_32_byte_hex_key
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

3. **DO NOT set** `FIREBASE_SERVICE_ACCOUNT_PATH` - leave it unset
   - The code will automatically use `FIREBASE_SERVICE_ACCOUNT` if it's available

---

## Step 3: Verify Your Setup

Your Firebase config already supports this! It checks:
1. First: `FIREBASE_SERVICE_ACCOUNT` (environment variable) ✅
2. Second: `FIREBASE_SERVICE_ACCOUNT_PATH` (file path) ✅

So if you set `FIREBASE_SERVICE_ACCOUNT`, it will use that automatically.

---

## Example of Minified JSON

Your minified JSON should look like this (all on one line):
```
{"type":"service_account","project_id":"evergaurd-5d260","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

---

## Quick PowerShell Script

Save this as `get-firebase-env.ps1` and run it:

```powershell
# Get Firebase Service Account as environment variable
$jsonPath = "server\secrets\firebase-service-account.json"
if (Test-Path $jsonPath) {
    $json = Get-Content $jsonPath | ConvertFrom-Json | ConvertTo-Json -Compress
    Write-Host "`n✅ Minified JSON (copy this for FIREBASE_SERVICE_ACCOUNT):`n" -ForegroundColor Green
    Write-Host $json -ForegroundColor Yellow
    Write-Host "`n📋 Copy the above text and paste it as the value for FIREBASE_SERVICE_ACCOUNT in Render`n" -ForegroundColor Cyan
} else {
    Write-Host "❌ File not found: $jsonPath" -ForegroundColor Red
}
```

---

## After Setting Variables

1. ✅ All environment variables set in Render
2. ✅ `FIREBASE_SERVICE_ACCOUNT` contains minified JSON
3. ✅ `FIREBASE_PROJECT_ID` is set
4. ✅ **DO NOT** set `FIREBASE_SERVICE_ACCOUNT_PATH`
5. ✅ Click "Create Web Service"

---

## Troubleshooting

### "Firebase initialization failed"
- Check that `FIREBASE_SERVICE_ACCOUNT` is valid JSON
- Make sure it's minified (one line, no line breaks)
- Verify `FIREBASE_PROJECT_ID` matches your project

### "JSON parse error"
- The JSON might have line breaks - make sure it's truly minified
- Try the PowerShell command again
- Or use an online JSON minifier

### "Service account not found"
- Make sure you set `FIREBASE_SERVICE_ACCOUNT` (not `FIREBASE_SERVICE_ACCOUNT_PATH`)
- Check the variable name spelling in Render

---

## You're Ready! 🚀

Once you've set `FIREBASE_SERVICE_ACCOUNT` with the minified JSON, you can click "Create Web Service" and deploy!
