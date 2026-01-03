const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, you can use services like:
  // - Gmail (requires app password)
  // - SendGrid, Mailgun, AWS SES for production
  // - Mailtrap for testing
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send verification email
async function sendVerificationEmail(email, name, verificationToken) {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Student Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Student Marketplace',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #c70071; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Student Marketplace!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for registering with Student Marketplace! To complete your registration, please verify your email address.</p>
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
              <p>© ${new Date().getFullYear()} Student Marketplace. All rights reserved.</p>
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
      from: `"Student Marketplace" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Student Marketplace!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #c70071; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email Verified Successfully!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Congratulations! Your email has been successfully verified.</p>
              <p>You can now enjoy all the features of Student Marketplace:</p>
              <ul>
                <li>Buy and sell items within the ESILV community</li>
                <li>Create and manage your product listings</li>
                <li>Connect with other students</li>
                <li>Add items to your favorites</li>
              </ul>
              <p>Happy trading!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Student Marketplace. All rights reserved.</p>
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
