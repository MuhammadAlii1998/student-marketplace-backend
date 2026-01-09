const Reservation = require('../models/reservation');
const Product = require('../models/product');

/**
 * Cleanup expired reservations
 * This function marks expired reservations as EXPIRED and updates product status
 */
async function cleanupExpiredReservations() {
  try {
    console.log('🔄 Running reservation cleanup job...');

    // Find all expired reservations that are still marked as ACTIVE
    const expiredReservations = await Reservation.find({
      status: 'ACTIVE',
      expiresAt: { $lte: new Date() }
    }).populate('product');

    if (expiredReservations.length === 0) {
      console.log('✅ No expired reservations found');
      return { expired: 0 };
    }

    console.log(`Found ${expiredReservations.length} expired reservation(s)`);

    let updatedCount = 0;
    let productUpdatedCount = 0;

    // Process each expired reservation
    for (const reservation of expiredReservations) {
      try {
        // Mark reservation as EXPIRED
        reservation.status = 'EXPIRED';
        await reservation.save();
        updatedCount++;

        // Update product status back to active if it's still reserved
        if (reservation.product && reservation.product.status === 'reserved') {
          reservation.product.status = 'active';
          await reservation.product.save();
          productUpdatedCount++;
          console.log(`  ✓ Product ${reservation.product._id} freed from reservation`);
        }
      } catch (err) {
        console.error(`  ✗ Error processing reservation ${reservation._id}:`, err.message);
      }
    }

    console.log(`✅ Cleanup complete: ${updatedCount} reservations expired, ${productUpdatedCount} products freed`);

    return {
      expired: updatedCount,
      productsFreed: productUpdatedCount
    };

  } catch (error) {
    console.error('❌ Error in reservation cleanup job:', error.message);
    throw error;
  }
}

/**
 * Start the cleanup job
 * Runs every minute to check for expired reservations
 */
function startReservationCleanupJob(intervalMs = 60000) {
  console.log('🚀 Starting reservation cleanup job (runs every minute)');
  
  // Run immediately on startup
  cleanupExpiredReservations().catch(err => {
    console.error('Error in initial cleanup:', err.message);
  });

  // Then run at specified interval
  const intervalId = setInterval(() => {
    cleanupExpiredReservations().catch(err => {
      console.error('Error in scheduled cleanup:', err.message);
    });
  }, intervalMs);

  return intervalId;
}

/**
 * Stop the cleanup job
 */
function stopReservationCleanupJob(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Stopped reservation cleanup job');
  }
}

module.exports = {
  cleanupExpiredReservations,
  startReservationCleanupJob,
  stopReservationCleanupJob
};
