const axios = require('axios');

// Test script for the enhanced dashboard API
async function testDashboardAPI() {
  try {
    console.log('Testing Dashboard API...');
    
    // You'll need to replace this with a valid JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:3000/dashboard/overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard API Response Status:', response.status);
    console.log('📊 Response Data Structure:');
    
    const data = response.data;
    
    // Check if all expected sections are present
    const expectedSections = [
      'userSummary',
      'myProperties', 
      'myMarketplace',
      'communityInteractions',
      'solveThreads',
      'recentSearches',
      'likes',
      'roommateRequests',
      'needsAttention',
      'messagesPreview',
      'campusPulse',
      'profileProgress'
    ];
    
    expectedSections.forEach(section => {
      if (data[section]) {
        console.log(`✅ ${section}: Present`);
        
        // Show some details for key sections
        if (section === 'myProperties' && data[section].statistics) {
          console.log(`   📈 Properties Stats:`, data[section].statistics);
        }
        if (section === 'myMarketplace' && data[section].statistics) {
          console.log(`   🛒 Marketplace Stats:`, data[section].statistics);
        }
        if (section === 'likes') {
          console.log(`   ❤️  Likes - Given: ${data[section].given.count}, Received: ${data[section].received.count}`);
        }
        if (section === 'roommateRequests') {
          console.log(`   🏠 Roommate Requests - Sent: ${data[section].sent.count}, Received: ${data[section].received.count}`);
        }
      } else {
        console.log(`❌ ${section}: Missing`);
      }
    });
    
    console.log('\n🎉 Dashboard API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Dashboard API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testDashboardAPI();
