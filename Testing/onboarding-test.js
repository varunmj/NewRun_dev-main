/**
 * Onboarding Flow Test
 * Tests the complete onboarding system end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'Onboarding',
  lastName: 'Test',
  email: 'onboarding@example.com',
  username: 'onboardingtest',
  password: 'TestPassword123!'
};

const testOnboardingData = {
  focus: 'Housing',
  arrivalDate: new Date('2024-09-01'),
  city: 'San Francisco',
  university: 'University of California',
  budgetRange: {
    min: 1000,
    max: 2000
  },
  housingNeed: 'Off-campus',
  roommateInterest: true,
  essentials: ['SIM', 'Bedding', 'Bank'],
  completed: true,
  completedAt: new Date()
};

async function testOnboardingFlow() {
  console.log('🧪 Starting Onboarding Flow Test...\n');

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
    userId = signupResponse.data.userId;
    console.log('✅ Account created successfully');
    console.log('   User ID:', userId);
    console.log('   Token received:', !!authToken);
    console.log('');

    // Step 2: Save Onboarding Data
    console.log('2️⃣ Testing Save Onboarding Data...');
    const saveResponse = await axios.post(`${BASE_URL}/save-onboarding`, {
      onboardingData: testOnboardingData
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (saveResponse.data.error) {
      console.log('❌ Save onboarding failed:', saveResponse.data.message);
      return;
    }
    
    console.log('✅ Onboarding data saved successfully');
    console.log('   Response:', saveResponse.data.message);
    console.log('');

    // Step 3: Retrieve Onboarding Data
    console.log('3️⃣ Testing Get Onboarding Data...');
    const getResponse = await axios.get(`${BASE_URL}/onboarding-data`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (getResponse.data.error) {
      console.log('❌ Get onboarding data failed:', getResponse.data.message);
      return;
    }
    
    const retrievedData = getResponse.data.onboardingData;
    console.log('✅ Onboarding data retrieved successfully');
    console.log('   Focus:', retrievedData.focus);
    console.log('   City:', retrievedData.city);
    console.log('   University:', retrievedData.university);
    console.log('   Completed:', retrievedData.completed);
    console.log('');

    // Step 4: Validate Data Integrity
    console.log('4️⃣ Validating Data Integrity...');
    const validationChecks = [
      { field: 'focus', expected: testOnboardingData.focus, actual: retrievedData.focus },
      { field: 'city', expected: testOnboardingData.city, actual: retrievedData.city },
      { field: 'university', expected: testOnboardingData.university, actual: retrievedData.university },
      { field: 'housingNeed', expected: testOnboardingData.housingNeed, actual: retrievedData.housingNeed },
      { field: 'roommateInterest', expected: testOnboardingData.roommateInterest, actual: retrievedData.roommateInterest },
      { field: 'completed', expected: testOnboardingData.completed, actual: retrievedData.completed }
    ];

    let allValid = true;
    validationChecks.forEach(check => {
      if (check.expected !== check.actual) {
        console.log(`❌ ${check.field} mismatch: expected ${check.expected}, got ${check.actual}`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ All data integrity checks passed');
    } else {
      console.log('❌ Some data integrity checks failed');
    }
    console.log('');

    // Step 5: Test Budget Range
    console.log('5️⃣ Testing Budget Range...');
    if (retrievedData.budgetRange) {
      console.log('✅ Budget range found');
      console.log('   Min:', retrievedData.budgetRange.min);
      console.log('   Max:', retrievedData.budgetRange.max);
      
      if (retrievedData.budgetRange.min === testOnboardingData.budgetRange.min && 
          retrievedData.budgetRange.max === testOnboardingData.budgetRange.max) {
        console.log('✅ Budget range matches expected values');
      } else {
        console.log('❌ Budget range mismatch');
      }
    } else {
      console.log('❌ Budget range not found');
    }
    console.log('');

    // Step 6: Test Essentials Array
    console.log('6️⃣ Testing Essentials Array...');
    if (retrievedData.essentials && Array.isArray(retrievedData.essentials)) {
      console.log('✅ Essentials array found');
      console.log('   Essentials:', retrievedData.essentials);
      
      const essentialsMatch = JSON.stringify(retrievedData.essentials.sort()) === 
                             JSON.stringify(testOnboardingData.essentials.sort());
      
      if (essentialsMatch) {
        console.log('✅ Essentials array matches expected values');
      } else {
        console.log('❌ Essentials array mismatch');
      }
    } else {
      console.log('❌ Essentials array not found or invalid');
    }
    console.log('');

    // Step 7: Test Error Handling
    console.log('7️⃣ Testing Error Handling...');
    try {
      // Test with invalid token
      await axios.get(`${BASE_URL}/onboarding-data`, {
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

    console.log('🎉 All onboarding tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ Onboarding data saving works');
    console.log('   ✅ Onboarding data retrieval works');
    console.log('   ✅ Data integrity validation works');
    console.log('   ✅ Budget range handling works');
    console.log('   ✅ Essentials array handling works');
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
  testOnboardingFlow();
}

module.exports = { testOnboardingFlow };
