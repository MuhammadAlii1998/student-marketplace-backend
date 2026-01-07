# Student Marketplace — Backend

Simple Express + MongoDB backend for the Student Marketplace with **email verification system**.

## ✨ Features

- 🔐 **JWT Authentication** with email verification
- 📧 **Automated Email Verification** - Users must verify email before login
- 🛍️ **Product Management** - CRUD operations for marketplace items
- 🛒 **Shopping Cart** - Cart management system
- 📁 **Categories** - Product categorization
- ⭐ **Favorites** - Save favorite products
- 👥 **User Profiles** - Student profiles with university verification

## � Environment Setup

### **Local Development**

Your `.env` file should use **localhost** URLs:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=http://localhost:5173
```

**Important:** `FRONTEND_URL` should point to your **local frontend** (e.g., Vite dev server on port 5173)

### **Production (Vercel)**

Set these environment variables in **Vercel Dashboard** → Settings → Environment Variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secure-production-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://esilv-marketplace.netlify.app
```

**Important:** `FRONTEND_URL` should point to your **production frontend** on Netlify

### **Why This Matters**

The `FRONTEND_URL` is used for:
- ✅ Email verification links (e.g., `https://your-frontend.com/verify-email?token=...`)
- ✅ Password reset links
- ✅ Welcome emails

**Correct setup ensures:**
- Development: Links point to `localhost:5173` → Works on your machine
- Production: Links point to `https://esilv-marketplace.netlify.app` → Works for users

---

## �🚀 Quick Start

1. **Copy environment file and configure:**
```bash
cp .env.example .env
# Edit .env with your credentials and set FRONTEND_URL=http://localhost:5173
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start in development mode:**
```bash
npm run dev
```

4. **Health check:** http://localhost:3000/api/health

## 📧 Email Verification Setup

**Email verification is required for all users.**

### Gmail Setup (Free):
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: Security > App passwords
3. Add credentials to `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```
4. Test configuration: `npm run test-gmail`

**📖 Full Guide:** See `GMAIL_QUICK_START.md` for complete setup instructions

**📚 Documentation:** See `EMAIL_VERIFICATION_GUIDE.md` for detailed API docs

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user (sends verification email)
- `POST /api/auth/login` — Login (requires verified email)
- `GET /api/auth/verify-email?token=...` — Verify email address
- `POST /api/auth/resend-verification` — Resend verification email
- `POST /api/auth/forgot-password` — Request password reset email
- `POST /api/auth/reset-password` — Reset password with token
- `GET /api/auth/profile` — Get user profile (protected)
- `PUT /api/auth/profile` — Update profile (protected)

### Products
- `GET /api/products` — List all products
- `POST /api/products` — Create product (protected)
- `GET /api/products/:id` — Get single product
- `PUT /api/products/:id` — Update product (protected)
- `DELETE /api/products/:id` — Delete product (protected)

### Categories
- `GET /api/categories` — List all categories
- `POST /api/categories` — Create category (protected)

### Cart
- `GET /api/cart` — Get user's cart (protected)
- `POST /api/cart` — Add item to cart (protected)
- `PUT /api/cart/:itemId` — Update cart item (protected)
- `DELETE /api/cart/:itemId` — Remove from cart (protected)

### Favorites
- `GET /api/auth/favorites` — Get user's favorites (protected)
- `POST /api/auth/favorites/:productId` — Add to favorites (protected)
- `DELETE /api/auth/favorites/:productId` — Remove from favorites (protected)

## 🧪 Testing

### Automated Email Verification Test
```bash
node src/test/emailVerificationTest.js
```

### API Endpoint Tests
```bash
npm run test-api
```

### Manual Testing with cURL
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@edu.devinci.fr",
    "password": "password123",
    "studentId": "123456"
  }'

# Check email, then verify with token from email
curl -X GET "http://localhost:3000/api/auth/verify-email?token=YOUR_TOKEN"

# Login after verification
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edu.devinci.fr",
    "password": "password123"
  }'

# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edu.devinci.fr"
  }'

# Reset password (use token from email)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "newPassword": "newPassword123"
  }'
```

## 🌱 Seed Database

Seed sample data:
```bash
npm run seed
```

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending

## 📁 Project Structure

```
src/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── authController.js     # Authentication & email verification
│   ├── productController.js  # Product operations
│   ├── cartController.js     # Cart management
│   └── categoryController.js # Category operations
├── models/
│   ├── user.js              # User model (with email verification)
│   ├── product.js           # Product model
│   ├── cart.js              # Cart model
│   └── category.js          # Category model
├── routes/
│   ├── auth.js              # Auth routes
│   ├── products.js          # Product routes
│   ├── cart.js              # Cart routes
│   └── categories.js        # Category routes
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── utils/
│   └── emailService.js      # Email sending service
├── test/
│   ├── endpointsTest.js     # API endpoint tests
│   └── emailVerificationTest.js  # Email verification tests
├── index.js                 # App entry point
└── seed.js                  # Database seeding script
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Email verification required
- ✅ Protected routes with authentication middleware
- ✅ ESILV email domain validation
- ✅ Secure verification tokens (24-hour expiration)
- ✅ Student ID validation

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://your-frontend-domain.com
```

**Note:** For production, continue using Gmail with App Password (free and reliable) or consider upgrading to Google Workspace for higher sending limits.

## � Vercel Deployment

### Prerequisites
1. Push your code to GitHub
2. Have a MongoDB Atlas account (free tier works)

### Step 1: Configure MongoDB Atlas
**IMPORTANT:** Vercel uses dynamic IPs, so you must whitelist all IPs:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster → **Network Access**
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (or add `0.0.0.0/0`)
5. Click **Confirm**

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure **Environment Variables**:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production-12345
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://esilv-marketplace.netlify.app
NODE_ENV=production
```

5. Click **Deploy**

### Step 3: Verify Deployment
1. Check deployment logs for successful MongoDB connection
2. Test API endpoint: `https://your-app.vercel.app/api/health`
3. If MongoDB timeout errors occur, verify:
   - MongoDB Atlas IP whitelist includes `0.0.0.0/0`
   - `MONGO_URI` environment variable is correct in Vercel
   - Connection string includes proper credentials

### Common Vercel Issues

**MongoDB Connection Timeout:**
- ✅ Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access
- ✅ Ensure `MONGO_URI` is set in Vercel Environment Variables
- ✅ Check MongoDB Atlas cluster is running (not paused)

**CORS Errors:**
- ✅ Add your frontend URL to Vercel environment variable `FRONTEND_URL`
- ✅ Push latest code with CORS configuration

**Environment Variables Not Working:**
- ✅ After adding/changing env vars, click **"Redeploy"** in Vercel

## �📚 Documentation

- `GMAIL_QUICK_START.md` - Quick Gmail setup guide
- `GMAIL_SETUP_GUIDE.md` - Detailed Gmail configuration instructions
- `EMAIL_VERIFICATION_GUIDE.md` - Complete email verification documentation
- `.env.example` - Environment variable template

## 🐛 Troubleshooting

### Email Issues
- **Emails not sending?** Check `.env` credentials and console logs
- **Gmail not working?** Use App Password, not regular password
- **Test configuration:** Run `npm run test-gmail` to verify setup

### Database Issues
- Make sure MongoDB is running locally or connection string is correct
- Run `npm run seed` to populate initial data

### Authentication Issues
- Verify JWT_SECRET is set in `.env`
- Check user email is verified before login
- Use Postman to test API endpoints

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Need help?** Check the documentation files or open an issue.

