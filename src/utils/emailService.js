const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Gmail configuration with App Password
  // Make sure to enable 2-Step Verification and generate an App Password
  
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: true
    }
  };

  console.log('📧 Email Config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    secure: config.secure
  });

  return nodemailer.createTransport(config);
};

// Send verification email
async function sendVerificationEmail(email, name, verificationToken) {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"ESILV Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - ESILV Marketplace',
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
              border-radius: 5px 5px 0 0;
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
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #c70071; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              font-size: 12px; 
              color: #666; 
              border-top: 1px solid #ddd;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <h1 class="logo-text">ESILV</h1>
              </div>
              <h1 style="margin: 0;">Welcome to ESILV Marketplace!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for registering with ESILV Marketplace! To complete your registration, please verify your email address.</p>
              <p>Click the button below to verify your email:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #c70071;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ESILV Marketplace. All rights reserved.</p>
              <p>ESILV - École Supérieure d'Ingénieurs Léonard de Vinci</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

// Send welcome email after verification
async function sendWelcomeEmail(email, name) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ESILV Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to ESILV Marketplace!',
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
              border-radius: 5px 5px 0 0;
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
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .feature-list { 
              background-color: white; 
              padding: 20px; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              font-size: 12px; 
              color: #666; 
              border-top: 1px solid #ddd;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <h1 class="logo-text">ESILV</h1>
              </div>
              <h1 style="margin: 0;">🎉 Email Verified Successfully!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Congratulations! Your email has been successfully verified.</p>
              <div class="feature-list">
                <p>You can now enjoy all the features of ESILV Marketplace:</p>
                <ul>
                  <li>Buy and sell items within the ESILV community</li>
                  <li>Create and manage your product listings</li>
                  <li>Connect with other students</li>
                  <li>Add items to your favorites</li>
                </ul>
              </div>
              <p>Happy trading!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ESILV Marketplace. All rights reserved.</p>
              <p>ESILV - École Supérieure d'Ingénieurs Léonard de Vinci</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail
};
