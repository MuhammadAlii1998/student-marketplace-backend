const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Books', 'Electronics', 'Furniture', 'Clothing', 'Music', 'Sports', 'Others'],
        message: '{VALUE} is not a valid category'
      }
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ['new', 'like-new', 'good', 'fair'],
        message: '{VALUE} is not a valid condition'
      }
    },
    location: {
      type: String,
      required: [true, 'Location is required']
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function(v) {
          return v && v.length > 0 && v.length <= 6;
        },
        message: 'Product must have 1-6 images'
      }
    },
    image: {
      type: String,
      required: [true, 'Primary image is required']
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'pending', 'reserved'],
      default: 'active'
    },
    views: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for backward compatibility with 'name'
ProductSchema.virtual('name').get(function() {
  return this.title;
});

// Index for better query performance
ProductSchema.index({ seller: 1, createdAt: -1 });
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ status: 1, createdAt: -1 });

// Helper function to extract public ID from Cloudinary URL
function extractPublicId(url) {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  // Get everything after 'upload' and before the file extension
  const pathParts = parts.slice(uploadIndex + 1);
  // Remove version (v1234567890)
  const withoutVersion = pathParts.filter(part => !part.startsWith('v'));
  // Join and remove extension
  const fullPath = withoutVersion.join('/');
  return fullPath.replace(/\.[^/.]+$/, '');
}

// Post-remove hook to delete images from Cloudinary when product is deleted
ProductSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.images && doc.images.length > 0) {
    try {
      const cloudinary = require('../config/cloudinary');
      
      // Delete all images from Cloudinary
      for (const imageUrl of doc.images) {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted image from Cloudinary: ${publicId}`);
        }
      }
    } catch (error) {
      console.error('Error deleting images from Cloudinary:', error.message);
    }
  }
});

module.exports = mongoose.model('Product', ProductSchema);
