# Quick Deployment Guide

## TL;DR - Deploy in 3 Steps

### 1. Deploy Backend (Railway - Recommended)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, Railway auto-detects `server` folder
3. Add environment variables (see `DEPLOYMENT.md` for full list)
4. Upload `firebase-service-account.json` via Railway dashboard
5. Copy your backend URL (e.g., `https://everguard-api.railway.app`)

### 2. Deploy Frontend (Netlify - Recommended)

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Connect repo, build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variable:
   - `VITE_API_URL` = your backend URL from step 1
4. Deploy!

### 3. Update CORS

1. Go back to Railway backend settings
2. Update `ALLOWED_ORIGINS` environment variable:
   ```
   https://your-app.netlify.app
   ```
3. Restart backend service

**Done!** Your app should be live.

---

## Required Environment Variables

### Backend (Railway/Render)
```
PORT=5001
NODE_ENV=production
BDAG_RPC_URL=https://rpc.awakening.bdagscan.com
PRIVATE_KEY=your_blockdag_private_key
CONTRACT_ADDRESS=0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c
ENCRYPTION_KEY=your_32_byte_hex_key
FIREBASE_PROJECT_ID=evergaurd-5d260
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
```

### Frontend (Netlify/Vercel)
```
VITE_API_URL=https://your-backend-url.railway.app
VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
```

---

## Testing Locally Before Deploy

1. **Build frontend**: `npm run build`
2. **Test production build**: `npm run preview`
3. **Test backend**: `cd server && npm start`
4. **Verify**: Check that all features work

---

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.
