const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    reservedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required']
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE'
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [1, 'Duration must be at least 1 minute'],
      max: [1440, 'Duration cannot exceed 24 hours (1440 minutes)']
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for better query performance
ReservationSchema.index({ product: 1, status: 1 });
ReservationSchema.index({ user: 1, status: 1 });
ReservationSchema.index({ expiresAt: 1, status: 1 });
ReservationSchema.index({ status: 1, expiresAt: 1 });

// Virtual to check if reservation is currently active and not expired
ReservationSchema.virtual('isActive').get(function() {
  return this.status === 'ACTIVE' && new Date() < this.expiresAt;
});

// Virtual to get remaining time in minutes
ReservationSchema.virtual('remainingMinutes').get(function() {
  if (this.status !== 'ACTIVE' || new Date() >= this.expiresAt) {
    return 0;
  }
  const diff = this.expiresAt - new Date();
  return Math.ceil(diff / (1000 * 60));
});

// Pre-save middleware to ensure expiresAt is set correctly
ReservationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + this.durationMinutes * 60 * 1000);
  }
  next();
});

// Static method to find active reservation for a product
ReservationSchema.statics.findActiveReservation = async function(productId) {
  return this.findOne({
    product: productId,
    status: 'ACTIVE',
    expiresAt: { $gt: new Date() }
  }).populate('user', 'name email');
};

// Static method to expire all reservations that have passed their expiry time
ReservationSchema.statics.expireOldReservations = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'ACTIVE',
      expiresAt: { $lte: now }
    },
    {
      $set: { status: 'EXPIRED' }
    }
  );
  return result;
};

// Instance method to cancel reservation
ReservationSchema.methods.cancel = async function() {
  if (this.status !== 'ACTIVE') {
    throw new Error('Only active reservations can be cancelled');
  }
  this.status = 'CANCELLED';
  return this.save();
};

// Instance method to check if user owns this reservation
ReservationSchema.methods.isOwnedBy = function(userId) {
  return this.user.toString() === userId.toString();
};

module.exports = mongoose.model('Reservation', ReservationSchema);
