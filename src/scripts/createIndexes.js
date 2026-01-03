require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/product');
const User = require('../models/user');
const Category = require('../models/category');

async function createIndexes() {
  try {
    await connectDB(process.env.MONGO_URI);
    
    console.log('Creating database indexes...\n');

    // User indexes (already have email and studentId unique indexes)
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ studentId: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ isEmailVerified: 1 }, { background: true });
    await User.collection.createIndex({ createdAt: -1 }, { background: true });
    console.log('✅ User indexes created');

    // Product indexes for search and filtering
    await Product.collection.createIndex({ title: 'text', description: 'text' }, { background: true });
    await Product.collection.createIndex({ category: 1 }, { background: true });
    await Product.collection.createIndex({ seller: 1 }, { background: true });
    await Product.collection.createIndex({ price: 1 }, { background: true });
    await Product.collection.createIndex({ condition: 1 }, { background: true });
    await Product.collection.createIndex({ isSold: 1 }, { background: true });
    await Product.collection.createIndex({ createdAt: -1 }, { background: true });
    console.log('✅ Product indexes created');

    // Category indexes
    await Category.collection.createIndex({ slug: 1 }, { unique: true, background: true });
    await Category.collection.createIndex({ name: 1 }, { background: true });
    console.log('✅ Category indexes created');

    console.log('\n🎉 All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
