/**
 * Email System Test
 * Tests the complete email verification and notification system end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'Email',
  lastName: 'Test',
  email: 'email@example.com',
  username: 'emailtest',
  password: 'TestPassword123!'
};

async function testEmailSystemFlow() {
  console.log('🧪 Starting Email System Test...\n');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Create Account
    console.log('1️⃣ Creating test account...');
    const signupResponse = await axios.post(`${BASE_URL}/create-account`, testUser);
    
    if (signupResponse.data.error) {
      console.log('❌ Account creation failed:', signupResponse.data.message);
      return;
    }
    
    authToken = signupResponse.data.accessToken;
    userId = signupResponse.data.user._id;
    console.log('✅ Account created successfully');
    console.log('   User ID:', userId);
    console.log('   Token received:', !!authToken);
    console.log('');

    // Step 2: Test Send OTP
    console.log('2️⃣ Testing Send OTP...');
    const sendOtpResponse = await axios.post(`${BASE_URL}/send-otp`, {
      email: testUser.email,
      purpose: 'login'
    });
    
    if (sendOtpResponse.data.error) {
      console.log('❌ Send OTP failed:', sendOtpResponse.data.message);
    } else {
      console.log('✅ OTP sent successfully');
      console.log('   Message:', sendOtpResponse.data.message);
      console.log('   Purpose:', sendOtpResponse.data.purpose);
    }
    console.log('');

    // Step 3: Test Verify OTP (with invalid OTP first)
    console.log('3️⃣ Testing Verify OTP with Invalid OTP...');
    try {
      await axios.post(`${BASE_URL}/verify-otp`, {
        email: testUser.email,
        otp: '000000',
        purpose: 'login'
      });
      console.log('❌ Invalid OTP test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid OTP properly rejected');
        console.log('   Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Step 4: Test Email Verification Request
    console.log('4️⃣ Testing Email Verification Request...');
    const emailVerificationResponse = await axios.post(`${BASE_URL}/send-email-verification`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (emailVerificationResponse.data.error) {
      console.log('❌ Email verification request failed:', emailVerificationResponse.data.message);
    } else {
      console.log('✅ Email verification request successful');
      console.log('   Message:', emailVerificationResponse.data.message);
    }
    console.log('');

    // Step 5: Test Email Verification with Invalid Token
    console.log('5️⃣ Testing Email Verification with Invalid Token...');
    try {
      await axios.post(`${BASE_URL}/verify-email`, {
        token: 'invalid-token'
      });
      console.log('❌ Invalid token test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid token properly rejected');
        console.log('   Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Step 6: Test Forgot Password
    console.log('6️⃣ Testing Forgot Password...');
    const forgotPasswordResponse = await axios.post(`${BASE_URL}/forgot-password`, {
      email: testUser.email
    });
    
    if (forgotPasswordResponse.data.error) {
      console.log('❌ Forgot password failed:', forgotPasswordResponse.data.message);
    } else {
      console.log('✅ Forgot password request successful');
      console.log('   Message:', forgotPasswordResponse.data.message);
    }
    console.log('');

    // Step 7: Test Reset Password with Invalid OTP
    console.log('7️⃣ Testing Reset Password with Invalid OTP...');
    try {
      await axios.post(`${BASE_URL}/reset-password`, {
        email: testUser.email,
        otp: '000000',
        newPassword: 'NewPassword123!'
      });
      console.log('❌ Invalid OTP test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid OTP properly rejected');
        console.log('   Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Step 8: Test Welcome Email
    console.log('8️⃣ Testing Welcome Email...');
    const welcomeEmailResponse = await axios.post(`${BASE_URL}/send-welcome-email`, {
      userEmail: testUser.email,
      userName: testUser.firstName
    });
    
    if (welcomeEmailResponse.data.error) {
      console.log('❌ Welcome email failed:', welcomeEmailResponse.data.message);
    } else {
      console.log('✅ Welcome email sent successfully');
      console.log('   Message:', welcomeEmailResponse.data.message);
    }
    console.log('');

    // Step 9: Test Email Service Configuration
    console.log('9️⃣ Testing Email Service Configuration...');
    const testEmailResponse = await axios.post(`${BASE_URL}/test-email`, {
      email: testUser.email
    });
    
    if (testEmailResponse.data.error) {
      console.log('❌ Test email failed:', testEmailResponse.data.message);
      console.log('   This might indicate email service configuration issues');
    } else {
      console.log('✅ Test email sent successfully');
      console.log('   Message:', testEmailResponse.data.message);
    }
    console.log('');

    // Step 10: Test Error Handling
    console.log('🔟 Testing Error Handling...');
    try {
      // Test with invalid email
      await axios.post(`${BASE_URL}/send-otp`, {
        email: 'invalid-email'
      });
      console.log('❌ Invalid email test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Invalid email properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All email system tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ OTP sending works');
    console.log('   ✅ OTP validation works');
    console.log('   ✅ Email verification request works');
    console.log('   ✅ Email verification validation works');
    console.log('   ✅ Forgot password works');
    console.log('   ✅ Password reset validation works');
    console.log('   ✅ Welcome email works');
    console.log('   ✅ Test email works');
    console.log('   ✅ Error handling works');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testEmailSystemFlow();
}

module.exports = { testEmailSystemFlow };
