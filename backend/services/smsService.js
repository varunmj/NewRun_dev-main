const twilio = require('twilio');

class SMSService {
  constructor() {
    // Initialize Twilio client
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send SMS verification code to user's phone
   * @param {string} phoneNumber - User's phone number (E.164 format)
   * @param {string} code - Verification code
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendVerificationCode(phoneNumber, code) {
    try {
      const message = await this.client.messages.create({
        body: `Your NewRun verification code is: ${code}. This code expires in 10 minutes.`,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`SMS sent successfully to ${phoneNumber}. SID: ${message.sid}`);
      return {
        success: true,
        messageSid: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Send welcome SMS after successful verification
   * @param {string} phoneNumber - User's phone number
   * @param {string} firstName - User's first name
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendWelcomeMessage(phoneNumber, firstName) {
    try {
      const message = await this.client.messages.create({
        body: `Welcome to NewRun, ${firstName}! Your account is now verified and ready. You can access all platform features and connect with your campus community.`,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`Welcome SMS sent to ${phoneNumber}. SID: ${message.sid}`);
      return {
        success: true,
        messageSid: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('Welcome SMS sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send support notification SMS
   * @param {string} phoneNumber - User's phone number
   * @param {string} message - Support message
   * @returns {Promise<Object>} - Twilio message object
   */
  async sendSupportMessage(phoneNumber, message) {
    try {
      const smsMessage = await this.client.messages.create({
        body: `NewRun Support: ${message}`,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`Support SMS sent to ${phoneNumber}. SID: ${smsMessage.sid}`);
      return {
        success: true,
        messageSid: smsMessage.sid,
        status: smsMessage.status
      };
    } catch (error) {
      console.error('Support SMS sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Whether phone number is valid
   */
  validatePhoneNumber(phoneNumber) {
    // E.164 format: +1234567890 (10-15 digits after country code)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and is 11 digits, assume US number
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If it's 10 digits, assume US number without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it already has country code, add + if missing
    if (digits.length > 10) {
      return `+${digits}`;
    }
    
    return phoneNumber; // Return as-is if can't format
  }
}

module.exports = new SMSService();
