# Email Service Setup Guide

## Overview
This guide will help you set up Amazon SES SMTP email functionality for your NewRun backend.

## Prerequisites
1. AWS Account with Amazon SES configured
2. Verified email domain or email address in SES
3. SMTP credentials generated in SES

## Environment Variables Required

Add these variables to your `.env` file:

```env
# Amazon SES SMTP Configuration
SES_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your_ses_smtp_username
SES_SMTP_PASSWORD=your_ses_smtp_password

# Email Configuration
FROM_EMAIL=noreply@newrun.app
FRONTEND_URL=http://localhost:3000
```

## Installation

1. Install the nodemailer dependency:
```bash
npm install nodemailer
```

2. The email service is already configured in `/backend/services/emailService.js`

## Available Email Endpoints

### 1. Send OTP
**POST** `/send-otp`
```json
{
  "email": "user@example.com",
  "purpose": "login" // or "email_verification", "password_reset", "two_factor"
}
```

### 2. Verify OTP
**POST** `/verify-otp`
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "login"
}
```

### 3. Send Email Verification
**POST** `/send-email-verification`
- Requires authentication token
- Sends verification link to user's email

### 4. Verify Email with Token
**POST** `/verify-email`
```json
{
  "token": "verification_token_here"
}
```

### 5. Forgot Password
**POST** `/forgot-password`
```json
{
  "email": "user@example.com"
}
```

### 6. Reset Password
**POST** `/reset-password`
```json
{
  "token": "reset_token_here",
  "newPassword": "new_password_here"
}
```

## Email Templates

The service includes beautiful HTML email templates for:

1. **Email Verification** - Welcome email with verification link
2. **OTP** - Clean OTP code display with security warnings
3. **Password Reset** - Secure password reset with expiration warnings
4. **Welcome Email** - Post-verification welcome with feature highlights

## Testing

### Test Email Sending
You can test the email service by making a POST request to any of the endpoints above.

### Sample Test Script
```javascript
// Test sending OTP
fetch('http://localhost:8000/send-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    purpose: 'login'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Security Features

1. **OTP Expiration** - OTPs expire in 10 minutes
2. **Token Expiration** - Verification tokens expire in 24 hours, reset tokens in 1 hour
3. **Purpose-based OTPs** - Different OTP purposes prevent cross-use
4. **Secure Password Hashing** - Uses bcrypt with 12 salt rounds
5. **JWT Token Security** - All tokens are signed with your secret key

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Verify your SES SMTP credentials
   - Ensure your AWS region matches the SMTP host
   - Check if your AWS account is out of sandbox mode

2. **Email Not Sending**
   - Verify the FROM_EMAIL is verified in SES
   - Check SES sending limits
   - Ensure proper AWS permissions

3. **Template Issues**
   - All templates are responsive and tested
   - Check console logs for email service errors

### Debug Mode
The email service logs all operations. Check your console for:
- ✅ Email service initialization
- ✅ Email sent successfully messages
- ❌ Failed email attempts with error details

## Production Considerations

1. **Rate Limiting** - Consider implementing rate limiting for email endpoints
2. **Email Queuing** - For high volume, consider using a job queue like Bull
3. **Monitoring** - Set up monitoring for email delivery rates
4. **Backup SMTP** - Consider having a backup email service
5. **Template Customization** - Customize templates for your brand

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your SES configuration in AWS Console
3. Test with a simple email first before complex templates
4. Ensure your domain is properly verified in SES
