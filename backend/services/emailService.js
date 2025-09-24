const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    // Delay initialization to ensure env vars are loaded
    setTimeout(() => {
      this.initializeTransporter();
    }, 100);
  }

  initializeTransporter() {
    try {
      console.log('🔧 Initializing email service...');
      console.log('📧 SMTP Host:', process.env.SES_SMTP_HOST);
      console.log('🔌 SMTP Port:', process.env.SES_SMTP_PORT);
      console.log('👤 SMTP Username:', process.env.SES_SMTP_USERNAME ? 'Set' : 'Not Set');
      console.log('🔑 SMTP Password:', process.env.SES_SMTP_PASSWORD ? 'Set' : 'Not Set');
      console.log('📨 From Email:', process.env.FROM_EMAIL);

      this.transporter = nodemailer.createTransport({
        host: process.env.SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
        port: process.env.SES_SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SES_SMTP_USERNAME,
          pass: process.env.SES_SMTP_PASSWORD
        },
        tls: {
          ciphers: 'SSLv3'
        }
      });

      console.log('✅ Email service initialized with SES SMTP');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      console.log('📧 Attempting to send email...');
      console.log('📨 To:', to);
      console.log('📝 Subject:', subject);
      console.log('📤 From:', process.env.FROM_EMAIL || 'noreply@newrun.app');

      if (!this.transporter) {
        console.log('⚠️ Transporter not initialized, attempting to initialize...');
        this.initializeTransporter();
        if (!this.transporter) {
          throw new Error('Email transporter not initialized');
        }
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@newrun.app',
        to: to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html)
      };

      console.log('📋 Mail options prepared, sending...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log('📊 Response:', result.response);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:');
      console.error('🔍 Error type:', error.name);
      console.error('📝 Error message:', error.message);
      console.error('🔧 Error code:', error.code);
      console.error('📋 Error response:', error.response);
      console.error('📚 Full error:', error);
      return { success: false, error: error.message, details: error };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Email Templates
  generateEmailVerificationTemplate(userName, verificationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your NewRun Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          .code { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #333; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 NewRun</h1>
            <p>Welcome to the future of student housing</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${userName},</p>
            <p>Welcome to NewRun! We're excited to have you join our community of students finding their perfect housing solutions.</p>
            <p>To complete your account setup, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <div class="code">${verificationLink}</div>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with NewRun, please ignore this email.</p>
            <p>Best regards,<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>This email was sent to you because you signed up for a NewRun account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOTPTemplate(userName, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your NewRun OTP</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .otp-code { background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 32px; font-weight: bold; color: #333; margin: 30px 0; border: 2px dashed #667eea; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 NewRun</h1>
            <p>Your One-Time Password</p>
          </div>
          <div class="content">
            <h2>Your OTP Code</h2>
            <p>Hi ${userName},</p>
            <p>You requested a one-time password for your NewRun account. Use the code below to complete your action:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 10 minutes</li>
              <li>Never share this code with anyone</li>
              <li>NewRun will never ask for your OTP via phone or email</li>
            </ul>
            <p>If you didn't request this OTP, please secure your account immediately.</p>
            <p>Best regards,<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetTemplate(userName, resetLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your NewRun Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .button { display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 NewRun</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${userName},</p>
            <p>We received a request to reset your NewRun account password. If you made this request, click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 20px 0;">${resetLink}</div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            <p>If you didn't request a password reset, please secure your account and contact our support team.</p>
            <p>Best regards,<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>This email was sent because a password reset was requested for your account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NewRun</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; color: #666; }
          .feature { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to NewRun!</h1>
            <p>Your journey to perfect student housing starts here</p>
          </div>
          <div class="content">
            <h2>Welcome aboard, ${userName}!</h2>
            <p>Congratulations on joining NewRun - the ultimate platform for student housing solutions. We're thrilled to have you as part of our community!</p>
            
            <h3>🚀 What you can do with NewRun:</h3>
            <div class="feature">
              <strong>🏠 Find Properties</strong><br>
              Discover amazing properties near your university with our advanced search and filtering options.
            </div>
            <div class="feature">
              <strong>🛒 Marketplace</strong><br>
              Buy and sell items with fellow students in a safe, trusted marketplace.
            </div>
            <div class="feature">
              <strong>👥 Find Roommates</strong><br>
              Connect with compatible roommates using our smart matching system.
            </div>
            <div class="feature">
              <strong>💬 Community</strong><br>
              Join discussions, ask questions, and be part of the NewRun community.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://newrun.app'}" class="button">Start Exploring</a>
            </div>

            <p>Need help getting started? Our support team is here to assist you every step of the way.</p>
            <p>Happy housing hunting!<br>The NewRun Team</p>
          </div>
          <div class="footer">
            <p>© 2024 NewRun. All rights reserved.</p>
            <p>You're receiving this email because you signed up for NewRun.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Convenience methods
  async sendEmailVerification(userEmail, userName, verificationLink) {
    const subject = 'Verify Your NewRun Account';
    const html = this.generateEmailVerificationTemplate(userName, verificationLink);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendOTP(userEmail, userName, otp) {
    const subject = 'Your NewRun OTP Code';
    const html = this.generateOTPTemplate(userName, otp);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendPasswordReset(userEmail, userName, resetLink) {
    const subject = 'Reset Your NewRun Password';
    const html = this.generatePasswordResetTemplate(userName, resetLink);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendWelcomeEmail(userEmail, userName) {
    const subject = 'Welcome to NewRun! 🎉';
    const html = this.generateWelcomeTemplate(userName);
    return await this.sendEmail(userEmail, subject, html);
  }

  // Expose initialization method for manual reinitialization
  reinitialize() {
    this.initializeTransporter();
  }
}

module.exports = new EmailService();
