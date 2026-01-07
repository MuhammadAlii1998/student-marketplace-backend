require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function deleteAllUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Count users before deletion
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} user(s) in database`);

    if (userCount === 0) {
      console.log('ℹ️  No users to delete');
      process.exit(0);
    }

    // Delete all users
    const result = await User.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} user(s)`);

    // Verify deletion
    const remainingUsers = await User.countDocuments();
    console.log(`📊 Remaining users: ${remainingUsers}`);

    console.log('✅ User deletion completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllUsers();
