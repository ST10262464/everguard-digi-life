# 🚀 Vercel Deployment - Quick Start Guide

## Prerequisites
- ✅ Backend deployed on Render (get your backend URL)
- ✅ GitHub repository connected

---

## Step 1: Deploy to Vercel

### Via Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login (use GitHub)

2. **Click "Add New Project"**

3. **Import your GitHub repository**
   - Select your `everguard-digi-life-integrate-all-branches-20251019` repo
   - Click "Import"

4. **Vercel will auto-detect Vite** ✅
   - Framework Preset: **Vite** (should be auto-selected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

5. **Configure Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   *(Replace with your actual Render backend URL)*
   
   ```
   VITE_BLOCKDAG_EXPLORER=https://bdagscan.com/awakening
   ```

6. **Click "Deploy"**
   - Vercel will build and deploy automatically
   - Takes ~2-3 minutes

7. **Get your frontend URL**
   - After deployment, you'll get: `https://everguard-xxxxx.vercel.app`
   - Copy this URL!

---

## Step 2: Update Backend CORS

1. **Go to Render Dashboard** → Your backend service

2. **Go to Environment** tab

3. **Update `ALLOWED_ORIGINS`**:
   ```
   https://everguard-xxxxx.vercel.app
   ```
   *(Replace with your actual Vercel URL)*

4. **Save** and **Restart** the service

---

## Step 3: Test Your Deployment

1. **Visit your Vercel URL**: `https://everguard-xxxxx.vercel.app`

2. **Test these features**:
   - ✅ Homepage loads
   - ✅ User registration
   - ✅ User login
   - ✅ Capsule creation
   - ✅ Admin panel (if you have admin access)

3. **Check browser console** for any errors

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally first
- Verify Node version (should be 18+)

### API Connection Errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend is running on Render
- Verify CORS is updated with your Vercel URL

### 404 on Routes
- Vercel should auto-configure redirects for SPA
- If not, add `vercel.json` with redirect rules (already created)

---

## Custom Domain (Optional)

1. In Vercel dashboard → Your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## That's It! 🎉

Your EverGuard app is now live on Vercel!

**Frontend**: `https://everguard-xxxxx.vercel.app`  
**Backend**: `https://your-backend.onrender.com`
