const Chat = require('../models/chat');
const Message = require('../models/message');
const mongoose = require('mongoose');

/**
 * Create or get existing chat
 * POST /api/chats
 */
async function createOrGetChat(req, res) {
  try {
    const { buyerId, sellerId, productId } = req.body;
    const userId = req.userId;

    // Validate input
    if (!buyerId || !sellerId || !productId) {
      return res.status(400).json({
        message: 'buyerId, sellerId, and productId are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(buyerId) ||
        !mongoose.Types.ObjectId.isValid(sellerId) ||
        !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Ensure buyer and seller are different
    if (buyerId === sellerId) {
      return res.status(400).json({
        message: 'Buyer and seller must be different users'
      });
    }

    // Check if requesting user is either buyer or seller
    if (userId !== buyerId && userId !== sellerId) {
      return res.status(403).json({
        message: 'You must be either the buyer or seller to create this chat'
      });
    }

    // Try to find existing chat
    let chat = await Chat.findByParticipants(buyerId, sellerId, productId);

    if (chat) {
      // Chat exists and is not expired
      return res.json({
        message: 'Chat retrieved successfully',
        chat,
        isNew: false
      });
    }

    // Create new chat
    chat = new Chat({
      buyer: buyerId,
      seller: sellerId,
      product: productId,
      lastMessageAt: new Date()
    });

    await chat.save();

    // Populate fields
    await chat.populate('buyer', 'name email avatar');
    await chat.populate('seller', 'name email avatar');
    await chat.populate('product', 'title price image');

    res.status(201).json({
      message: 'Chat created successfully',
      chat,
      isNew: true
    });

  } catch (error) {
    console.error('Error creating/getting chat:', error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      try {
        const { buyerId, sellerId, productId } = req.body;
        const chat = await Chat.findByParticipants(buyerId, sellerId, productId);
        return res.json({
          message: 'Chat retrieved successfully',
          chat,
          isNew: false
        });
      } catch (err) {
        return res.status(500).json({
          message: 'Error retrieving chat',
          error: err.message
        });
      }
    }

    res.status(500).json({
      message: 'Error creating chat',
      error: error.message
    });
  }
}

/**
 * Get user's chats
 * GET /api/chats
 */
async function getUserChats(req, res) {
  try {
    const userId = req.userId;

    const chats = await Chat.findUserChats(userId);

    // Get unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          receiver: userId,
          read: false
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json({
      chats: chatsWithUnread,
      total: chatsWithUnread.length
    });

  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      message: 'Error fetching chats',
      error: error.message
    });
  }
}

/**
 * Get chat by ID
 * GET /api/chats/:chatId
 */
async function getChatById(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId)
      .populate('buyer', 'name email avatar')
      .populate('seller', 'name email avatar')
      .populate('product', 'title price image');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if expired
    if (chat.isExpired) {
      return res.status(410).json({
        message: 'This chat has expired',
        expiredAt: chat.expiresAt
      });
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        message: 'You are not a participant in this chat'
      });
    }

    res.json({ chat });

  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      message: 'Error fetching chat',
      error: error.message
    });
  }
}

/**
 * Get chat messages
 * GET /api/chats/:chatId/messages
 */
async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if expired
    if (chat.isExpired) {
      return res.status(410).json({
        message: 'This chat has expired',
        expiredAt: chat.expiresAt
      });
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        message: 'You are not a participant in this chat'
      });
    }

    // Get messages
    const result = await Message.getChatMessages(chatId, parseInt(page), parseInt(limit));

    // Mark messages as read
    await Message.markAsRead(chatId, userId);

    res.json(result);

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      message: 'Error fetching messages',
      error: error.message
    });
  }
}

/**
 * Delete chat
 * DELETE /api/chats/:chatId
 */
async function deleteChat(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId).session(session);

    if (!chat) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.isParticipant(userId)) {
      await session.abortTransaction();
      return res.status(403).json({
        message: 'You are not a participant in this chat'
      });
    }

    // Delete all messages in this chat
    await Message.deleteByChatId(chatId).session(session);

    // Delete chat
    await chat.deleteOne({ session });

    await session.commitTransaction();

    res.json({
      message: 'Chat and all messages deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting chat:', error);
    res.status(500).json({
      message: 'Error deleting chat',
      error: error.message
    });
  } finally {
    session.endSession();
  }
}

/**
 * Get unread message count
 * GET /api/chats/unread/count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.userId;
    const count = await Message.getUnreadCount(userId);

    res.json({ unreadCount: count });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      message: 'Error fetching unread count',
      error: error.message
    });
  }
}

module.exports = {
  createOrGetChat,
  getUserChats,
  getChatById,
  getChatMessages,
  deleteChat,
  getUnreadCount
};
