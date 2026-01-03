// Email Configuration Checker
// Run this to verify your email settings are correct
// Usage: node src/test/checkEmailConfig.js

require('dotenv').config();
const nodemailer = require('nodemailer');

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

async function checkEmailConfiguration() {
  log(colors.cyan, '\n========================================');
  log(colors.cyan, 'Email Configuration Checker');
  log(colors.cyan, '========================================\n');

  // Check environment variables
  log(colors.blue, '📋 Checking Environment Variables...\n');

  const requiredVars = {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    FRONTEND_URL: process.env.FRONTEND_URL
  };

  let missingVars = false;

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value === '' || value.includes('your-')) {
      log(colors.red, `   ❌ ${key}: Not configured`);
      missingVars = true;
    } else {
      // Mask password
      const displayValue = key === 'EMAIL_PASSWORD' ? '********' : value;
      log(colors.green, `   ✅ ${key}: ${displayValue}`);
    }
  }

  if (missingVars) {
    log(colors.yellow, '\n⚠️  Some environment variables are missing or not configured!');
    log(colors.yellow, '   Please edit your .env file with proper credentials.');
    log(colors.yellow, '\n   Gmail Setup Instructions:');
    log(colors.cyan, '   1. Enable 2-Step Verification: https://myaccount.google.com/security');
    log(colors.cyan, '   2. Generate App Password: Security > App passwords');
    log(colors.cyan, '   3. Select "Mail" and "Other (Custom name)"');
    log(colors.cyan, '   4. Copy the 16-character password and add to .env\n');
    return false;
  }

  // Test SMTP connection
  log(colors.blue, '\n🔌 Testing SMTP Connection...\n');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    await transporter.verify();
    log(colors.green, '   ✅ SMTP connection successful!');
    log(colors.green, '   ✅ Email service is ready to send emails\n');
  } catch (error) {
    log(colors.red, '   ❌ SMTP connection failed!');
    log(colors.red, `   Error: ${error.message}\n`);
    log(colors.yellow, '   Please check:');
    log(colors.yellow, '   - Email credentials are correct');
    log(colors.yellow, '   - Email service is accessible');
    log(colors.yellow, '   - For Gmail: Use App Password, not regular password\n');
    return false;
  }

  // Test sending email
  log(colors.blue, '\n📧 Testing Email Sending...\n');
  log(colors.yellow, '   Attempting to send a test email...');

  const testEmail = process.env.EMAIL_USER; // Send to self

  try {
    const info = await transporter.sendMail({
      from: `"ESILV Marketplace Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Email Configuration Test - ESILV Marketplace',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #c70071;">✅ Email Configuration Successful!</h2>
          <p>Your email service is properly configured and working.</p>
          <p>The Student Marketplace email verification system is ready to use.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is a test email sent at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    log(colors.green, '   ✅ Test email sent successfully!');
    log(colors.green, `   Message ID: ${info.messageId}`);
    log(colors.yellow, `   Check inbox for: ${testEmail}\n`);
  } catch (error) {
    log(colors.red, '   ❌ Failed to send test email!');
    log(colors.red, `   Error: ${error.message}\n`);
    return false;
  }

  // Summary
  log(colors.cyan, '========================================');
  log(colors.green, '🎉 Email Configuration Complete!');
  log(colors.cyan, '========================================\n');
  log(colors.green, '✅ All checks passed!');
  log(colors.green, '✅ Email verification system is ready');
  log(colors.green, '✅ You can now test user registration\n');

  log(colors.yellow, 'Next steps:');
  log(colors.yellow, '1. Start your server: npm run dev');
  log(colors.yellow, '2. Run test: node src/test/emailVerificationTest.js');
  log(colors.yellow, '3. Or test manually with registration endpoint\n');

  return true;
}

// Run the checker
(async () => {
  const success = await checkEmailConfiguration();
  process.exit(success ? 0 : 1);
})();
