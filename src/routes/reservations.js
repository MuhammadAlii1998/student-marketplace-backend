const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createReservation,
  getReservation,
  getMyReservations,
  cancelReservation,
  getProductReservation
} = require('../controllers/reservationController');

// All reservation routes require authentication
router.use(authenticate);

// Create a new reservation
router.post('/', createReservation);

// Get user's reservations
router.get('/my', getMyReservations);

// Get reservation for a specific product
router.get('/product/:productId', getProductReservation);

// Get reservation details by ID
router.get('/:id', getReservation);

// Cancel a reservation
router.delete('/:id', cancelReservation);

module.exports = router;
