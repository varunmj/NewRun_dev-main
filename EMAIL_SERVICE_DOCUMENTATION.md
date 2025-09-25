# NewRun Email Service Documentation

## Overview

The NewRun email service provides a comprehensive email management system with OTP verification, password reset, email verification, and notification capabilities. It's built with Amazon SES SMTP and includes both backend API endpoints and frontend React components.

## 🚀 Features

- **OTP Verification**: Send and verify one-time passwords
- **Email Verification**: Verify user email addresses with secure tokens
- **Password Reset**: Secure password reset flow with OTP verification
- **Welcome Emails**: Automated welcome emails for new users
- **Email Notifications**: Real-time email status notifications
- **Email Dashboard**: Monitor email statistics and activity
- **Multi-step UI**: Beautiful, responsive UI for all email flows

## 📧 Backend API Endpoints

### 1. Send OTP
```http
POST /send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "purpose": "login" // or "email_verification", "password_reset", "two_factor"
}
```

### 2. Verify OTP
```http
POST /verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "login"
}
```

### 3. Send Email Verification
```http
POST /send-email-verification
Authorization: Bearer <token>
```

### 4. Verify Email with Token
```http
POST /verify-email
Content-Type: application/json

{
  "token": "verification_token_here"
}
```

### 5. Forgot Password
```http
POST /forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 6. Reset Password
```http
POST /reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "new_password_here"
}
```

### 7. Send Welcome Email
```http
POST /send-welcome-email
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "userName": "John Doe"
}
```

### 8. Test Email Service
```http
POST /test-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

## 🎨 Frontend Components

### 1. ForgotPassword Page
**Route**: `/forgot`

A multi-step password reset flow:
1. **Email Input**: User enters their email address
2. **OTP Verification**: User enters the 6-digit OTP code
3. **New Password**: User sets a new password
4. **Success**: Confirmation and redirect to login

**Usage**:
```jsx
import ForgotPassword from './pages/ForgotPassword';

// Automatically handles the complete flow
<Route path="/forgot" element={<ForgotPassword />} />
```

### 2. EmailVerification Page
**Route**: `/verify-email`

Handles email verification with tokens:
- Auto-verifies if token is present in URL
- Manual verification option
- Resend verification email
- Success/error states

**Usage**:
```jsx
import EmailVerification from './pages/EmailVerification';

<Route path="/verify-email" element={<EmailVerification />} />
```

### 3. EmailService Context
Provides email service functions throughout the app:

```jsx
import { useEmailService } from './components/EmailService';

function MyComponent() {
  const { sendOTP, verifyOTP, isLoading, error } = useEmailService();
  
  const handleSendOTP = async () => {
    const result = await sendOTP('user@example.com', 'login');
    if (result.success) {
      console.log('OTP sent successfully');
    }
  };
}
```

### 4. Email Notifications
Real-time email status notifications:

```jsx
import { useEmailNotifications } from './components/EmailNotifications';

function MyComponent() {
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    sendOTPWithNotification 
  } = useEmailNotifications();
  
  // Send OTP with automatic notification
  const handleSendOTP = async () => {
    await sendOTPWithNotification('user@example.com', 'login');
  };
}
```

### 5. Email Dashboard
Monitor email statistics and activity:

```jsx
import EmailDashboard from './components/EmailDashboard';

function AdminPanel() {
  return (
    <div>
      <EmailDashboard />
    </div>
  );
}
```

## 🔧 Setup and Configuration

### 1. Environment Variables
Create a `.env` file in your backend directory:

```env
# Amazon SES SMTP Configuration
SES_SMTP_HOST=email-smtp.us-east-2.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your_ses_smtp_username
SES_SMTP_PASSWORD=your_ses_smtp_password
FROM_EMAIL=noreply@newrun.club
FRONTEND_URL=http://localhost:3000

# JWT Secret
ACCESS_TOKEN_SECRET=your_jwt_secret
```

### 2. Install Dependencies
```bash
# Backend
npm install nodemailer

# Frontend (already included)
npm install framer-motion lucide-react
```

### 3. Database Schema Updates
The email service requires additional fields in your User model:

```javascript
// Add to your User schema
{
  // Email verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  
  // OTP for various purposes
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  otpPurpose: { type: String, enum: ['email_verification', 'password_reset', 'login', 'two_factor'], default: null },
  
  // Password reset
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null }
}
```

## 🎯 Usage Examples

### 1. Basic OTP Flow
```jsx
import { useEmailService } from './components/EmailService';

function LoginWithOTP() {
  const { sendOTP, verifyOTP, isLoading } = useEmailService();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);

  const handleSendOTP = async () => {
    const result = await sendOTP(email, 'login');
    if (result.success) {
      setStep(2);
    }
  };

  const handleVerifyOTP = async () => {
    const result = await verifyOTP(email, otp, 'login');
    if (result.success) {
      // Proceed with login
    }
  };

  return (
    <div>
      {step === 1 && (
        <div>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
          <button onClick={handleSendOTP} disabled={isLoading}>
            Send OTP
          </button>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <input 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={handleVerifyOTP} disabled={isLoading}>
            Verify OTP
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2. Email Verification Flow
```jsx
import { useEmailService } from './components/EmailService';

