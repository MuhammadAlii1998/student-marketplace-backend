const mongoose = require('mongoose');

// Set mongoose options globally before any connections
mongoose.set('bufferTimeoutMS', 20000); // Buffer timeout for serverless
mongoose.set('strictQuery', false);

// Global connection cache for serverless (Vercel)
let cachedConnection = null;

async function connectDB(uri) {
  // Return cached connection if available (important for serverless)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Using cached MongoDB connection');
    return cachedConnection;
  }

  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-marketplace';
  
  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection string prefix:', mongoUri.substring(0, 30) + '...');
  console.log('📍 Has MONGO_URI:', !!process.env.MONGO_URI);
  console.log('📍 Environment:', process.env.NODE_ENV);
  
  try {
    // Optimized for serverless (Vercel)
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // Reduced for serverless
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: process.env.NODE_ENV === 'production' ? 1 : 10, // 1 for serverless
      minPoolSize: process.env.NODE_ENV === 'production' ? 1 : 5,
      family: 4 // Force IPv4
    });
    
    cachedConnection = connection;
    
    cachedConnection = connection;
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
    
    return connection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error Details:');
    console.error('   Error Name:', err.name);
    console.error('   Error Message:', err.message);
    console.error('   Error Code:', err.code);
    console.error('   Error Reason:', err.reason);
    if (err.cause) {
      console.error('   Error Cause:', err.cause);
    }
    console.error('   Stack:', err.stack);
    
    // In production (Vercel), don't exit - let the app start and show better errors
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Running without database connection.');
      console.error('⚠️  CRITICAL: MongoDB Atlas is not accessible from Vercel.');
      console.error('⚠️  ACTION REQUIRED: Add 0.0.0.0/0 to Network Access in MongoDB Atlas');
    } else {
      process.exit(1);
    }
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
  console.error('   Error details:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Log connection attempts
mongoose.connection.on('connecting', () => {
  console.log('🔄 Mongoose attempting to connect...');
});

mongoose.connection.on('close', () => {
  console.log('⚠️  Mongoose connection closed');
});

module.exports = connectDB;
