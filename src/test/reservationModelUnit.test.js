/**
 * Unit Tests for Reservation Model
 * Tests the Reservation model methods and virtuals
 */

const mongoose = require('mongoose');
const Reservation = require('../models/reservation');

// Mock data
const mockUserId = new mongoose.Types.ObjectId();
const mockProductId = new mongoose.Types.ObjectId();

describe('Reservation Model Unit Tests', () => {
  
  test('Should create a reservation with required fields', () => {
    const reservationData = {
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };
    
    const reservation = new Reservation(reservationData);
    
    expect(reservation.product).toBe(mockProductId);
    expect(reservation.user).toBe(mockUserId);
    expect(reservation.durationMinutes).toBe(30);
    expect(reservation.status).toBe('ACTIVE');
  });
  
  test('Should calculate remaining minutes correctly', () => {
    const futureTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: futureTime,
      status: 'ACTIVE'
    });
    
    const remaining = reservation.remainingMinutes;
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(15);
  });
  
  test('Should return 0 remaining minutes for expired reservation', () => {
    const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: pastTime,
      status: 'ACTIVE'
    });
    
    expect(reservation.remainingMinutes).toBe(0);
  });
  
  test('isActive virtual should return true for active non-expired reservation', () => {
    const futureTime = new Date(Date.now() + 30 * 60 * 1000);
    
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: futureTime,
      status: 'ACTIVE'
    });
    
    expect(reservation.isActive).toBe(true);
  });
  
  test('isActive virtual should return false for expired reservation', () => {
    const pastTime = new Date(Date.now() - 10 * 60 * 1000);
    
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: pastTime,
      status: 'ACTIVE'
    });
    
    expect(reservation.isActive).toBe(false);
  });
  
  test('isActive virtual should return false for cancelled reservation', () => {
    const futureTime = new Date(Date.now() + 30 * 60 * 1000);
    
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: futureTime,
      status: 'CANCELLED'
    });
    
    expect(reservation.isActive).toBe(false);
  });
  
  test('isOwnedBy should return true for correct user', () => {
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    expect(reservation.isOwnedBy(mockUserId)).toBe(true);
  });
  
  test('isOwnedBy should return false for different user', () => {
    const otherUserId = new mongoose.Types.ObjectId();
    
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    expect(reservation.isOwnedBy(otherUserId)).toBe(false);
  });
  
  test('Should validate duration is within range', () => {
    // Too short
    const tooShort = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 0,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    const shortError = tooShort.validateSync();
    expect(shortError).toBeDefined();
    expect(shortError.errors.durationMinutes).toBeDefined();
    
    // Too long
    const tooLong = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 1500,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    const longError = tooLong.validateSync();
    expect(longError).toBeDefined();
    expect(longError.errors.durationMinutes).toBeDefined();
  });
  
  test('Should require product field', () => {
    const reservation = new Reservation({
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    const error = reservation.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.product).toBeDefined();
  });
  
  test('Should require user field', () => {
    const reservation = new Reservation({
      product: mockProductId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    const error = reservation.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });
  
  test('Should have default status of ACTIVE', () => {
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    expect(reservation.status).toBe('ACTIVE');
  });
  
  test('Should only allow valid status values', () => {
    const reservation = new Reservation({
      product: mockProductId,
      user: mockUserId,
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      status: 'INVALID_STATUS'
    });
    
    const error = reservation.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });
});

// To run these tests, you would typically use Jest:
// npm install --save-dev jest
// Add to package.json: "test": "jest"
// Run: npm test

// Note: These are standalone unit tests that don't require database connection
console.log('✅ Unit test definitions complete');
console.log('To run with Jest: npm install --save-dev jest && npm test');
