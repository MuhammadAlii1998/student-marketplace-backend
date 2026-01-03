// Email Verification Test Script
// Run this with: node src/test/emailVerificationTest.js

const BASE_URL = 'http://localhost:3000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json();
  
  return { status: response.status, data: responseData };
}

async function runTests() {
  log(colors.cyan, '\n========================================');
  log(colors.cyan, 'Email Verification System - Test Suite');
  log(colors.cyan, '========================================\n');

  const testEmail = `test${Date.now()}@edu.devinci.fr`;
  const testStudentId = String(Math.floor(1000000 + Math.random() * 9000000));

  // Test 1: Register User
  log(colors.blue, '📝 Test 1: Register New User');
  try {
    const registerData = {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      studentId: testStudentId,
      university: 'ESILV'
    };

    const registerResult = await makeRequest('POST', '/auth/register', registerData);
    
    if (registerResult.status === 201) {
      log(colors.green, '✅ Registration successful!');
      log(colors.yellow, `   Email: ${testEmail}`);
      log(colors.yellow, `   Message: ${registerResult.data.message}`);
    } else {
      log(colors.red, '❌ Registration failed!');
      log(colors.red, `   Error: ${registerResult.data.message}`);
      return;
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
    return;
  }

  // Test 2: Try to Login (Should Fail - Email Not Verified)
  log(colors.blue, '\n🔒 Test 2: Login Without Email Verification');
  try {
    const loginData = {
      email: testEmail,
      password: 'password123'
    };

    const loginResult = await makeRequest('POST', '/auth/login', loginData);
    
    if (loginResult.status === 403) {
      log(colors.green, '✅ Login correctly blocked for unverified email!');
      log(colors.yellow, `   Message: ${loginResult.data.message}`);
    } else {
      log(colors.red, '❌ Login should have been blocked!');
      log(colors.red, `   Status: ${loginResult.status}`);
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
  }

  // Test 3: Resend Verification Email
  log(colors.blue, '\n📧 Test 3: Resend Verification Email');
  try {
    const resendResult = await makeRequest('POST', '/auth/resend-verification', {
      email: testEmail
    });
    
    if (resendResult.status === 200) {
      log(colors.green, '✅ Verification email resent successfully!');
      log(colors.yellow, `   Message: ${resendResult.data.message}`);
    } else {
      log(colors.red, '❌ Failed to resend verification email!');
      log(colors.red, `   Error: ${resendResult.data.message}`);
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
  }

  // Instructions for manual verification
  log(colors.cyan, '\n========================================');
  log(colors.yellow, '⚠️  MANUAL VERIFICATION REQUIRED');
  log(colors.cyan, '========================================');
  log(colors.yellow, '\nTo complete the test:');
  log(colors.yellow, '1. Check your email inbox (or Mailtrap)');
  log(colors.yellow, '2. Find the verification email');
  log(colors.yellow, '3. Copy the verification token from the URL');
  log(colors.yellow, '4. Visit: http://localhost:3000/api/auth/verify-email?token=YOUR_TOKEN');
  log(colors.yellow, '5. Then try logging in again\n');

  log(colors.cyan, '========================================');
  log(colors.green, 'Test Email: ' + testEmail);
  log(colors.green, 'Test Password: password123');
  log(colors.cyan, '========================================\n');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log(colors.red, '\n❌ Server is not running!');
    log(colors.yellow, 'Please start the server with: npm run dev');
    log(colors.yellow, 'Then run this test again.\n');
    process.exit(1);
  }

  await runTests();
})();
