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

## 🚀 Quick Start

1. **Copy environment file and configure:**
```bash
cp .env.example .env
# Edit .env with your email credentials (see GMAIL_QUICK_START.md)
```

2. **Install dependencies:**
```bash
cd /Users/Apple/Downloads/Data/student-marketplace-backend
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
    "studentId": "1234567"
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

## 📚 Documentation

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

