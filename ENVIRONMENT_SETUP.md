# Environment Setup Guide

## 🎯 Overview

This guide ensures your backend works correctly in both **development** (localhost) and **production** (Vercel).

---

## 📋 Environment Variables Reference

| Variable | Development | Production | Purpose |
|----------|-------------|------------|---------|
| `NODE_ENV` | `development` | `production` | Environment mode |
| `PORT` | `3000` | (auto by Vercel) | Server port |
| `MONGO_URI` | Local or Atlas | **Atlas only** | Database connection |
| `JWT_SECRET` | Any string | **Strong secret** | Token signing |
| `EMAIL_HOST` | `smtp.gmail.com` | `smtp.gmail.com` | Email server |
| `EMAIL_PORT` | `587` | `587` | SMTP port |
| `EMAIL_USER` | Your Gmail | Your Gmail | Email account |
| `EMAIL_PASSWORD` | App Password | App Password | Gmail app password |
| **`FRONTEND_URL`** | `http://localhost:5173` | `https://esilv-marketplace.netlify.app` | **CRITICAL** |

---

## 🔧 Local Development Setup

### 1. Create `.env` file

```bash
cp .env.example .env
```

### 2. Edit `.env` with these values:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (use Atlas for convenience)
MONGO_URI=mongodb+srv://muhammadaliz420_db_user:355hcRt0Cl2Dgoix@cluster0.epohfza.mongodb.net/student-marketplace?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-secret-key-change-in-production-12345

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=muhammadaliz420@gmail.com
EMAIL_PASSWORD=levgwqrztwlylpjh

# Frontend - IMPORTANT: Use localhost for development!
FRONTEND_URL=http://localhost:5173
```

### 3. Start the server

```bash
npm run dev
```

### 4. Test

- Backend: http://localhost:3000/api/health
- Register a user → Email link will point to `http://localhost:5173/verify-email?token=...`

---

## 🚀 Production Setup (Vercel)

### 1. Go to Vercel Dashboard

https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### 2. Add all variables:

```
NODE_ENV = production
MONGO_URI = mongodb+srv://muhammadaliz420_db_user:355hcRt0Cl2Dgoix@cluster0.epohfza.mongodb.net/student-marketplace?retryWrites=true&w=majority
JWT_SECRET = your-secret-key-change-in-production-12345
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = muhammadaliz420@gmail.com
EMAIL_PASSWORD = levgwqrztwlylpjh
FRONTEND_URL = https://esilv-marketplace.netlify.app
```

### 3. Important Settings

For each variable:
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development**

### 4. Redeploy

After adding/changing environment variables:
- Go to **Deployments** tab
- Click **⋮** on latest deployment
- Click **Redeploy**

---

## ⚠️ Common Issues

### Issue 1: Email Links Point to Wrong URL

**Symptom:** Verification email links point to `localhost` in production or production URL in development

**Cause:** Wrong `FRONTEND_URL` in environment

**Fix:**
- **Local:** Set `FRONTEND_URL=http://localhost:5173` in `.env`
- **Vercel:** Set `FRONTEND_URL=https://esilv-marketplace.netlify.app` in Vercel dashboard

### Issue 2: "Invalid or Expired Token"

**Symptom:** Verification link shows "Invalid or expired verification token"

**Causes:**
1. Token expired (24 hours)
2. Token already used
3. User re-registered (old token invalidated)

**Fix:**
- Use "Resend Verification Email" button
- Or call: `POST /api/auth/resend-verification` with `{"email": "user@email.com"}`

### Issue 3: CORS Errors

**Symptom:** `Access to fetch blocked by CORS policy`

**Cause:** Frontend URL not in allowed origins

**Fix:**
- Backend already includes common localhost ports and production URL
- If using different port, add to `allowedOrigins` in `src/index.js`

---

## ✅ Verification Checklist

### Development
- [ ] `.env` file exists with all variables
- [ ] `FRONTEND_URL=http://localhost:5173` (or your frontend port)
- [ ] `NODE_ENV=development`
- [ ] Backend runs: `npm run dev` → http://localhost:3000
- [ ] Can register user
- [ ] Email verification link points to `localhost:5173`
- [ ] Email verification works

### Production
- [ ] All environment variables set in Vercel
- [ ] `FRONTEND_URL=https://esilv-marketplace.netlify.app`
- [ ] `NODE_ENV=production`
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Backend deployed: https://student-marketplace-backend.vercel.app
- [ ] Diagnostic endpoint shows connected: `/api/diagnostic`
- [ ] Can register user in production
- [ ] Email verification link points to Netlify
- [ ] Email verification works

---

## 🧪 Testing Both Environments

### Test Development

```bash
# Start backend
npm run dev

# Start frontend (in frontend directory)
npm run dev

# Register at: http://localhost:5173
# Check email → Click link → Should work!
```

### Test Production

```
# Register at: https://esilv-marketplace.netlify.app
# Check email → Click link → Should work!
```

---

## 📝 Quick Reference Commands

```bash
# Development
npm run dev              # Start backend
npm run test-gmail       # Test email configuration
npm run seed             # Seed database with sample data

# Production
# Push to GitHub → Vercel auto-deploys
git push origin main
```

---

## 🆘 Need Help?

1. Check backend health: `/api/health`
2. Check diagnostic: `/api/diagnostic`
3. Check Vercel logs: Dashboard → Deployments → View Function Logs
4. Check MongoDB Atlas: Network Access should have `0.0.0.0/0`

---

**Remember:** The key to working in both environments is setting `FRONTEND_URL` correctly:
- **Development:** `http://localhost:5173`
- **Production:** `https://esilv-marketplace.netlify.app`
