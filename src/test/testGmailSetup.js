require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmailSetup() {
  console.log('🧪 Testing Gmail Configuration...\n');
  
  // Check if environment variables are set
  console.log('📋 Configuration Check:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Not set');
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Not set');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');
  console.log();

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured in .env file');
    console.log('\n📖 Follow the setup guide in GMAIL_SETUP_GUIDE.md');
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: true
    }
  });

  try {
    // Verify connection
    console.log('🔌 Testing connection to Gmail SMTP...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"ESILV Marketplace Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Gmail Configuration Test - Success!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
            .header { 
              background-color: #c70071; 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 5px;
            }
            .logo-container { 
              background-color: white;
              padding: 15px;
              border-radius: 5px;
              display: inline-block;
              margin-bottom: 15px;
            }
            .logo-text {
              font-size: 28px;
              font-weight: bold;
              color: #c70071;
              margin: 0;
              letter-spacing: 2px;
            }
            .content { background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px; }
            .success { color: #c70071; font-size: 24px; font-weight: bold; }
            .info { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #c70071; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <h1 class="logo-text">ESILV</h1>
              </div>
              <h1>🎉 Gmail Configuration Test</h1>
            </div>
            <div class="content">
              <p class="success">✅ Success!</p>
              <p>Your Gmail SMTP configuration is working correctly!</p>
              
              <div class="info">
                <h3>Configuration Details:</h3>
                <ul>
                  <li><strong>Host:</strong> ${process.env.EMAIL_HOST}</li>
                  <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
                  <li><strong>From:</strong> ${process.env.EMAIL_USER}</li>
                  <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>

              <p>Your ESILV Marketplace backend is ready to send verification emails!</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Next steps:</strong><br>
                1. Start your server: <code>npm run dev</code><br>
                2. Register a new user<br>
                3. Check your email for the verification link
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n🎉 Check your inbox at:', process.env.EMAIL_USER);
    console.log('   (Also check spam folder just in case)\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔍 Common Issues:');
    console.log('  1. App Password not generated or incorrect');
    console.log('  2. 2-Step Verification not enabled on Gmail');
    console.log('  3. Spaces in the App Password (remove them)');
    console.log('  4. Using regular password instead of App Password');
    console.log('\n📖 See GMAIL_SETUP_GUIDE.md for detailed setup instructions\n');
    process.exit(1);
  }

  process.exit(0);
}

testGmailSetup();