function EmailVerificationFlow() {
  const { sendEmailVerification, verifyEmail, isLoading } = useEmailService();
  const [token, setToken] = useState('');

  const handleSendVerification = async () => {
    const result = await sendEmailVerification();
    if (result.success) {
      alert('Verification email sent!');
    }
  };

  const handleVerifyEmail = async () => {
    const result = await verifyEmail(token);
    if (result.success) {
      alert('Email verified successfully!');
    }
  };

  return (
    <div>
      <button onClick={handleSendVerification} disabled={isLoading}>
        Send Verification Email
      </button>
      
      <input 
        value={token} 
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter verification token"
      />
      <button onClick={handleVerifyEmail} disabled={isLoading}>
        Verify Email
      </button>
    </div>
  );
}
```

### 3. Password Reset Flow
```jsx
import { useEmailService } from './components/EmailService';

function PasswordResetFlow() {
  const { forgotPassword, resetPassword, isLoading } = useEmailService();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);

  const handleForgotPassword = async () => {
    const result = await forgotPassword(email);
    if (result.success) {
      setStep(2);
    }
  };

  const handleResetPassword = async () => {
    const result = await resetPassword(email, otp, newPassword);
    if (result.success) {
      alert('Password reset successfully!');
    }
  };

  return (
    <div>
      {step === 1 && (
        <div>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
          <button onClick={handleForgotPassword} disabled={isLoading}>
            Send Reset Code
          </button>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <input 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <input 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            type="password"
          />
          <button onClick={handleResetPassword} disabled={isLoading}>
            Reset Password
          </button>
        </div>
      )}
    </div>
  );
}
```

## 🎨 UI Components

### 1. OTP Input Component
```jsx
import { OTPInput } from './components/EmailService';

function MyComponent() {
  const [otp, setOtp] = useState('');

  return (
    <OTPInput 
      value={otp}
      onChange={setOtp}
      length={6}
      disabled={false}
    />
  );
}
```

### 2. Email Status Component
```jsx
import { EmailStatus } from './components/EmailService';

function MyComponent() {
  return (
    <EmailStatus 
      type="success"
      message="Email sent successfully!"
      onClose={() => console.log('closed')}
    />
  );
}
```

### 3. Email Notifications
```jsx
import { EmailNotificationContainer } from './components/EmailNotifications';

function App() {
  const [notifications, setNotifications] = useState([]);

  return (
    <div>
      <EmailNotificationContainer 
        notifications={notifications}
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </div>
  );
}
```

## 🔒 Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Token Expiration**: Email verification tokens expire after 24 hours
3. **Password Reset Expiration**: Password reset tokens expire after 1 hour
4. **Rate Limiting**: Built-in protection against spam
5. **Secure SMTP**: Uses Amazon SES with TLS encryption
6. **Input Validation**: All inputs are validated on both frontend and backend

## 📊 Monitoring and Analytics

The email dashboard provides:
- **Email Statistics**: Total sent, successful, failed, success rate
- **Activity Feed**: Real-time email activity
- **Service Status**: Connection status and health checks
- **Test Panel**: Test email functionality

## 🚨 Error Handling

All email operations include comprehensive error handling:
- **Network Errors**: Connection issues, timeouts
- **Validation Errors**: Invalid email formats, missing fields
- **Authentication Errors**: Invalid tokens, expired OTPs
- **SMTP Errors**: Delivery failures, bounce handling

## 🔧 Troubleshooting

### Common Issues:

1. **"Email transporter not initialized"**
   - Check your environment variables
   - Ensure SES credentials are correct
   - Verify SMTP host and port

2. **"Message rejected: Email address is not verified"**
   - You're in SES sandbox mode
   - Verify sender and recipient emails in AWS SES console
   - Request production access for sending to any email

3. **"Failed to send email"**
   - Check internet connection
   - Verify SES credentials
   - Check AWS SES quotas and limits

### Debug Steps:

1. Check backend logs for detailed error messages
2. Verify environment variables are loaded
3. Test email service with `/test-email` endpoint
4. Check AWS SES console for delivery status
5. Verify email addresses are verified in SES

## 📈 Performance Optimization

1. **Connection Pooling**: Reuse SMTP connections
2. **Async Processing**: Non-blocking email sending
3. **Queue System**: Handle high-volume email sending
4. **Caching**: Cache email templates and configurations
5. **Monitoring**: Track email delivery metrics

## 🎯 Best Practices

1. **Always validate email addresses** before sending
2. **Use appropriate email templates** for different purposes
3. **Implement rate limiting** to prevent abuse
4. **Monitor delivery rates** and handle bounces
5. **Test thoroughly** in development environment
6. **Use environment variables** for sensitive data
7. **Implement proper error handling** for all scenarios

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs for detailed errors
3. Test with the `/test-email` endpoint
4. Verify AWS SES configuration
5. Check email service status in the dashboard

---

**Happy Email Sending! 📧✨**

