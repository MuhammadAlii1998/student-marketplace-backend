require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function listAndDeleteUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // List all users
    const users = await User.find({}, 'name email studentId createdAt');
    console.log(`\n📊 Found ${users.length} user(s) in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Student ID: ${user.studentId}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('ℹ️  No users to delete');
      process.exit(0);
    }

    // Delete all users
    const result = await User.deleteMany({});
    console.log(`\n🗑️  Deleted ${result.deletedCount} user(s)`);

    // Verify deletion
    const remainingUsers = await User.countDocuments();
    console.log(`📊 Remaining users: ${remainingUsers}`);

    if (remainingUsers === 0) {
      console.log('✅ All users deleted successfully!');
    } else {
      console.log('⚠️  Warning: Some users may still exist');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAndDeleteUsers();
