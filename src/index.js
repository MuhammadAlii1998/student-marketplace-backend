require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect DB
connectDB(process.env.MONGO_URI);

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent MongoDB injection

// Logging
app.use(morgan('dev'));

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8082',
  'http://localhost:3000',
  'https://esilv-marketplace.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Student Marketplace API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      auth: '/api/auth',
      categories: '/api/categories',
      cart: '/api/cart'
    }
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));

// Error handling - must be after routes
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_HOST}`);
  console.log(`💾 Database: MongoDB Atlas`);
  console.log(`🔒 Security: Enabled (Helmet, Rate Limiting, Sanitization)`);
});

// Graceful error handling for server listen errors (e.g. EADDRINUSE)
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or set a different PORT environment variable.`);
    console.error(`On macOS you can run: lsof -i :${PORT}  # then kill -9 <PID>`);
    process.exit(1);
  }

  console.error('Server error:', err);
  process.exit(1);
});
