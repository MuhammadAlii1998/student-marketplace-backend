/**
 * Create Database Indexes for Chat and Message Collections
 * Includes TTL indexes for automatic deletion
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('../models/chat');
const Message = require('../models/message');

async function createChatIndexes() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Ensuring indexes for Chat collection...');
    try {
      await Chat.syncIndexes();
      console.log('✅ Chat indexes synchronized');
    } catch (err) {
      console.log('⚠️  Chat indexes already exist, skipping creation');
    }

    console.log('\n🔄 Ensuring indexes for Message collection...');
    try {
      await Message.syncIndexes();
      console.log('✅ Message indexes synchronized');
    } catch (err) {
      console.log('⚠️  Message indexes already exist, skipping creation');
    }

    // List Chat indexes
    const chatIndexes = await Chat.collection.getIndexes();
    console.log('\n📋 Chat collection indexes:');
    Object.keys(chatIndexes).forEach(indexName => {
      console.log(`  - ${indexName}`);
      if (chatIndexes[indexName].expireAfterSeconds !== undefined) {
        console.log(`    ⏰ TTL: ${chatIndexes[indexName].expireAfterSeconds} seconds`);
      }
    });

    // List Message indexes
    const messageIndexes = await Message.collection.getIndexes();
    console.log('\n📋 Message collection indexes:');
    Object.keys(messageIndexes).forEach(indexName => {
      console.log(`  - ${indexName}`);
      if (messageIndexes[indexName].expireAfterSeconds !== undefined) {
        const days = messageIndexes[indexName].expireAfterSeconds / (24 * 60 * 60);
        console.log(`    ⏰ TTL: ${days} days`);
      }
    });

    // Get collection stats
    const chatStats = await Chat.collection.stats();
    const messageStats = await Message.collection.stats();

    console.log('\n📊 Collection statistics:');
    console.log(`  Chat collection:`);
    console.log(`    - Documents: ${chatStats.count}`);
    console.log(`    - Total index size: ${Math.round(chatStats.totalIndexSize / 1024)} KB`);
    console.log(`  Message collection:`);
    console.log(`    - Documents: ${messageStats.count}`);
    console.log(`    - Total index size: ${Math.round(messageStats.totalIndexSize / 1024)} KB`);

    console.log('\n✅ Index creation complete!');
    console.log('\n⏰ TTL Index Information:');
    console.log('  - Chats will be auto-deleted when expiresAt < current time');
    console.log('  - Messages will be auto-deleted 7 days after creation');
    console.log('  - MongoDB TTL monitor runs every 60 seconds');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    process.exit(1);
  }
}

createChatIndexes();
