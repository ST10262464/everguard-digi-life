# Frontend Deployment: Netlify vs Vercel

## Quick Comparison

| Feature | Netlify | Vercel |
|---------|---------|--------|
| **Setup Time** | ⚡ Very Fast | ⚡ Very Fast |
| **Build Speed** | Fast | ⚡ Faster |
| **Free Tier** | 100GB bandwidth | 100GB bandwidth |
| **React Support** | ✅ Excellent | ✅ Excellent |
| **Vite Support** | ✅ Native | ✅ Native |
| **CDN Speed** | Good | ⚡ Edge Network (Faster) |
| **Preview Deploys** | ✅ Yes | ⚡ Better UX |
| **Analytics** | Basic | ⚡ Advanced |
| **Already Configured** | ✅ Yes (`netlify.toml`) | Need to create config |

## Recommendation: **Vercel** ⭐

**Why Vercel?**
- Faster builds and deployments
- Better developer experience
- Superior global CDN (Edge Network)
- Excellent React/Vite integration
- Better preview deployments for PRs

**Why Netlify?**
- Already configured (`netlify.toml` exists)
- Slightly simpler for basic use cases
- Good enough if you want quickest setup

---

## Deploy to Vercel (Recommended)

### Option 1: Via Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
5. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
   ```
6. Click **"Deploy"**

### Option 2: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_API_URL
vercel env add VITE_BLOCKDAG_EXPLORER
```

---

## Deploy to Netlify (Alternative)

### Option 1: Via Dashboard

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
   ```
6. Click **"Deploy site"**

### Option 2: Via CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set VITE_API_URL https://your-backend-url.onrender.com
netlify env:set VITE_BLOCKDAG_EXPLORER https://bdagscan.com/awakening
```

---

## Both Work Great!

**Choose Vercel if:**
- You want faster builds
- You want better developer experience
- You want better analytics

**Choose Netlify if:**
- You want the quickest setup (already configured)
- You prefer simpler interface
- You're already familiar with Netlify

**Both are free and will work perfectly for your React + Vite app!**

---

## After Deployment

1. **Get your frontend URL** (e.g., `https://everguard.vercel.app`)
2. **Update backend CORS** on Render:
   - Go to Render dashboard → Your backend service → Environment
   - Update `ALLOWED_ORIGINS`:
     ```
     https://everguard.vercel.app
     ```
   - Or if using Netlify:
     ```
     https://everguard.netlify.app
     ```
3. **Restart backend service** on Render
4. **Test your app!**
