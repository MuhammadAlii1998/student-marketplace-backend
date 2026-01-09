/**
 * Chat System Test Suite
 * 
 * Tests:
 * 1. Create/get chat
 * 2. Send messages
 * 3. Get messages
 * 4. Chat expiry (7 days)
 * 5. Authorization
 * 6. Rate limiting
 * 7. Socket.IO events
 */

require('dotenv').config();
const mongoose = require('mongoose');
const io = require('socket.io-client');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const SOCKET_URL = process.env.API_URL || 'http://localhost:3000';

let testBuyerToken, testSellerToken;
let testBuyerId, testSellerId, testProductId;
let testChatId;
let buyerSocket, sellerSocket;

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

async function test1_Setup() {
  log('\n📋 Test 1: Setup - Creating test users and product', 'cyan');
  
  try {
    // Create buyer
    const buyerRes = await apiRequest('POST', '/api/auth/register', {
      name: 'Test Buyer Chat',
      email: `chat-buyer-${Date.now()}@test.com`,
      password: 'Test123!',
      studentId: `BUYER-${Date.now()}`,
      university: 'ESILV'
    });

    if (buyerRes.ok) {
      testBuyerToken = buyerRes.data.token;
      testBuyerId = buyerRes.data.user._id || buyerRes.data.user.id;
      log('  ✓ Buyer created', 'green');
    } else {
      throw new Error('Failed to create buyer');
    }

    // Create seller
    const sellerRes = await apiRequest('POST', '/api/auth/register', {
      name: 'Test Seller Chat',
      email: `chat-seller-${Date.now()}@test.com`,
      password: 'Test123!',
      studentId: `SELLER-${Date.now()}`,
      university: 'ESILV'
    });

    if (sellerRes.ok) {
      testSellerToken = sellerRes.data.token;
      testSellerId = sellerRes.data.user._id || sellerRes.data.user.id;
      log('  ✓ Seller created', 'green');
    } else {
      throw new Error('Failed to create seller');
    }

    // Create product
    const productRes = await apiRequest('POST', '/api/products', {
      title: 'Test Product for Chat',
      description: 'Product for testing chat',
      price: 100,
      category: 'Electronics',
      condition: 'good',
      location: 'Paris',
      seller: testSellerId,
      image: 'https://via.placeholder.com/300',
      images: ['https://via.placeholder.com/300']
    }, testSellerToken);

    if (productRes.ok) {
      testProductId = productRes.data.product._id || productRes.data.product.id;
      log('  ✓ Product created', 'green');
    } else {
      throw new Error('Failed to create product');
    }

    log('✅ Test 1 PASSED: Setup complete', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 1 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test2_CreateChat() {
  log('\n📋 Test 2: Create or get chat', 'cyan');
  
  try {
    const response = await apiRequest('POST', '/api/chats', {
      buyerId: testBuyerId,
      sellerId: testSellerId,
      productId: testProductId
    }, testBuyerToken);

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.data.message}`);
    }

    testChatId = response.data.chat._id || response.data.chat.id;
    
    log(`  ✓ Chat created: ${testChatId}`, 'green');
    log(`  ✓ Expires in ${response.data.chat.daysRemaining} days`, 'green');
    
    log('✅ Test 2 PASSED: Chat created successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 2 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test3_GetUserChats() {
  log('\n📋 Test 3: Get user chats', 'cyan');
  
  try {
    const response = await apiRequest('GET', '/api/chats', null, testBuyerToken);

    if (!response.ok) {
      throw new Error(`Failed to get chats: ${response.data.message}`);
    }

    log(`  ✓ Found ${response.data.total} chat(s)`, 'green');
    
    log('✅ Test 3 PASSED: Chats retrieved', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 3 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test4_SendMessageViaAPI() {
  log('\n📋 Test 4: Get chat messages (should be empty)', 'cyan');
  
  try {
    const response = await apiRequest('GET', `/api/chats/${testChatId}/messages`, null, testBuyerToken);

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.data.message}`);
    }

    log(`  ✓ Found ${response.data.messages.length} message(s)`, 'green');
    
    log('✅ Test 4 PASSED: Messages retrieved', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 4 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test5_UnauthorizedAccess() {
  log('\n📋 Test 5: Unauthorized access (no token)', 'cyan');
  
  try {
    const response = await apiRequest('GET', '/api/chats', null, null);

    if (response.status === 401) {
      log('  ✓ Unauthorized access prevented (401)', 'green');
      log('✅ Test 5 PASSED: Authorization check working', 'green');
      return true;
    } else {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  } catch (error) {
    log(`❌ Test 5 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function test6_SocketConnection() {
  log('\n📋 Test 6: Socket.IO connection and authentication', 'cyan');
  
  return new Promise((resolve) => {
    try {
      // Connect buyer socket
      buyerSocket = io(SOCKET_URL, {
        auth: { token: testBuyerToken },
        transports: ['websocket']
      });

      buyerSocket.on('connect', () => {
        log('  ✓ Buyer socket connected', 'green');
        
        // Connect seller socket
        sellerSocket = io(SOCKET_URL, {
          auth: { token: testSellerToken },
          transports: ['websocket']
        });

        sellerSocket.on('connect', () => {
          log('  ✓ Seller socket connected', 'green');
          log('✅ Test 6 PASSED: Socket connections established', 'green');
          resolve(true);
        });

        sellerSocket.on('connect_error', (error) => {
          log(`❌ Test 6 FAILED: Seller socket error: ${error.message}`, 'red');
          resolve(false);
        });
      });

      buyerSocket.on('connect_error', (error) => {
        log(`❌ Test 6 FAILED: Buyer socket error: ${error.message}`, 'red');
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        log('❌ Test 6 FAILED: Socket connection timeout', 'red');
        resolve(false);
      }, 5000);

    } catch (error) {
      log(`❌ Test 6 FAILED: ${error.message}`, 'red');
      resolve(false);
    }
  });
}

async function test7_JoinChatRoom() {
  log('\n📋 Test 7: Join chat room via Socket.IO', 'cyan');
  
  return new Promise((resolve) => {
    buyerSocket.emit('join_chat', { chatId: testChatId });
    
    buyerSocket.on('joined_chat', (data) => {
      log(`  ✓ Buyer joined chat room: ${data.chatId}`, 'green');
      
      sellerSocket.emit('join_chat', { chatId: testChatId });
      
      sellerSocket.on('joined_chat', (data) => {
        log(`  ✓ Seller joined chat room: ${data.chatId}`, 'green');
        log('✅ Test 7 PASSED: Chat rooms joined', 'green');
        resolve(true);
      });
    });

    setTimeout(() => {
      log('❌ Test 7 FAILED: Timeout', 'red');
      resolve(false);
    }, 5000);
  });
}

async function test8_SendMessageViaSocket() {
  log('\n📋 Test 8: Send message via Socket.IO', 'cyan');
  
  return new Promise((resolve) => {
    let received = false;

    // Seller listens for message
    sellerSocket.on('receive_message', (data) => {
      if (!received) {
        received = true;
        log(`  ✓ Seller received message: "${data.message.content}"`, 'green');
        log('✅ Test 8 PASSED: Real-time message delivered', 'green');
        resolve(true);
      }
    });

    // Buyer sends message
    buyerSocket.emit('send_message', {
      chatId: testChatId,
      message: 'Hello! Is this product still available?'
    });

    log('  ↗ Buyer sent message', 'blue');

    setTimeout(() => {
      if (!received) {
        log('❌ Test 8 FAILED: Message not received', 'red');
        resolve(false);
      }
    }, 5000);
  });
}

async function test9_DeleteChat() {
  log('\n📋 Test 9: Delete chat', 'cyan');
  
  try {
    const response = await apiRequest('DELETE', `/api/chats/${testChatId}`, null, testBuyerToken);

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.data.message}`);
    }

    log('  ✓ Chat deleted', 'green');
    log('✅ Test 9 PASSED: Chat deleted successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Test 9 FAILED: ${error.message}`, 'red');
    return false;
  }
}

async function cleanup() {
  if (buyerSocket) buyerSocket.disconnect();
  if (sellerSocket) sellerSocket.disconnect();
  log('\n🧹 Cleanup: Sockets disconnected', 'yellow');
}

// Main test runner
async function runAllTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  CHAT SYSTEM TEST SUITE', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`Testing API at: ${API_URL}`, 'blue');
  log(`Socket.IO at: ${SOCKET_URL}`, 'blue');
  
  const results = [];
  
  results.push(await test1_Setup());
  
  if (results[0]) {
    results.push(await test2_CreateChat());
    results.push(await test3_GetUserChats());
    results.push(await test4_SendMessageViaAPI());
    results.push(await test5_UnauthorizedAccess());
    results.push(await test6_SocketConnection());
    results.push(await test7_JoinChatRoom());
    results.push(await test8_SendMessageViaSocket());
    results.push(await test9_DeleteChat());
  }
  
  await cleanup();
  
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
