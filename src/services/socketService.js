const jwt = require('jsonwebtoken');
const Chat = require('../models/chat');
const Message = require('../models/message');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiting map: userId -> { count, resetTime }
const messageRateLimits = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX = 10; // 10 messages per second

/**
 * Check rate limit for user
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = messageRateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    messageRateLimits.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  userLimit.count++;
  return true;
}

/**
 * Authenticate socket connection
 */
function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    
    console.log(`✅ Socket authenticated: User ${socket.userId}`);
    next();

  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Invalid authentication token'));
  }
}

/**
 * Verify user is participant of chat
 */
async function verifyParticipant(socket, chatId) {
  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return { error: 'Chat not found', code: 404 };
    }

    if (chat.isExpired) {
      return { error: 'Chat has expired', code: 410 };
    }

    if (!chat.isParticipant(socket.userId)) {
      return { error: 'You are not a participant in this chat', code: 403 };
    }

    return { chat };

  } catch (error) {
    console.error('Error verifying participant:', error);
    return { error: 'Internal server error', code: 500 };
  }
}

/**
 * Initialize Socket.IO event handlers
 */
function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId})`);

    // Join chat room
    socket.on('join_chat', async ({ chatId }) => {
      try {
        console.log(`📥 User ${socket.userId} joining chat ${chatId}`);

        // Verify participant
        const { error, code, chat } = await verifyParticipant(socket, chatId);
        
        if (error) {
          socket.emit('error', { message: error, code });
          return;
        }

        // Join room
        socket.join(chatId);
        socket.currentChatId = chatId;

        console.log(`✅ User ${socket.userId} joined chat ${chatId}`);

        socket.emit('joined_chat', {
          chatId,
          message: 'Successfully joined chat',
          chat
        });

      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat', code: 500 });
      }
    });

    // Send message
    socket.on('send_message', async ({ chatId, message }) => {
      try {
        console.log(`📨 Message from ${socket.userId} to chat ${chatId}`);

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          socket.emit('error', { message: 'Invalid message content', code: 400 });
          return;
        }

        if (message.length > 2000) {
          socket.emit('error', { message: 'Message too long (max 2000 characters)', code: 400 });
          return;
        }

        // Check rate limit
        if (!checkRateLimit(socket.userId)) {
          socket.emit('error', { 
            message: 'Rate limit exceeded. Please slow down.', 
            code: 429 
          });
          return;
        }

        // Verify participant
        const { error, code, chat } = await verifyParticipant(socket, chatId);
        
        if (error) {
          socket.emit('error', { message: error, code });
          return;
        }

        // Determine receiver
        const receiverId = chat.getOtherParticipant(socket.userId)._id;

        // Create message
        const newMessage = new Message({
          chat: chatId,
          sender: socket.userId,
          receiver: receiverId,
          content: message.trim()
        });

        await newMessage.save();

        // Update chat's last message time (extends expiry)
        await chat.updateLastMessage();

        // Populate sender info
        await newMessage.populate('sender', 'name avatar');

        console.log(`✅ Message saved: ${newMessage._id}`);

        // Emit to all participants in the room
        io.to(chatId).emit('receive_message', {
          message: newMessage,
          chatId
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { 
          message: 'Failed to send message', 
          code: 500,
          details: error.message 
        });
      }
    });

    // Typing indicator
    socket.on('typing', async ({ chatId }) => {
      try {
        const { error } = await verifyParticipant(socket, chatId);
        
        if (error) {
          return;
        }

        // Broadcast to other users in the room (not sender)
        socket.to(chatId).emit('user_typing', {
          userId: socket.userId,
          chatId
        });

      } catch (error) {
        console.error('Error handling typing event:', error);
      }
    });

    // Stop typing indicator
    socket.on('stop_typing', async ({ chatId }) => {
      try {
        const { error } = await verifyParticipant(socket, chatId);
        
        if (error) {
          return;
        }

        socket.to(chatId).emit('user_stop_typing', {
          userId: socket.userId,
          chatId
        });

      } catch (error) {
        console.error('Error handling stop typing event:', error);
      }
    });

    // Leave chat room
    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(chatId);
      console.log(`👋 User ${socket.userId} left chat ${chatId}`);
    });

    // Mark messages as read
    socket.on('mark_read', async ({ chatId }) => {
      try {
        const { error } = await verifyParticipant(socket, chatId);
        
        if (error) {
          return;
        }

        await Message.markAsRead(chatId, socket.userId);
        
        // Notify other user that messages were read
        socket.to(chatId).emit('messages_read', {
          chatId,
          readBy: socket.userId
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id} (User: ${socket.userId})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.IO handlers initialized');
}

module.exports = {
  authenticateSocket,
  initializeSocketHandlers
};
