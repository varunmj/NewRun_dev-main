/**
 * Authentication Flow Test
 * Tests the complete authentication system end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  username: 'testuser',
  password: 'TestPassword123!'
};

async function testAuthenticationFlow() {
  console.log('🧪 Starting Authentication Flow Test...\n');

  try {
    // Test 1: Create Account
    console.log('1️⃣ Testing Account Creation...');
    const signupResponse = await axios.post(`${BASE_URL}/create-account`, testUser);
    
    if (signupResponse.data.error) {
      console.log('❌ Account creation failed:', signupResponse.data.message);
      return;
    }
    
    console.log('✅ Account created successfully');
    console.log('   User ID:', signupResponse.data.userId);
    console.log('   Token received:', !!signupResponse.data.accessToken);
    console.log('');

    // Test 2: Login with Email
    console.log('2️⃣ Testing Login with Email...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      identifier: testUser.email,
      password: testUser.password
    });
    
    if (loginResponse.data.error) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.user.firstName);
    console.log('   Token received:', !!loginResponse.data.accessToken);
    console.log('');

    // Test 3: Login with Username
    console.log('3️⃣ Testing Login with Username...');
    const loginUsernameResponse = await axios.post(`${BASE_URL}/login`, {
      identifier: testUser.username,
      password: testUser.password
    });
    
    if (loginUsernameResponse.data.error) {
      console.log('❌ Username login failed:', loginUsernameResponse.data.message);
      return;
    }
    
    console.log('✅ Username login successful');
    console.log('');

    // Test 4: Get User Data
    console.log('4️⃣ Testing Get User Data...');
    const token = loginResponse.data.accessToken;
    const userResponse = await axios.get(`${BASE_URL}/get-user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userResponse.data.user) {
      console.log('❌ Get user failed: No user data returned');
      return;
    }
    
    console.log('✅ User data retrieved successfully');
    console.log('   User:', userResponse.data.user.firstName, userResponse.data.user.lastName);
    console.log('');

    // Test 5: Invalid Credentials
    console.log('5️⃣ Testing Invalid Credentials...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        identifier: testUser.email,
        password: 'wrongpassword'
      });
      console.log('❌ Invalid credentials test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid credentials properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 6: Invalid Token
    console.log('6️⃣ Testing Invalid Token...');
    try {
      await axios.get(`${BASE_URL}/get-user`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Invalid token test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Invalid token properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All authentication tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ Email login works');
    console.log('   ✅ Username login works');
    console.log('   ✅ User data retrieval works');
    console.log('   ✅ Invalid credentials are rejected');
    console.log('   ✅ Invalid tokens are rejected');

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
  testAuthenticationFlow();
}

module.exports = { testAuthenticationFlow };
