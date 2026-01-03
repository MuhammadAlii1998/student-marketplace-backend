const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin, validateEmail } = require('../middleware/validation');

// Public routes with rate limiting and validation
router.post('/register', authLimiter, validateRegistration, controller.register);
router.post('/login', authLimiter, validateLogin, controller.login);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', emailLimiter, validateEmail, controller.resendVerificationEmail);

// Protected routes
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, controller.updateProfile);
router.get('/favorites', authenticate, controller.getFavorites);
router.post('/favorites/:productId', authenticate, controller.addFavorite);
router.delete('/favorites/:productId', authenticate, controller.removeFavorite);

module.exports = router;
