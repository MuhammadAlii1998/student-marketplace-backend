const Product = require('../models/product');
const User = require('../models/user');
const cloudinary = require('../config/cloudinary');

// Helper to add isFavorite flag to products
async function addFavoriteFlags(products, userId) {
  if (!userId) return products;
  
  try {
    const user = await User.findById(userId);
    if (!user) return products;
    
    return products.map(product => {
      const productObj = product.toObject ? product.toObject() : product;
      return {
        ...productObj,
        isFavorite: user.favorites.some(fav => fav.toString() === productObj._id.toString())
      };
    });
  } catch (err) {
    return products;
  }
}

// Get all products with filtering, search, and pagination
async function getProducts(req, res) {
  try {
    const {
      category,
      condition,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (category) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    
    if (condition) {
      // Support multiple conditions (comma-separated)
      const conditions = condition.split(',');
      filter.condition = { $in: conditions };
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get products with seller info
    let products = await Product.find(filter)
      .populate('seller', 'name avatar rating reviews university')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add isFavorite flag if user is authenticated
    products = await addFavoriteFlags(products, req.userId);
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getProductById(req, res) {
  try {
    const p = await Product.findById(req.params.id)
      .populate('seller', 'name avatar rating reviews university');
    if (!p) return res.status(404).json({ message: 'Product not found' });
    
    // Check if product is favorite for current user (if authenticated)
    let isFavorite = false;
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user) {
        isFavorite = user.favorites.some(fav => fav.toString() === p._id.toString());
      }
    }
    
    res.json({ ...p.toJSON(), isFavorite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const { title, name, description, price, originalPrice, image, images, category, condition, location } = req.body;
    
    const productData = {
      title: title || name, // Support both 'title' and 'name' for backward compatibility
      description,
      price,
      originalPrice,
      image: image || (images && images[0]),
      images: images || (image ? [image] : []),
      category,
      condition: condition || 'good',
      location,
      seller: req.userId // Will be undefined if not authenticated
    };
    
    const p = new Product(productData);
    const saved = await p.save();
    await saved.populate('seller', 'name avatar rating reviews university');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const { title, name, description, price, originalPrice, image, images, category, condition, location } = req.body;
    
    const updateData = {};
    if (title || name) updateData.title = title || name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (image) updateData.image = image;
    if (images) updateData.images = images;
    if (category) updateData.category = category;
    if (condition) updateData.condition = condition;
    if (location !== undefined) updateData.location = location;
    
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('seller', 'name avatar rating reviews university');
    
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const removed = await Product.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get products by category
async function getProductsByCategory(req, res) {
  try {
    const { category } = req.params;
    let products = await Product.find({ 
      category: { $regex: new RegExp(category, 'i') }
    })
      .populate('seller', 'name avatar rating reviews university')
      .sort({ createdAt: -1 });
    
    // Add isFavorite flag if user is authenticated
    products = await addFavoriteFlags(products, req.userId);
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get seller's products
async function getSellerProducts(req, res) {
  try {
    const { sellerId } = req.params;
    let products = await Product.find({ seller: sellerId })
      .populate('seller', 'name avatar rating reviews university')
      .sort({ createdAt: -1 });
    
    // Add isFavorite flag if user is authenticated
    products = await addFavoriteFlags(products, req.userId);
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get my listings (authenticated user's products)
async function getMyListings(req, res) {
  try {
    const products = await Product.find({ seller: req.userId })
      .populate('seller', 'name avatar rating reviews university')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Upload image to Cloudinary
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // File is already uploaded to Cloudinary by multer middleware
    res.json({
      message: 'Image uploaded successfully',
      url: req.file.path,
      publicId: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Delete image from Cloudinary
async function deleteImage(req, res) {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getSellerProducts,
  getMyListings,
  uploadImage,
  deleteImage
};
