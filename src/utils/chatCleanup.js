const Chat = require('../models/chat');
const Message = require('../models/message');

/**
 * Cleanup expired chats and their messages
 * This is a safety mechanism in addition to MongoDB TTL indexes
 */
async function cleanupExpiredChats() {
  try {
    console.log('🔄 Running chat cleanup job...');

    const now = new Date();

    // Find expired chats
    const expiredChats = await Chat.find({
      expiresAt: { $lte: now }
    });

    if (expiredChats.length === 0) {
      console.log('✅ No expired chats found');
      return { deleted: 0, messagesDeleted: 0 };
    }

    console.log(`Found ${expiredChats.length} expired chat(s)`);

    let deletedChats = 0;
    let deletedMessages = 0;

    // Delete each expired chat and its messages
    for (const chat of expiredChats) {
      try {
        // Delete messages
        const messageResult = await Message.deleteByChatId(chat._id);
        deletedMessages += messageResult.deletedCount || 0;

        // Delete chat
        await chat.deleteOne();
        deletedChats++;

        console.log(`  ✓ Deleted chat ${chat._id} and ${messageResult.deletedCount || 0} messages`);

      } catch (err) {
        console.error(`  ✗ Error deleting chat ${chat._id}:`, err.message);
      }
    }

    console.log(`✅ Cleanup complete: ${deletedChats} chats and ${deletedMessages} messages deleted`);

    return {
      deleted: deletedChats,
      messagesDeleted: deletedMessages
    };

  } catch (error) {
    console.error('❌ Error in chat cleanup job:', error.message);
    throw error;
  }
}

/**
 * Start the cleanup job
 * Runs every hour to check for expired chats
 */
function startChatCleanupJob(intervalMs = 60 * 60 * 1000) { // Default: 1 hour
  console.log('🚀 Starting chat cleanup job (runs every hour)');
  
  // Run immediately on startup
  cleanupExpiredChats().catch(err => {
    console.error('Error in initial chat cleanup:', err.message);
  });

  // Then run at specified interval
  const intervalId = setInterval(() => {
    cleanupExpiredChats().catch(err => {
      console.error('Error in scheduled chat cleanup:', err.message);
    });
  }, intervalMs);

  return intervalId;
}

/**
 * Stop the cleanup job
 */
function stopChatCleanupJob(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Stopped chat cleanup job');
  }
}

/**
 * Get chat statistics
 */
async function getChatStatistics() {
  try {
    const totalChats = await Chat.countDocuments();
    const activeChats = await Chat.countDocuments({
      expiresAt: { $gt: new Date() }
    });
    const expiredChats = totalChats - activeChats;
    const totalMessages = await Message.countDocuments();

    return {
      totalChats,
      activeChats,
      expiredChats,
      totalMessages
    };
  } catch (error) {
    console.error('Error getting chat statistics:', error);
    throw error;
  }
}

module.exports = {
  cleanupExpiredChats,
  startChatCleanupJob,
  stopChatCleanupJob,
  getChatStatistics
};
