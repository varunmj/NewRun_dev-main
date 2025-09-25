const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

// Get token from localStorage (you'll need to copy this from browser console)
const TEST_TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token

const testSaveOnboarding = async () => {
  try {
    console.log('--- Testing /save-onboarding ---');
    const onboardingData = {
      focus: 'Housing',
      arrivalDate: '2024-09-01T00:00:00.000Z',
      city: 'Chicago',
      university: 'University of Illinois Chicago',
      budgetRange: { min: 800, max: 1500 },
      housingNeed: 'Off-campus',
      roommateInterest: true,
      essentials: ['SIM', 'Bedding'],
      completed: true,
      completedAt: new Date().toISOString()
    };

    const response = await axios.post(`${API_BASE_URL}/save-onboarding`, { onboardingData }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Save Onboarding Response:', response.data);
  } catch (error) {
    console.error('Error saving onboarding data:', error.response ? error.response.data : error.message);
  }
};

const testGetOnboardingData = async () => {
  try {
    console.log('\n--- Testing /onboarding-data ---');
    const response = await axios.get(`${API_BASE_URL}/onboarding-data`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log('Get Onboarding Data Response:', response.data);
  } catch (error) {
    console.error('Error getting onboarding data:', error.response ? error.response.data : error.message);
  }
};

const testManualSave = async () => {
  try {
    console.log('\n--- Testing /test-save-onboarding ---');
    const response = await axios.post(`${API_BASE_URL}/test-save-onboarding`, {}, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    console.log('Manual Test Save Response:', response.data);
  } catch (error) {
    console.error('Error in manual test save:', error.response ? error.response.data : error.message);
  }
};

const runTests = async () => {
  console.log('🧪 Starting onboarding API tests...');
  console.log('📝 Make sure to replace TEST_TOKEN with your actual token');
  
  if (TEST_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('❌ Please replace TEST_TOKEN with your actual token from browser localStorage');
    return;
  }

  await testGetOnboardingData();
  await testManualSave();
  await testGetOnboardingData();
  await testSaveOnboarding();
  await testGetOnboardingData();
};

runTests();

