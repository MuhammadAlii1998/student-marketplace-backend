const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register new user
async function register(req, res) {
  try {
    const { name, email, password, university, studentId } = req.body;

    // Validate ESILV email domain
    if (!email.endsWith('@edu.devinci.fr') && !email.endsWith('@devinci.fr')) {
      return res.status(400).json({ 
        message: 'Invalid email domain. Please use your ESILV email (@edu.devinci.fr or @devinci.fr)' 
      });
    }

    // Validate student ID format (7 digits)
    if (!studentId || !/^\d{7}$/.test(studentId)) {
      return res.status(400).json({ 
        message: 'Invalid student ID. Must be exactly 7 digits (e.g., 7277000)' 
      });
    }

    // Check if user exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if student ID already exists
    const existingStudentId = await User.findOne({ studentId });
    if (existingStudentId) {
      return res.status(400).json({ message: 'Student ID already registered' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      university: university || 'ESILV',
      studentId
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Login user
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get current user profile
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { name, avatar, university } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, avatar, university },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Add product to favorites
async function addFavorite(req, res) {
  try {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { favorites: productId } },
      { new: true }
    ).populate('favorites');
    res.json({ message: 'Added to favorites', favorites: user.favorites });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Remove product from favorites
async function removeFavorite(req, res) {
  try {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { favorites: productId } },
      { new: true }
    ).populate('favorites');
    res.json({ message: 'Removed from favorites', favorites: user.favorites });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get user's favorites
async function getFavorites(req, res) {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  addFavorite,
  removeFavorite,
  getFavorites
};
