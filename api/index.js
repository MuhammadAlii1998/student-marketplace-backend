require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('../src/config/db');
const { apiLimiter } = require('../src/middleware/rateLimiter');

const app = express();

// Initialize DB connection (cached in serverless)
let dbConnected = false;

async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDB(process.env.MONGO_URI);
    dbConnected = true;
  }
}

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent MongoDB injection

// Logging
app.use(morgan('dev'));

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration - MUST be before routes
const corsOptions = {
  origin: function (origin, callback) {
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
    
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Middleware to ensure DB connection before each request
app.use(async (req, res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: 'Database connection failed',
      details: error.message 
    });
  }
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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
      cart: '/api/cart',
      reservations: '/api/reservations',
      chats: '/api/chats'
    },
    note: 'Chat REST API is available. Real-time WebSocket features require polling or alternative implementation.'
  });
});

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbConnected = mongoose.connection.readyState === 1;
  
  res.json({ 
    status: 'ok',
    server: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Diagnostic endpoint to check MongoDB connection and environment
app.get('/api/diagnostic', async (req, res) => {
  const mongoose = require('mongoose');
  
  const diagnostic = {
    server: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'not set',
    mongodb: {
      connectionState: mongoose.connection.readyState,
      stateDescription: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriPrefix: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'NOT SET',
      databaseName: mongoose.connection.name || 'not connected',
      host: mongoose.connection.host || 'not connected',
      port: mongoose.connection.port || 'not connected',
      error: mongoose.connection.error || 'none'
    },
    environmentVariables: {
      hasFrontendUrl: !!process.env.FRONTEND_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasEmailHost: !!process.env.EMAIL_HOST,
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPassword: !!process.env.EMAIL_PASSWORD
    },
    troubleshooting: {
      message: mongoose.connection.readyState === 1 
        ? 'Database connected successfully!' 
        : mongoose.connection.readyState === 2
        ? 'Connecting to database...'
        : '❌ CRITICAL: Database disconnected. Check: 1) MONGO_URI is set in Vercel Environment Variables, 2) MongoDB Atlas Network Access allows 0.0.0.0/0, 3) Wait 2-3 minutes after changing Network Access, 4) Redeploy on Vercel',
      checkVercelLogs: 'Go to Vercel Dashboard → Deployments → Click latest → View Function Logs to see detailed connection errors'
    }
  };
  
  // Try to perform a simple database operation to verify connection
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      diagnostic.databaseTest = 'Ping successful ✅';
    } catch (err) {
      diagnostic.databaseTest = `Ping failed: ${err.message}`;
    }
  }
  
  res.json(diagnostic);
});

// API Routes
app.use('/api/products', require('../src/routes/products'));
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/categories', require('../src/routes/categories'));
app.use('/api/cart', require('../src/routes/cart'));
app.use('/api/reservations', require('../src/routes/reservations'));

// Chat routes - REST API endpoints work in serverless (WebSocket handled by frontend polling)
app.use('/api/chats', require('../src/routes/chats'));

// Error handling - must be after routes
const { notFound, errorHandler } = require('../src/middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;
