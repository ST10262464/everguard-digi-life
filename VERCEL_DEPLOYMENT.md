# Deploying EverGuard on Vercel (Frontend + Backend)

## ⚠️ Important Considerations

### Vercel Pros:
- ✅ Single platform for everything
- ✅ Automatic HTTPS and CDN
- ✅ Easy Git-based deployments
- ✅ Great developer experience
- ✅ Free tier available

### Vercel Cons for This Project:
- ⚠️ **Serverless Functions**: Your Express server runs as serverless functions (10s timeout on free tier, 60s on Pro)
- ⚠️ **Cold Starts**: First request after inactivity may be slow
- ⚠️ **Background Tasks**: `setImmediate` and long-running blockchain transactions may timeout
- ⚠️ **File System**: Firebase service account needs to be in environment variables or external storage
- ⚠️ **State Management**: In-memory transaction queue won't persist across function invocations

## Recommendation

**For this project, I recommend:**
- **Frontend**: Vercel ✅ (Perfect fit)
- **Backend**: Render or Railway ✅ (Better for long-running processes)

**However, if you want to use Vercel for both**, it's possible with some modifications.

---

## Option 1: Vercel for Both (With Modifications)

### Step 1: Modify Server for Vercel

The server needs to export the Express app instead of calling `app.listen()`:

```javascript
// At the end of server.js, replace:
// app.listen(PORT, ...)

// With:
if (require.main === module) {
  // Only start server if run directly (not imported)
  app.listen(PORT, () => {
    // ... existing startup logs
  });
}

// Export app for Vercel
module.exports = app;
```

### Step 2: Handle Firebase Service Account

Vercel doesn't support file uploads easily. Options:

**Option A: Convert to Environment Variable**
```javascript
// In firebase.js, instead of reading file:
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
```

**Option B: Use Vercel's File Storage** (Pro plan)

### Step 3: Handle Background Tasks

Background blockchain transactions need to be handled differently:

**Option A: Use Vercel Cron Jobs** (Pro plan) to process queue
**Option B: Move to external queue service** (Redis, etc.)
**Option C: Make blockchain calls synchronous** (may timeout on free tier)

### Step 4: Deploy

1. **Connect to Vercel**:
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables** in Vercel dashboard:
   ```
   NODE_ENV=production
   BDAG_RPC_URL=https://rpc.awakening.bdagscan.com
   PRIVATE_KEY=your_key
   CONTRACT_ADDRESS=0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c
   ENCRYPTION_KEY=your_key
   FIREBASE_PROJECT_ID=evergaurd-5d260
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} # JSON string
   ALLOWED_ORIGINS=https://your-app.vercel.app
   VITE_API_URL=https://your-app.vercel.app
   ```

3. **Build Settings**:
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install && cd server && npm install`

---

## Option 2: Hybrid Approach (Recommended)

### Frontend on Vercel
- Deploy frontend to Vercel (perfect fit)
- Set `VITE_API_URL` to your backend URL

### Backend on Render/Railway
- Deploy backend to Render or Railway
- Better for:
  - Long-running processes
  - Background tasks
  - File system access
  - No timeout limits

---

## Quick Comparison

| Feature | Vercel (Both) | Vercel Frontend + Render Backend |
|---------|---------------|----------------------------------|
| Setup Complexity | Medium (requires changes) | Low |
| Cost | Free tier limited | Free tier available |
| Timeout Limits | 10s free, 60s Pro | None |
| Background Tasks | Needs workarounds | Native support |
| File System | Limited | Full access |
| Cold Starts | Yes | No |
| Best For | Simple APIs | Complex backends |

---

## My Recommendation

**Use Vercel for frontend + Render/Railway for backend** because:

1. ✅ Your backend has background blockchain transactions
2. ✅ Transaction queue needs persistence
3. ✅ Firebase service account file access
4. ✅ No timeout concerns
5. ✅ Better for production reliability

**But if you want simplicity and are okay with limitations**, Vercel for both can work with the modifications above.

---

## Next Steps

If you want to proceed with Vercel for both:
1. I can modify `server.js` to work with Vercel
2. Update Firebase config to use environment variables
3. Adjust background task handling

Or stick with the original plan (Vercel frontend + Render backend) which is already configured and ready to deploy.
