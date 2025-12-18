# EverGuard Deployment Guide

This guide covers deploying the EverGuard full-stack application to production.

## Architecture

- **Frontend**: React + Vite (deploy to Netlify/Vercel)
- **Backend**: Node.js/Express API (deploy to Railway/Render/Heroku)
- **Database**: Firebase Firestore
- **Blockchain**: BlockDAG Network

## Prerequisites

1. Firebase project with service account JSON
2. BlockDAG wallet with private key
3. Deployed smart contract address
4. Accounts on deployment platforms

---

## Step 1: Deploy Backend (Render)

### Render (Recommended)

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up
2. **New Web Service**:
   - Connect your GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Set Environment Variables**:
   ```
   PORT=5001
   NODE_ENV=production
   BDAG_RPC_URL=https://rpc.awakening.bdagscan.com
   PRIVATE_KEY=your_blockdag_private_key
   CONTRACT_ADDRESS=0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c
   ENCRYPTION_KEY=your_32_byte_hex_key
   FIREBASE_PROJECT_ID=evergaurd-5d260
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} # Minified JSON string
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-frontend-url.vercel.app
   ```
4. **Upload Firebase Service Account**:
   - In Render, go to your service → Environment
   - **Convert to environment variable** (Render doesn't support file uploads easily):
     ```bash
     # On your local machine, read and minify the JSON:
     cat server/secrets/firebase-service-account.json | jq -c
     ```
   - Copy the minified JSON output
   - In Render dashboard, add environment variable:
     - Key: `FIREBASE_SERVICE_ACCOUNT`
     - Value: Paste the minified JSON (all on one line)
   - **Note**: The Firebase config has been updated to support both file paths and environment variables automatically

5. **Deploy**: Render will automatically deploy on push to main branch

### Backend URL
After deployment, note your backend URL (e.g., `https://everguard-api.onrender.com`)

---

## Step 2: Deploy Frontend (Vercel or Netlify)

### Option A: Vercel (Recommended ⭐)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com)
2. **Import Project**: Connect your GitHub repo
3. **Configure**:
   - Framework Preset: Vite (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
   ```
5. **Deploy**: Vercel will build and deploy automatically

**Why Vercel?** Faster builds, better DX, superior CDN, excellent React/Vite support.

### Option B: Netlify (Alternative)

1. **Create Netlify Account**: Go to [netlify.com](https://netlify.com)
2. **New Site from Git**:
   - Connect your GitHub repository
   - Build settings (auto-detected from `netlify.toml`):
     - Build command: `npm run build`
     - Publish directory: `dist`
3. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
   ```
4. **Deploy**: Netlify will build and deploy automatically

**Why Netlify?** Already configured, simpler interface, good enough for most use cases.

> 💡 **See `FRONTEND_DEPLOYMENT.md` for detailed comparison and step-by-step guides.**

---

## Step 3: Update CORS Settings

After deploying frontend, update backend `ALLOWED_ORIGINS` environment variable:

```
ALLOWED_ORIGINS=https://your-app.netlify.app,https://your-app.vercel.app
```

Restart the backend service.

---

## Step 4: Verify Deployment

1. **Frontend**: Visit your Netlify/Vercel URL
2. **Backend Health Check**: `https://your-backend-url/health`
3. **Test Features**:
   - User registration/login
   - Capsule creation
   - QR code generation
   - Admin panel access

---

## Environment Variables Summary

### Frontend (.env.production or Netlify/Vercel dashboard)
```
VITE_API_URL=https://your-backend-url.railway.app
VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
```

### Backend (Railway/Render dashboard)
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

---

## Troubleshooting

### Backend Issues
- **Firebase Error**: Ensure service account JSON is uploaded correctly
- **CORS Errors**: Check `ALLOWED_ORIGINS` includes your frontend URL
- **Blockchain Connection**: Verify `BDAG_RPC_URL` and `PRIVATE_KEY` are correct

### Frontend Issues
- **API Connection**: Verify `VITE_API_URL` points to your backend
- **Build Errors**: Check Node version (should be 18+)
- **404 on Routes**: Ensure Netlify redirects are configured (already in `netlify.toml`)

---

## Security Notes

- Never commit `.env` files or `firebase-service-account.json` to Git
- Use platform environment variables for all secrets
- Keep `PRIVATE_KEY` secure - use platform secrets management
- Regularly rotate encryption keys in production

---

## Post-Deployment

1. Test all major features
2. Monitor backend logs for errors
3. Set up error tracking (Sentry, etc.)
4. Configure custom domain (optional)
5. Set up SSL certificates (automatic on Netlify/Vercel/Railway)
