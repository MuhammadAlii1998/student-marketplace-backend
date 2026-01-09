const mongoose = require('mongoose');
const validator = require('validator');

const MessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat is required'],
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });

// TTL index - automatically delete messages after 7 days
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Pre-save validation - sanitize content
MessageSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Remove HTML tags to prevent XSS
    this.content = validator.escape(this.content);
    
    // Trim whitespace
    this.content = this.content.trim();
    
    // Check if empty after sanitization
    if (!this.content || this.content.length === 0) {
      return next(new Error('Message content cannot be empty'));
    }
  }
  next();
});

// Static method to get chat messages with pagination
MessageSchema.statics.getChatMessages = async function(chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ chat: chatId })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
  
  const total = await this.countDocuments({ chat: chatId });
  
  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to mark messages as read
MessageSchema.statics.markAsRead = async function(chatId, userId) {
  return this.updateMany(
    {
      chat: chatId,
      receiver: userId,
      read: false
    },
    {
      read: true,
      readAt: new Date()
    }
  );
};

// Static method to get unread count
MessageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    read: false
  });
};

// Static method to delete messages by chat
MessageSchema.statics.deleteByChatId = async function(chatId) {
  return this.deleteMany({ chat: chatId });
};

module.exports = mongoose.model('Message', MessageSchema);
