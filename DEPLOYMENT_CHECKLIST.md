# EverGuard Deployment Checklist

## Pre-Deployment

- [ ] All hardcoded `localhost:5001` URLs replaced with environment variables
- [ ] Environment variables documented in `DEPLOYMENT.md`
- [ ] `.gitignore` includes `server/secrets/*` (secrets not committed)
- [ ] Build command tested locally: `npm run build`
- [ ] Backend starts correctly: `cd server && npm start`

## Backend Deployment (Railway/Render/Heroku)

- [ ] Create account on chosen platform
- [ ] Connect GitHub repository
- [ ] Set root directory to `server` folder
- [ ] Configure environment variables:
  - [ ] `PORT=5001`
  - [ ] `NODE_ENV=production`
  - [ ] `BDAG_RPC_URL=https://rpc.awakening.bdagscan.com`
  - [ ] `PRIVATE_KEY` (your BlockDAG wallet private key)
  - [ ] `CONTRACT_ADDRESS=0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c`
  - [ ] `ENCRYPTION_KEY` (32-byte hex string)
  - [ ] `FIREBASE_PROJECT_ID=evergaurd-5d260`
  - [ ] `FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json`
  - [ ] `ALLOWED_ORIGINS` (will update after frontend deploys)
- [ ] Upload `firebase-service-account.json` to platform file storage
- [ ] Deploy and get backend URL (e.g., `https://everguard-api.railway.app`)
- [ ] Test backend health endpoint: `https://your-backend-url/health`

## Frontend Deployment (Netlify/Vercel)

- [ ] Create account on chosen platform
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `dist`
- [ ] Set environment variables:
  - [ ] `VITE_API_URL=https://your-backend-url.railway.app`
  - [ ] `VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening`
- [ ] Deploy and get frontend URL (e.g., `https://everguard.netlify.app`)
- [ ] Update backend `ALLOWED_ORIGINS` with frontend URL
- [ ] Restart backend service

## Post-Deployment Testing

- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Capsule creation works
- [ ] QR code generation works
- [ ] Admin panel accessible
- [ ] Blockchain transactions visible
- [ ] No CORS errors in browser console
- [ ] All API endpoints responding

## Security Verification

- [ ] No secrets in Git repository
- [ ] Environment variables set in platform (not in code)
- [ ] Firebase service account secured
- [ ] Private keys stored securely
- [ ] HTTPS enabled (automatic on most platforms)

## Optional Enhancements

- [ ] Set up custom domain
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up monitoring/alerting
- [ ] Configure CDN for static assets
- [ ] Set up CI/CD pipeline
