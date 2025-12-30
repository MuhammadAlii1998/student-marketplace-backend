const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String },
  images: [{ type: String }],
  category: { type: String, required: true },
  condition: { 
    type: String, 
    enum: ['new', 'like-new', 'good', 'fair'],
    required: true 
  },
  location: { type: String },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now }
});

// Virtual for backward compatibility with 'name'
ProductSchema.virtual('name').get(function() {
  return this.title;
});

ProductSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
