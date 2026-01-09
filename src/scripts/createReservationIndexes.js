/**
 * Create Database Indexes for Reservation Collection
 * Run this script to ensure optimal query performance
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Reservation = require('../models/reservation');

async function createReservationIndexes() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Creating indexes for Reservation collection...');

    // Create indexes
    await Reservation.createIndexes();

    console.log('✅ All indexes created successfully');

    // List all indexes
    const indexes = await Reservation.collection.getIndexes();
    console.log('\n📋 Current indexes on Reservation collection:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(indexes[indexName]));
    });

    // Get collection stats
    const stats = await Reservation.collection.stats();
    console.log('\n📊 Collection statistics:');
    console.log(`  - Document count: ${stats.count}`);
    console.log(`  - Average document size: ${Math.round(stats.avgObjSize)} bytes`);
    console.log(`  - Total index size: ${Math.round(stats.totalIndexSize / 1024)} KB`);

    console.log('\n✅ Index creation complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    process.exit(1);
  }
}

createReservationIndexes();
