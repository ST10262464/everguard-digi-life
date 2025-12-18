# Deploying from Public Repository on Render

## ✅ Yes, You Can Deploy!

Even if you're **not the owner** of the repository, Render allows you to deploy from **public repositories** directly.

---

## Step-by-Step Guide

### 1. Use "Public Git Repository" Tab

1. In Render's "New Web Service" page, you'll see three tabs:
   - **Git Provider** (requires connection)
   - **Public Git Repository** ← **Use this one!**
   - Existing Image

2. **Click on "Public Git Repository"** tab (should be highlighted)

### 2. Enter Your Repository URL

1. In the input field, paste your public GitHub repository URL:
   ```
   https://github.com/username/everguard-digi-life-integrate-all-branches-20251019
   ```
   *(Replace with your actual repository URL)*

2. Click **"Connect"** button

### 3. Configure Your Service

After connecting, Render will ask you to configure:

**Name:**
- Enter: `everguard-api` (or any name you prefer)

**Root Directory:**
- **IMPORTANT**: Set this to `server`
- This tells Render where your backend code is located

**Branch:**
- Usually `main` or `master`
- Use the branch where your code is

**Runtime:**
- Should auto-detect as **Node**
- If not, select **Node**

**Build Command:**
- Enter: `npm install`

**Start Command:**
- Enter: `npm start`

### 4. Set Environment Variables

Before deploying, add all your environment variables:

1. Click **"Advanced"** or scroll to **"Environment Variables"** section

2. Add these variables:
   ```
   PORT=5001
   NODE_ENV=production
   BDAG_RPC_URL=https://rpc.awakening.bdagscan.com
   PRIVATE_KEY=your_blockdag_private_key
   CONTRACT_ADDRESS=0xb88110dFc4EF51C70bDD7DC6f1e26549EF74c08c
   ENCRYPTION_KEY=your_32_byte_hex_key
   FIREBASE_PROJECT_ID=evergaurd-5d260
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

3. **For Firebase Service Account:**
   - Get your `firebase-service-account.json` file
   - Minify it to one line:
     ```bash
     # On your local machine:
     cat server/secrets/firebase-service-account.json | jq -c
     ```
   - Copy the output and paste as `FIREBASE_SERVICE_ACCOUNT` value

### 5. Deploy!

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Takes ~5-10 minutes for first deployment

---

## Important Notes

### ✅ What Works:
- ✅ Deploying from public repos (even if not owner)
- ✅ Auto-deploy on push (if you have write access)
- ✅ All Render features work normally

### ⚠️ Limitations:
- ⚠️ **Auto-deploy**: Only works if you have write access to the repo
- ⚠️ **Manual updates**: If you don't have write access, you'll need to manually trigger redeploys
- ⚠️ **No PR previews**: PR previews require Git Provider connection (owner access)

### 💡 Pro Tips:
1. **Fork the repo** (if possible) to get full control
2. **Manual redeploy**: You can always click "Manual Deploy" in Render dashboard
3. **Watch the logs**: First deployment takes longer, watch the build logs

---

## After Deployment

1. **Get your backend URL**: `https://your-service-name.onrender.com`
2. **Test health endpoint**: `https://your-service-name.onrender.com/health`
3. **Update frontend**: Use this URL in your Vercel `VITE_API_URL`
4. **Update CORS**: Add your Vercel frontend URL to `ALLOWED_ORIGINS`

---

## Troubleshooting

### "Repository not found"
- Make sure the repository is **public**
- Check the URL is correct
- Try accessing the URL in your browser first

### "Build failed"
- Check that `Root Directory` is set to `server`
- Verify `package.json` exists in `server/` folder
- Check build logs for specific errors

### "Service won't start"
- Verify all environment variables are set
- Check that `FIREBASE_SERVICE_ACCOUNT` is valid JSON (minified)
- Review startup logs in Render dashboard

---

## You're All Set! 🚀

Even without being the repo owner, you can deploy and use the service normally. The only difference is you might need to manually trigger redeploys if you don't have write access to the repository.
