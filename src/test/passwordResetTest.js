/**
 * Password Reset Feature Test
 * 
 * This script tests the forgot password and reset password functionality
 * Run: node src/test/passwordResetTest.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;
const TEST_EMAIL = 'muhammadaliz420@gmail.com'; // Your Gmail for testing
const NEW_PASSWORD = 'newPassword456';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(response);
          }
        } catch (error) {
          reject({ status: res.statusCode, data: { message: body } });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPasswordReset() {
  log('\n🧪 Password Reset Feature Test\n', 'blue');

  try {
    // Step 1: Request password reset
    log('📧 Step 1: Requesting password reset...', 'yellow');
    const forgotResponse = await makeRequest('/auth/forgot-password', 'POST', {
      email: TEST_EMAIL
    });

    log(`✅ Password reset email sent!`, 'green');
    log(`Response: ${forgotResponse.data.message}`, 'green');
    
    log('\n⏳ Please check your email inbox for the reset link...', 'yellow');
    log('📝 The email will contain a link like:', 'yellow');
    log('   http://localhost:8081/reset-password?token=XXXXXXX', 'yellow');
    
    log('\n💡 To complete the test:', 'blue');
    log('   1. Open the email in your inbox', 'blue');
    log('   2. Copy the token from the URL (the part after ?token=)', 'blue');
    log('   3. Run the reset password request manually:', 'blue');
    log(`\n   curl -X POST http://localhost:3000/api/auth/reset-password \\`, 'blue');
    log(`     -H "Content-Type: application/json" \\`, 'blue');
    log(`     -d '{"token": "YOUR_TOKEN_HERE", "newPassword": "${NEW_PASSWORD}"}'`, 'blue');
    
    log('\n✅ Password reset flow initiated successfully!', 'green');
    log('📧 Check your email to complete the process', 'green');

  } catch (error) {
    log(`\n❌ Test failed:`, 'red');
    if (error.status) {
      log(`Status: ${error.status}`, 'red');
      log(`Message: ${error.data?.message || JSON.stringify(error.data)}`, 'red');
      if (error.data?.errors) {
        log(`Errors: ${JSON.stringify(error.data.errors, null, 2)}`, 'red');
      }
    } else {
      log(error.message || JSON.stringify(error), 'red');
    }
  }
}

// Test invalid scenarios
async function testInvalidScenarios() {
  log('\n🧪 Testing Invalid Scenarios\n', 'blue');

  // Test 1: Invalid email format
  log('Test 1: Invalid email format...', 'yellow');
  try {
    await makeRequest('/auth/forgot-password', 'POST', {
      email: 'not-an-email'
    });
    log('❌ Should have failed but didn\'t', 'red');
  } catch (error) {
    if (error.status === 400) {
      log('✅ Correctly rejected invalid email', 'green');
    } else {
      log(`❌ Unexpected error: ${error.data?.message}`, 'red');
    }
  }

  // Test 2: Missing email
  log('Test 2: Missing email...', 'yellow');
  try {
    await makeRequest('/auth/forgot-password', 'POST', {});
    log('❌ Should have failed but didn\'t', 'red');
  } catch (error) {
    if (error.status === 400) {
      log('✅ Correctly rejected missing email', 'green');
    } else {
      log(`❌ Unexpected error: ${error.data?.message}`, 'red');
    }
  }

  // Test 3: Invalid reset token
  log('Test 3: Invalid reset token...', 'yellow');
  try {
    await makeRequest('/auth/reset-password', 'POST', {
      token: 'invalid-token-12345',
      newPassword: 'newPassword123'
    });
    log('❌ Should have failed but didn\'t', 'red');
  } catch (error) {
    if (error.status === 400) {
      log('✅ Correctly rejected invalid token', 'green');
    } else {
      log(`❌ Unexpected error: ${error.data?.message}`, 'red');
    }
  }

  // Test 4: Short password
  log('Test 4: Password too short...', 'yellow');
  try {
    await makeRequest('/auth/reset-password', 'POST', {
      token: 'some-token',
      newPassword: 'short'
    });
    log('❌ Should have failed but didn\'t', 'red');
  } catch (error) {
    if (error.status === 400) {
      log('✅ Correctly rejected short password', 'green');
    } else {
      log(`❌ Unexpected error: ${error.data?.message}`, 'red');
    }
  }
}

// Run tests
(async () => {
  log('🚀 Starting Password Reset Tests', 'blue');
  log(`📍 Testing against: http://${BASE_URL}:${PORT}/api`, 'blue');
  log(`📧 Using email: ${TEST_EMAIL}`, 'blue');
  
  await testPasswordReset();
  await sleep(2000);
  await testInvalidScenarios();
  
  log('\n✨ All tests completed!', 'green');
})();
