const Reservation = require('../models/reservation');
const Product = require('../models/product');
const mongoose = require('mongoose');

/**
 * Create a new reservation
 * POST /api/reservations
 */
async function createReservation(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, durationMinutes = 30 } = req.body;
    const userId = req.userId;

    // Validate input
    if (!productId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (durationMinutes < 1 || durationMinutes > 1440) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Duration must be between 1 minute and 24 hours (1440 minutes)' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is available
    if (product.status === 'sold') {
      await session.abortTransaction();
      return res.status(409).json({ 
        message: 'Product is already sold and cannot be reserved' 
      });
    }

    // Check if seller is trying to reserve their own product
    if (product.seller.toString() === userId) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'You cannot reserve your own product' 
      });
    }

    // Check if there's an active reservation for this product
    const existingReservation = await Reservation.findActiveReservation(productId);
    if (existingReservation) {
      await session.abortTransaction();
      
      // Check if the existing reservation is by the same user
      if (existingReservation.user._id.toString() === userId) {
        return res.status(409).json({ 
          message: 'You already have an active reservation for this product',
          reservation: existingReservation
        });
      }
      
      return res.status(409).json({ 
        message: 'Product is already reserved by another user',
        expiresAt: existingReservation.expiresAt
      });
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create reservation
    const reservation = new Reservation({
      product: productId,
      user: userId,
      durationMinutes,
      expiresAt,
      status: 'ACTIVE'
    });

    await reservation.save({ session });

    // Update product status to reserved
    product.status = 'reserved';
    await product.save({ session });

    await session.commitTransaction();

    // Populate user and product details
    await reservation.populate('user', 'name email');
    await reservation.populate('product', 'title price image');

    res.status(201).json({
      message: 'Product reserved successfully',
      reservation: {
        id: reservation._id,
        product: reservation.product,
        user: reservation.user,
        reservedAt: reservation.reservedAt,
        expiresAt: reservation.expiresAt,
        status: reservation.status,
        durationMinutes: reservation.durationMinutes,
        remainingMinutes: reservation.remainingMinutes
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      message: 'Error creating reservation',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
}

/**
 * Get reservation details by ID
 * GET /api/reservations/:id
 */
async function getReservation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }

    const reservation = await Reservation.findById(id)
      .populate('user', 'name email avatar')
      .populate('product', 'title price image description seller');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if user is authorized to view this reservation
    // Either the user who made the reservation or the product seller
    const isOwner = reservation.user._id.toString() === userId;
    const isSeller = reservation.product.seller.toString() === userId;

    if (!isOwner && !isSeller) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this reservation' 
      });
    }

    res.json({
      reservation: {
        id: reservation._id,
        product: reservation.product,
        user: reservation.user,
        reservedAt: reservation.reservedAt,
        expiresAt: reservation.expiresAt,
        status: reservation.status,
        durationMinutes: reservation.durationMinutes,
        remainingMinutes: reservation.remainingMinutes,
        isActive: reservation.isActive
      }
    });

  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ 
      message: 'Error fetching reservation',
      error: error.message 
    });
  }
}

/**
 * Get all reservations for the authenticated user
 * GET /api/reservations/my
 */
async function getMyReservations(req, res) {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { user: userId };
    if (status && ['ACTIVE', 'EXPIRED', 'CANCELLED'].includes(status)) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const reservations = await Reservation.find(filter)
      .populate('product', 'title price image description status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Reservation.countDocuments(filter);

    const reservationsWithDetails = reservations.map(r => ({
      id: r._id,
      product: r.product,
      reservedAt: r.reservedAt,
      expiresAt: r.expiresAt,
      status: r.status,
      durationMinutes: r.durationMinutes,
      remainingMinutes: r.remainingMinutes,
      isActive: r.isActive
    }));

    res.json({
      reservations: reservationsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      message: 'Error fetching reservations',
      error: error.message 
    });
  }
}

/**
 * Cancel a reservation
 * DELETE /api/reservations/:id
 */
async function cancelReservation(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.userId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }

    const reservation = await Reservation.findById(id)
      .populate('product')
      .session(session);

    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if user owns this reservation
    if (!reservation.isOwnedBy(userId)) {
      await session.abortTransaction();
      return res.status(403).json({ 
        message: 'You can only cancel your own reservations' 
      });
    }

    // Check if reservation is already cancelled or expired
    if (reservation.status !== 'ACTIVE') {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: `Reservation is already ${reservation.status.toLowerCase()}` 
      });
    }

    // Cancel the reservation
    await reservation.cancel();

    // Update product status back to active (if still reserved)
    if (reservation.product && reservation.product.status === 'reserved') {
      reservation.product.status = 'active';
      await reservation.product.save({ session });
    }

    await session.commitTransaction();

    res.json({
      message: 'Reservation cancelled successfully',
      reservation: {
        id: reservation._id,
        status: reservation.status
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ 
      message: 'Error cancelling reservation',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
}

/**
 * Get reservation for a specific product (if any)
 * GET /api/reservations/product/:productId
 */
async function getProductReservation(req, res) {
  try {
    const { productId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const reservation = await Reservation.findActiveReservation(productId);

    if (!reservation) {
      return res.json({ 
        reserved: false,
        message: 'Product is not currently reserved' 
      });
    }

    res.json({
      reserved: true,
      reservation: {
        id: reservation._id,
        expiresAt: reservation.expiresAt,
        remainingMinutes: reservation.remainingMinutes,
        user: reservation.user
      }
    });

  } catch (error) {
    console.error('Error fetching product reservation:', error);
    res.status(500).json({ 
      message: 'Error fetching product reservation',
      error: error.message 
    });
  }
}

module.exports = {
  createReservation,
  getReservation,
  getMyReservations,
  cancelReservation,
  getProductReservation
};
