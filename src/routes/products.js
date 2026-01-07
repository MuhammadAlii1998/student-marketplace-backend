const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const upload = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

// Rate limiter for image uploads (20 uploads per 15 minutes)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes per IP
  message: {
    message: 'Too many upload attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Public routes
router.get('/', controller.getProducts);
router.get('/category/:category', controller.getProductsByCategory);
router.get('/seller/:sellerId', controller.getSellerProducts);
router.get('/:id', optionalAuth, controller.getProductById);

// Protected routes - Product management
router.post('/', authenticate, validateProduct, controller.createProduct);
router.get('/my/listings', authenticate, controller.getMyListings);
router.put('/:id', authenticate, validateProduct, controller.updateProduct);
router.delete('/:id', authenticate, controller.deleteProduct);

// Protected routes - Image upload (with rate limiting)
router.post('/upload-image', authenticate, uploadLimiter, upload.single('image'), controller.uploadImage);
router.delete('/:id/image/:publicId', authenticate, controller.deleteImage);

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  if (err) {
    upload.handleUploadError(err, req, res, next);
  } else {
    next();
  }
});

module.exports = router;
