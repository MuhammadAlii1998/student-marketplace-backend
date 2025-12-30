const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', controller.getProducts);
router.get('/category/:category', controller.getProductsByCategory);
router.get('/seller/:sellerId', controller.getSellerProducts);
router.get('/:id', optionalAuth, controller.getProductById);

// Protected routes
router.post('/', optionalAuth, controller.createProduct);
router.get('/my/listings', authenticate, controller.getMyListings);
router.put('/:id', controller.updateProduct);
router.delete('/:id', controller.deleteProduct);

module.exports = router;
