/**
 * Reservation Feature Test Suite
 * 
 * Tests:
 * 1. Create reservation
 * 2. Prevent double reservation
 * 3. Get reservation details
 * 4. Cancel reservation
 * 5. Expiry handling
 * 6. Authorization checks
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = 'reservation-test-user@test.com';
const TEST_USER_PASSWORD = 'Test123!';
const TEST_SELLER_EMAIL = 'reservation-seller@test.com';
const TEST_SELLER_PASSWORD = 'Test123!';

let testUserId;
let testUserToken;
let testSellerId;
let testSellerToken;
let testProductId;
let testReservationId;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const fetch = (await import('node-fetch')).default;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const responseData = await response.json();

  return {
    status: response.status,
    data: responseData,
    ok: response.ok
  };
}

// Test helper functions
async function registerUser(email, password, name) {
  return await apiRequest('POST', '/api/auth/register', {
    name,
    email,
    password,
    studentId: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    university: 'ESILV'
  });
}

async function loginUser(email, password) {
  return await apiRequest('POST', '/api/auth/login', { email, password });
}

async function createProduct(token, sellerId) {
  return await apiRequest('POST', '/api/products', {
    title: 'Test Product for Reservation',
    description: 'This is a test product to test reservation functionality',
    price: 50,
    category: 'Books',
    condition: 'good',
    location: 'Paris',
    seller: sellerId,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg']
  }, token);
}

// Test functions
async function test1_Setup() {
  log('\n📋 Test 1: Setup - Creating test users and product', 'cyan');
  
  try {
    // Register and login buyer
    log('  Creating buyer account...', 'blue');
    const buyerRegister = await registerUser(TEST_USER_EMAIL, TEST_USER_PASSWORD, 'Test Buyer');
    
    if (buyerRegister.status === 201 || buyerRegister.status === 400) {
      // If 400, user might already exist, try to login
      const buyerLogin = await loginUser(TEST_USER_EMAIL, TEST_USER_PASSWORD);
      if (!buyerLogin.ok) {
        throw new Error('Failed to login as buyer');
      }
      testUserToken = buyerLogin.data.token;
      testUserId = buyerLogin.data.user._id || buyerLogin.data.user.id;
      log('  ✓ Buyer logged in successfully', 'green');
    } else {
      testUserToken = buyerRegister.data.token;
      testUserId = buyerRegister.data.user._id || buyerRegister.data.user.id;
      log('  ✓ Buyer registered successfully', 'green');
    }

    // Register and login seller
    log('  Creating seller account...', 'blue');
    const sellerRegister = await registerUser(TEST_SELLER_EMAIL, TEST_SELLER_PASSWORD, 'Test Seller');
    
    if (sellerRegister.status === 201 || sellerRegister.status === 400) {
      const sellerLogin = await loginUser(TEST_SELLER_EMAIL, TEST_SELLER_PASSWORD);
      if (!sellerLogin.ok) {
        throw new Error('Failed to login as seller');
      }
      testSellerToken = sellerLogin.data.token;
      testSellerId = sellerLogin.data.user._id || sellerLogin.data.user.id;
      log('  ✓ Seller logged in successfully', 'green');
    } else {
      testSellerToken = sellerRegister.data.token;
      testSellerId = sellerRegister.data.user._id || sellerRegister.data.user.id;
      log('  ✓ Seller registered successfully', 'green');
    }

    // Create a test product
    log('  Creating test product...', 'blue');
    const productResponse = await createProduct(testSellerToken, testSellerId);
    if (!productResponse.ok) {
      throw new Error(`Failed to create product: ${productResponse.data.message}`);
    }
    testProductId = productResponse.data.product._id || productResponse.data.product.id;
    log('  ✓ Product created successfully', 'green');
    
    log('✅ Test 1 PASSED: Setup complete', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 1 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test2_CreateReservation() {
  log('\n📋 Test 2: Create a reservation', 'cyan');
  
  try {
    const response = await apiRequest('POST', '/api/reservations', {
      productId: testProductId,
      durationMinutes: 30
    }, testUserToken);

    if (!response.ok) {
      throw new Error(`Failed to create reservation: ${response.data.message}`);
    }

    if (!response.data.reservation || !response.data.reservation.id) {
      throw new Error('Reservation ID not returned');
    }

    testReservationId = response.data.reservation.id;
    
    log(`  ✓ Reservation created: ${testReservationId}`, 'green');
    log(`  ✓ Expires at: ${response.data.reservation.expiresAt}`, 'green');
    log(`  ✓ Duration: ${response.data.reservation.durationMinutes} minutes`, 'green');
    
    log('✅ Test 2 PASSED: Reservation created successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 2 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test3_PreventDoubleReservation() {
  log('\n📋 Test 3: Prevent double reservation (409 Conflict)', 'cyan');
  
  try {
    // Try to reserve the same product again
    const response = await apiRequest('POST', '/api/reservations', {
      productId: testProductId,
      durationMinutes: 30
    }, testUserToken);

    if (response.status === 409) {
      log('  ✓ Double reservation prevented (409 Conflict)', 'green');
      log(`  ✓ Message: ${response.data.message}`, 'green');
      log('✅ Test 3 PASSED: Double reservation prevented', 'green');
      return true;
    } else {
      throw new Error(`Expected 409 Conflict, got ${response.status}`);
    }
  } catch (error) {
    log(`❌ Test 3 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test4_GetReservationDetails() {
  log('\n📋 Test 4: Get reservation details', 'cyan');
  
  try {
    const response = await apiRequest('GET', `/api/reservations/${testReservationId}`, null, testUserToken);

    if (!response.ok) {
      throw new Error(`Failed to get reservation: ${response.data.message}`);
    }

    if (!response.data.reservation) {
      throw new Error('Reservation data not returned');
    }

    log('  ✓ Reservation details retrieved', 'green');
    log(`  ✓ Status: ${response.data.reservation.status}`, 'green');
    log(`  ✓ Remaining minutes: ${response.data.reservation.remainingMinutes}`, 'green');
    
    log('✅ Test 4 PASSED: Reservation details retrieved', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 4 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test5_UnauthorizedAccess() {
  log('\n📋 Test 5: Unauthorized access (no token)', 'cyan');
  
  try {
    const response = await apiRequest('POST', '/api/reservations', {
      productId: testProductId,
      durationMinutes: 30
    }, null);

    if (response.status === 401) {
      log('  ✓ Unauthorized access prevented (401)', 'green');
      log('✅ Test 5 PASSED: Authorization check working', 'green');
      return true;
    } else {
      throw new Error(`Expected 401 Unauthorized, got ${response.status}`);
    }
  } catch (error) {
    log(`❌ Test 5 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test6_GetMyReservations() {
  log('\n📋 Test 6: Get my reservations', 'cyan');
  
  try {
    const response = await apiRequest('GET', '/api/reservations/my', null, testUserToken);

    if (!response.ok) {
      throw new Error(`Failed to get reservations: ${response.data.message}`);
    }

    if (!response.data.reservations || !Array.isArray(response.data.reservations)) {
      throw new Error('Reservations array not returned');
    }

    log(`  ✓ Found ${response.data.reservations.length} reservation(s)`, 'green');
    log(`  ✓ Total: ${response.data.pagination.total}`, 'green');
    
    log('✅ Test 6 PASSED: My reservations retrieved', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 6 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test7_CancelReservation() {
  log('\n📋 Test 7: Cancel reservation', 'cyan');
  
  try {
    const response = await apiRequest('DELETE', `/api/reservations/${testReservationId}`, null, testUserToken);

    if (!response.ok) {
      throw new Error(`Failed to cancel reservation: ${response.data.message}`);
    }

    log('  ✓ Reservation cancelled', 'green');
    log(`  ✓ Status: ${response.data.reservation.status}`, 'green');
    
    log('✅ Test 7 PASSED: Reservation cancelled successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 7 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test8_CreateShortExpiry() {
  log('\n📋 Test 8: Create reservation with short expiry (1 minute)', 'cyan');
  
  try {
    const response = await apiRequest('POST', '/api/reservations', {
      productId: testProductId,
      durationMinutes: 1
    }, testUserToken);

    if (!response.ok) {
      throw new Error(`Failed to create reservation: ${response.data.message}`);
    }

    const shortReservationId = response.data.reservation.id;
    log('  ✓ Short reservation created (1 minute)', 'green');
    log('  ⏳ Waiting 70 seconds for expiry...', 'yellow');
    
    // Wait for expiry (70 seconds to ensure cleanup job runs)
    await new Promise(resolve => setTimeout(resolve, 70000));
    
    // Check if expired
    const checkResponse = await apiRequest('GET', `/api/reservations/${shortReservationId}`, null, testUserToken);
    
    if (checkResponse.data.reservation.status === 'EXPIRED') {
      log('  ✓ Reservation automatically expired', 'green');
      log('✅ Test 8 PASSED: Auto-expiry working', 'green');
      return true;
    } else {
      throw new Error(`Expected EXPIRED status, got ${checkResponse.data.reservation.status}`);
    }
  } catch (error) {
    log(`❌ Test 8 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test9_SellerCannotReserveOwnProduct() {
  log('\n📋 Test 9: Seller cannot reserve their own product', 'cyan');
  
  try {
    const response = await apiRequest('POST', '/api/reservations', {
      productId: testProductId,
      durationMinutes: 30
    }, testSellerToken);

    if (response.status === 400 && response.data.message.includes('cannot reserve your own product')) {
      log('  ✓ Seller prevented from reserving own product', 'green');
      log('✅ Test 9 PASSED: Business rule enforced', 'green');
      return true;
    } else {
      throw new Error(`Expected 400 error preventing seller reservation, got ${response.status}`);
    }
  } catch (error) {
    log(`❌ Test 9 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test10_InvalidProductId() {
  log('\n📋 Test 10: Invalid product ID (404 Not Found)', 'cyan');
  
  try {
    const fakeProductId = new mongoose.Types.ObjectId();
    const response = await apiRequest('POST', '/api/reservations', {
      productId: fakeProductId,
      durationMinutes: 30
    }, testUserToken);

    if (response.status === 404) {
      log('  ✓ Invalid product ID handled (404)', 'green');
      log('✅ Test 10 PASSED: Error handling working', 'green');
      return true;
    } else {
      throw new Error(`Expected 404 Not Found, got ${response.status}`);
    }
  } catch (error) {
    log(`❌ Test 10 FAILED: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  RESERVATION FEATURE TEST SUITE', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`Testing API at: ${API_URL}`, 'blue');
  
  const results = [];
  
  results.push(await test1_Setup());
  
  if (results[0]) {
    results.push(await test2_CreateReservation());
    results.push(await test3_PreventDoubleReservation());
    results.push(await test4_GetReservationDetails());
    results.push(await test5_UnauthorizedAccess());
    results.push(await test6_GetMyReservations());
    results.push(await test7_CancelReservation());
    
    // Note: Test 8 takes 70 seconds - uncomment to run
    // results.push(await test8_CreateShortExpiry());
    
    results.push(await test9_SellerCannotReserveOwnProduct());
    results.push(await test10_InvalidProductId());
  }
  
  // Summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${total - passed}`, 'red');
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 ALL TESTS PASSED!', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED', 'red');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
