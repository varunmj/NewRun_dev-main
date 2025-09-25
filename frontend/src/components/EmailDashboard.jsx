import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEmailService } from './EmailService.jsx';
import { useEmailNotifications } from './EmailNotifications.jsx';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Shield,
  User,
  Key,
  BarChart3,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

// Email Statistics Component
export const EmailStatistics = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Emails Sent',
      value: stats?.totalSent || 0,
      icon: <Send className="h-6 w-6" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Successful Deliveries',
      value: stats?.successful || 0,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Failed Deliveries',
      value: stats?.failed || 0,
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`rounded-lg border p-4 ${card.bgColor} ${card.borderColor}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`${card.color}`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-white">
              {card.value}
            </div>
          </div>
          <div className="text-sm text-white/60">
            {card.title}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Email Activity Feed
export const EmailActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'otp_sent':
        return <Shield className="h-4 w-4 text-blue-400" />;
      case 'otp_verified':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'email_verified':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'password_reset':
        return <Key className="h-4 w-4 text-purple-400" />;
      case 'welcome_sent':
        return <User className="h-4 w-4 text-amber-400" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'otp_sent':
        return 'text-blue-300';
      case 'otp_verified':
        return 'text-green-300';
      case 'email_verified':
        return 'text-green-300';
      case 'password_reset':
        return 'text-purple-300';
      case 'welcome_sent':
        return 'text-amber-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/10 p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Recent Email Activity
      </h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities?.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                  {activity.message}
                </div>
                <div className="text-xs text-white/60 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.timestamp}
                </div>
              </div>
              <div className="text-xs text-white/40">
                {activity.status === 'success' ? '✓' : '✗'}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-white/60 py-8">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No email activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Email Service Status
export const EmailServiceStatus = ({ isConnected, lastCheck }) => {
  const getStatusConfig = () => {
    if (isConnected) {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        text: 'Connected',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    } else {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        text: 'Disconnected',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={config.color}>
            {config.icon}
          </div>
          <span className={`font-medium ${config.color}`}>
            Email Service
          </span>
        </div>
        <div className="text-sm text-white/60">
          {config.text}
        </div>
      </div>
      {lastCheck && (
        <div className="text-xs text-white/60">
          Last checked: {lastCheck}
        </div>
      )}
    </div>
  );
};

// Email Test Panel
export const EmailTestPanel = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { sendOTP, isLoading, error } = useEmailService();
  const { addNotification } = useEmailNotifications();

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      addNotification('error', 'Please enter an email address');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await sendOTP(testEmail, 'test');
      
      if (result.success) {
        setTestResult({ success: true, message: 'Test email sent successfully!' });
        addNotification('success', 'Test email sent successfully!');
      } else {
        setTestResult({ success: false, message: result.error });
        addNotification('error', result.error);
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Test failed' });
      addNotification('error', 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/10 p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <RefreshCw className="h-5 w-5" />
        Test Email Service
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email to test"
            className="w-full h-10 rounded-md border border-white/12 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/45 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none"
          />
        </div>

        <button
          onClick={handleTestEmail}
          disabled={isTesting || isLoading}
          className="w-full h-10 rounded-md bg-[#2f64ff] text-sm font-medium text-white hover:bg-[#2958e3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isTesting || isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Test Email
            </>
          )}
        </button>

        {testResult && (
          <div className={`p-3 rounded-md text-sm ${
            testResult.success 
              ? 'bg-green-500/10 border border-green-500/40 text-green-300'
              : 'bg-red-500/10 border border-red-500/40 text-red-300'
          }`}>
            {testResult.message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Email Dashboard Component
export const EmailDashboard = () => {
  const [stats, setStats] = useState({
    totalSent: 0,
    successful: 0,
    failed: 0,
    successRate: 0
  });
  const [activities, setActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date().toLocaleTimeString());

  // Mock data - in real app, this would come from API
  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalSent: 1247,
      successful: 1189,
      failed: 58,
      successRate: 95.3
    });

    // Simulate loading activities
    setActivities([
      {
        type: 'otp_sent',
        message: 'OTP sent to user@example.com',
        timestamp: '2 minutes ago',
        status: 'success'
      },
      {
        type: 'email_verified',
        message: 'Email verified for new user',
        timestamp: '5 minutes ago',
        status: 'success'
      },
      {
        type: 'password_reset',
        message: 'Password reset email sent',
        timestamp: '10 minutes ago',
        status: 'success'
      },
      {
        type: 'welcome_sent',
        message: 'Welcome email sent to new user',
        timestamp: '15 minutes ago',
        status: 'success'
      }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Dashboard</h2>
          <p className="text-white/60 text-sm">Monitor and manage email services</p>
        </div>
        <div className="flex items-center gap-2">
          <EmailServiceStatus isConnected={isConnected} lastCheck={lastCheck} />
        </div>
      </div>

      {/* Statistics */}
      <EmailStatistics stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Activity Feed */}
        <EmailActivityFeed activities={activities} />

        {/* Email Test Panel */}
        <EmailTestPanel />
      </div>
    </div>
  );
};

export default EmailDashboard;

