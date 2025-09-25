const axios = require('axios');

async function testOnboardingAPI() {
  try {
    console.log('🧪 Testing onboarding API...');
    
    // Test data
    const testOnboardingData = {
      focus: 'Housing',
      arrivalDate: new Date().toISOString(),
      city: 'Test City',
      university: 'Test University',
      budgetRange: {
        min: 1000,
        max: 2000
      },
      housingNeed: 'Off-campus',
      roommateInterest: true,
      essentials: ['SIM', 'Bank'],
      completed: true,
      completedAt: new Date().toISOString()
    };

    console.log('📊 Test data:', JSON.stringify(testOnboardingData, null, 2));

    // You'll need to replace this with a valid token
    const token = 'YOUR_TOKEN_HERE';
    
    if (token === 'YOUR_TOKEN_HERE') {
      console.log('❌ Please replace YOUR_TOKEN_HERE with a valid token');
      return;
    }

    // Test save onboarding
    console.log('🚀 Testing save onboarding...');
    const saveResponse = await axios.post('http://localhost:8000/save-onboarding', {
      onboardingData: testOnboardingData
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Save response:', saveResponse.data);

    // Test get onboarding
    console.log('🔍 Testing get onboarding...');
    const getResponse = await axios.get('http://localhost:8000/onboarding-data', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Get response:', getResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testOnboardingAPI();
