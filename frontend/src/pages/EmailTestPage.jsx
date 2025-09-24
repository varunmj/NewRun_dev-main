import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEmailService } from '../components/EmailService.jsx';
import { useEmailNotifications } from '../components/EmailNotifications.jsx';
import { 
  EmailActionButton,
  EmailProgressSteps,
  OTPInput,
  EmailStatus
} from '../components/EmailService.jsx';
import { EmailNotificationContainer } from '../components/EmailNotifications.jsx';
import { EmailDashboard } from '../components/EmailDashboard.jsx';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Shield,
  User,
  Key,
  TestTube
} from 'lucide-react';

export default function EmailTestPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testEmail, setTestEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  
  const emailService = useEmailService();
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    sendOTPWithNotification,
    verifyOTPWithNotification 
  } = useEmailNotifications();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <TestTube className="h-4 w-4" /> },
    { id: 'otp', label: 'OTP Test', icon: <Shield className="h-4 w-4" /> },
    { id: 'verification', label: 'Email Verification', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'password', label: 'Password Reset', icon: <Key className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Mail className="h-4 w-4" /> }
  ];

  // OTP Test Functions
  const handleSendOTP = async () => {
    if (!testEmail.trim()) {
      addNotification('error', 'Please enter an email address');
      return;
    }

    const result = await sendOTPWithNotification(testEmail, 'test');
    if (result.success) {
      setStep(2);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      addNotification('error', 'Please enter a complete 6-digit OTP');
      return;
    }

    const result = await verifyOTPWithNotification(testEmail, otp, 'test');
    if (result.success) {
      addNotification('success', 'OTP verified successfully!');
      setStep(1);
      setOtp('');
    }
  };

  // Email Verification Functions
  const handleSendEmailVerification = async () => {
    const result = await emailService.sendEmailVerification();
    if (result.success) {
      addNotification('success', 'Verification email sent!');
    } else {
      addNotification('error', result.error);
    }
  };

  // Password Reset Functions
  const handleForgotPassword = async () => {
    if (!testEmail.trim()) {
      addNotification('error', 'Please enter an email address');
      return;
    }

    const result = await emailService.forgotPassword(testEmail);
    if (result.success) {
      addNotification('success', 'Password reset email sent!');
      setStep(2);
    } else {
      addNotification('error', result.error);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6 || !newPassword.trim()) {
      addNotification('error', 'Please enter OTP and new password');
      return;
    }

    const result = await emailService.resetPassword(testEmail, otp, newPassword);
    if (result.success) {
      addNotification('success', 'Password reset successfully!');
      setStep(1);
      setOtp('');
      setNewPassword('');
    } else {
      addNotification('error', result.error);
    }
  };

  // Notification Test Functions
  const testNotifications = () => {
    addNotification('success', 'This is a success notification');
    addNotification('error', 'This is an error notification');
    addNotification('warning', 'This is a warning notification');
    addNotification('info', 'This is an info notification');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EmailDashboard />;

      case 'otp':
        return (
          <div className="space-y-6">
            <div className="bg-white/[0.02] rounded-lg border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                OTP Test
              </h3>
              
              <EmailProgressSteps 
                currentStep={step} 
                totalSteps={2} 
                steps={['Enter Email', 'Verify OTP']}
              />

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full h-10 rounded-md border border-white/12 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none"
                    />
                  </div>
                  
                  <EmailActionButton
                    action="send"
                    onAction={handleSendOTP}
                    isLoading={emailService.isLoading}
                  >
                    <Send className="h-4 w-4" />
                    Send OTP
                  </EmailActionButton>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Enter OTP Code
                    </label>
                    <OTPInput 
                      value={otp}
                      onChange={setOtp}
                      length={6}
                      disabled={emailService.isLoading}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <EmailActionButton
                      action="verify"
                      onAction={handleVerifyOTP}
                      isLoading={emailService.isLoading}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Verify OTP
                    </EmailActionButton>
                    
                    <EmailActionButton
                      action="resend"
                      onAction={handleSendOTP}
                      isLoading={emailService.isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Resend OTP
                    </EmailActionButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="bg-white/[0.02] rounded-lg border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Email Verification Test
              </h3>
              
              <div className="space-y-4">
                <p className="text-white/60 text-sm">
                  Test email verification functionality. This will send a verification email to the authenticated user.
                </p>
                
                <EmailActionButton
                  action="send"
                  onAction={handleSendEmailVerification}
                  isLoading={emailService.isLoading}
                >
                  <Mail className="h-4 w-4" />
                  Send Verification Email
                </EmailActionButton>
              </div>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-6">
            <div className="bg-white/[0.02] rounded-lg border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Reset Test
              </h3>
              
              <EmailProgressSteps 
                currentStep={step} 
                totalSteps={2} 
                steps={['Enter Email', 'Reset Password']}
              />

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full h-10 rounded-md border border-white/12 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none"
                    />
                  </div>
                  
                  <EmailActionButton
                    action="send"
                    onAction={handleForgotPassword}
                    isLoading={emailService.isLoading}
                  >
                    <Send className="h-4 w-4" />
                    Send Reset Code
                  </EmailActionButton>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Enter OTP Code
                    </label>
                    <OTPInput 
                      value={otp}
                      onChange={setOtp}
                      length={6}
                      disabled={emailService.isLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full h-10 rounded-md border border-white/12 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none"
                    />
                  </div>
                  
                  <EmailActionButton
                    action="verify"
                    onAction={handleResetPassword}
                    isLoading={emailService.isLoading}
                  >
                    <Key className="h-4 w-4" />
                    Reset Password
                  </EmailActionButton>
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white/[0.02] rounded-lg border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notification Test
              </h3>
              
              <div className="space-y-4">
                <p className="text-white/60 text-sm">
                  Test different types of email notifications.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => addNotification('success', 'Success notification test')}
                    className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                  >
                    Test Success
                  </button>
                  
                  <button
                    onClick={() => addNotification('error', 'Error notification test')}
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  >
                    Test Error
                  </button>
                  
                  <button
                    onClick={() => addNotification('warning', 'Warning notification test')}
                    className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium"
                  >
                    Test Warning
                  </button>
                  
                  <button
                    onClick={() => addNotification('info', 'Info notification test')}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                  >
                    Test Info
                  </button>
                </div>
                
                <button
                  onClick={testNotifications}
                  className="w-full px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
                >
                  Test All Notifications
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return <EmailDashboard />;
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0c0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Service Test Page</h1>
          <p className="text-white/60">Test and monitor all email service functionality</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#2f64ff] text-white'
                    : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>

        {/* Notifications Container */}
        <EmailNotificationContainer 
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    </main>
  );
}
