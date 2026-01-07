const mongoose = require('mongoose');

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-marketplace';
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Socket timeout
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 1
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    
    // In production (Vercel), don't exit - let the app start and show better errors
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Running without database connection. Check environment variables and IP whitelist.');
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
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected');
});

module.exports = connectDB;
