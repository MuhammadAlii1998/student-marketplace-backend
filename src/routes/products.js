const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const upload = require('../middleware/upload');

// Public routes
router.get('/', controller.getProducts);
router.get('/category/:category', controller.getProductsByCategory);
router.get('/seller/:sellerId', controller.getSellerProducts);
router.get('/:id', optionalAuth, controller.getProductById);

// Protected routes
router.post('/', authenticate, validateProduct, controller.createProduct);
router.get('/my/listings', authenticate, controller.getMyListings);
router.put('/:id', authenticate, validateProduct, controller.updateProduct);
router.delete('/:id', authenticate, controller.deleteProduct);

// Image upload routes
router.post('/upload-image', authenticate, upload.single('image'), controller.uploadImage);
router.delete('/:id/image/:publicId', authenticate, controller.deleteImage);

module.exports = router;
