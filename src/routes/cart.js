const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// All cart routes require authentication
router.use(authenticate);

router.get('/', controller.getCart);
router.post('/', controller.addToCart);
router.put('/:productId', controller.updateCartItem);
router.delete('/:productId', controller.removeFromCart);
router.delete('/', controller.clearCart);

module.exports = router;
