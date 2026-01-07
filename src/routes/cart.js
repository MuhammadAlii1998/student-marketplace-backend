const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// GET cart - optional auth (returns empty cart for guests)
router.get('/', optionalAuth, controller.getCart);

// Other cart routes require authentication (must be logged in to modify cart)
router.post('/', authenticate, controller.addToCart);
router.put('/:productId', authenticate, controller.updateCartItem);
router.delete('/:productId', authenticate, controller.removeFromCart);
router.delete('/', authenticate, controller.clearCart);

module.exports = router;
