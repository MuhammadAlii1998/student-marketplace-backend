const mongoose = require('mongoose');

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-marketplace';
  try {
    await mongoose.connect(mongoUri, {
      // useNewUrlParser and useUnifiedTopology are default true in modern mongoose
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
