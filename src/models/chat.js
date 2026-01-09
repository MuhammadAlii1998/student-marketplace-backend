const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required']
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required']
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true // TTL index will be created on this field
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index - one chat per buyer-seller-product combination
ChatSchema.index({ buyer: 1, seller: 1, product: 1 }, { unique: true });

// Index for finding user's chats
ChatSchema.index({ buyer: 1, expiresAt: 1 });
ChatSchema.index({ seller: 1, expiresAt: 1 });

// TTL index - automatically delete expired chats
// MongoDB will delete documents where expiresAt < current time
ChatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual to check if chat is expired
ChatSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual to get days remaining
ChatSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diff = this.expiresAt - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
});

// Pre-save middleware to set expiresAt
ChatSchema.pre('save', function(next) {
  // Set expiresAt to 7 days from lastMessageAt
  if (this.isModified('lastMessageAt') || this.isNew) {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(this.lastMessageAt.getTime() + SEVEN_DAYS);
  }
  next();
});

// Static method to find chat by participants and product
ChatSchema.statics.findByParticipants = async function(buyerId, sellerId, productId) {
  return this.findOne({
    buyer: buyerId,
    seller: sellerId,
    product: productId,
    expiresAt: { $gt: new Date() } // Not expired
  }).populate('buyer', 'name email avatar')
    .populate('seller', 'name email avatar')
    .populate('product', 'title price image');
};

// Static method to find user's active chats
ChatSchema.statics.findUserChats = async function(userId) {
  return this.find({
    $or: [
      { buyer: userId },
      { seller: userId }
    ],
    expiresAt: { $gt: new Date() }
  })
    .populate('buyer', 'name email avatar')
    .populate('seller', 'name email avatar')
    .populate('product', 'title price image')
    .sort({ lastMessageAt: -1 });
};

// Instance method to check if user is participant
ChatSchema.methods.isParticipant = function(userId) {
  return this.buyer._id.toString() === userId.toString() || 
         this.seller._id.toString() === userId.toString();
};

// Instance method to get other participant
ChatSchema.methods.getOtherParticipant = function(userId) {
  if (this.buyer._id.toString() === userId.toString()) {
    return this.seller;
  }
  return this.buyer;
};

// Instance method to update last message time and extend expiry
ChatSchema.methods.updateLastMessage = async function() {
  this.lastMessageAt = new Date();
  // expiresAt will be automatically updated by pre-save hook
  return this.save();
};

module.exports = mongoose.model('Chat', ChatSchema);
