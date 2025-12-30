const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, controller.updateProfile);
router.get('/favorites', authenticate, controller.getFavorites);
router.post('/favorites/:productId', authenticate, controller.addFavorite);
router.delete('/favorites/:productId', authenticate, controller.removeFavorite);

module.exports = router;
