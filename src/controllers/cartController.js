const Cart = require('../models/cart');

// Get user's cart
async function getCart(req, res) {
  try {
    // If no user is authenticated, return an empty cart for guests
    if (!req.userId) {
      return res.json({ items: [] });
    }
    
    let cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart) {
      cart = { user: req.userId, items: [] };
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Add item to cart
async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;
    
    let cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }
    
    // Check if product already in cart
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.product');
    
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Update item quantity
async function updateCartItem(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }
    
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.product');
    
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Remove item from cart
async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate('items.product');
    
    res.json({ message: 'Item removed', cart });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Clear cart
async function clearCart(req, res) {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (cart) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
