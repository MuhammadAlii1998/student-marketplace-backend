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
      cart: '/api/cart'
    }
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

// DANGER: Delete all users endpoint (use with caution!)
app.delete('/api/admin/delete-all-users', async (req, res) => {
  try {
    const User = require('./models/user');
    
    // Count before deletion
    const beforeCount = await User.countDocuments();
    
    // Delete all users
    const result = await User.deleteMany({});
    
    res.json({
      message: 'All users deleted successfully',
      deletedCount: result.deletedCount,
      beforeCount,
      afterCount: await User.countDocuments()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting users',
      error: error.message 
    });
  }
});

// Diagnostic endpoint to check MongoDB connection and environment
app.get('/api/diagnostic', async (req, res) => {
  const mongoose = require('mongoose');
  
  // Try to connect if not connected
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        family: 4
      });
    } catch (connectError) {
      // Catch and return the error
      return res.json({
        server: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'not set',
        mongodb: {
          connectionState: 0,
          stateDescription: 'disconnected',
          connectionError: {
            name: connectError.name,
            message: connectError.message,
            code: connectError.code,
            reason: connectError.reason ? connectError.reason.toString() : 'none'
          }
        },
        troubleshooting: {
          errorDetails: connectError.toString()
        }
      });
    }
  }
  
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
        ? '❌ CRITICAL: MongoDB Atlas is BLOCKING Vercel connections. You MUST: 1) Go to MongoDB Atlas → Network Access → Add IP Address → ALLOW ACCESS FROM ANYWHERE (0.0.0.0/0). 2) Wait 2-3 minutes. 3) Redeploy on Vercel. Without this, your app CANNOT work.'
        : 'Database is disconnected. Check MONGO_URI environment variable and MongoDB Atlas settings.',
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
