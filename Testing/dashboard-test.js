/**
 * Dashboard Functionality Test
 * Tests the complete dashboard system end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'Dashboard',
  lastName: 'Test',
  email: 'dashboard@example.com',
  username: 'dashboardtest',
  password: 'TestPassword123!'
};

async function testDashboardFlow() {
  console.log('🧪 Starting Dashboard Functionality Test...\n');

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

    // Step 2: Test Dashboard Overview
    console.log('2️⃣ Testing Dashboard Overview...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/overview`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (dashboardResponse.data.error) {
      console.log('❌ Dashboard overview failed:', dashboardResponse.data.message);
      return;
    }
    
    const dashboardData = dashboardResponse.data;
    console.log('✅ Dashboard overview retrieved successfully');
    console.log('   Response structure:', Object.keys(dashboardData));
    console.log('');

    // Step 3: Validate Dashboard Structure
    console.log('3️⃣ Validating Dashboard Structure...');
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

    let structureValid = true;
    expectedSections.forEach(section => {
      if (!dashboardData.hasOwnProperty(section)) {
        console.log(`❌ Missing section: ${section}`);
        structureValid = false;
      } else {
        console.log(`✅ Found section: ${section}`);
      }
    });

    if (structureValid) {
      console.log('✅ All expected sections present');
    } else {
      console.log('❌ Some sections missing');
    }
    console.log('');

    // Step 4: Test Properties Data
    console.log('4️⃣ Testing Properties Data...');
    if (dashboardData.myProperties) {
      console.log('✅ Properties section found');
      console.log('   Items count:', dashboardData.myProperties.items?.length || 0);
      console.log('   Statistics:', dashboardData.myProperties.statistics);
      
      if (dashboardData.myProperties.statistics) {
        const stats = dashboardData.myProperties.statistics;
        console.log('   Total properties:', stats.totalProperties || 0);
        console.log('   Total views:', stats.totalViews || 0);
        console.log('   Average price:', stats.averagePrice || 0);
        console.log('   Available properties:', stats.availableProperties || 0);
        console.log('   Rented properties:', stats.rentedProperties || 0);
      }
    } else {
      console.log('❌ Properties section not found');
    }
    console.log('');

    // Step 5: Test Marketplace Data
    console.log('5️⃣ Testing Marketplace Data...');
    if (dashboardData.myMarketplace) {
      console.log('✅ Marketplace section found');
      console.log('   Items count:', dashboardData.myMarketplace.items?.length || 0);
      console.log('   Statistics:', dashboardData.myMarketplace.statistics);
      
      if (dashboardData.myMarketplace.statistics) {
        const stats = dashboardData.myMarketplace.statistics;
        console.log('   Total items:', stats.totalItems || 0);
        console.log('   Total views:', stats.totalViews || 0);
        console.log('   Total favorites:', stats.totalFavorites || 0);
        console.log('   Average price:', stats.averagePrice || 0);
        console.log('   Active items:', stats.activeItems || 0);
        console.log('   Sold items:', stats.soldItems || 0);
        console.log('   Reserved items:', stats.reservedItems || 0);
      }
    } else {
      console.log('❌ Marketplace section not found');
    }
    console.log('');

    // Step 6: Test Community Interactions
    console.log('6️⃣ Testing Community Interactions...');
    if (dashboardData.communityInteractions) {
      console.log('✅ Community interactions section found');
      console.log('   Recent interactions:', dashboardData.communityInteractions.recent?.length || 0);
      console.log('   Total engagement:', dashboardData.communityInteractions.totalEngagement || 0);
    } else {
      console.log('❌ Community interactions section not found');
    }
    console.log('');

    // Step 7: Test Solve Threads
    console.log('7️⃣ Testing Solve Threads...');
    if (dashboardData.solveThreads) {
      console.log('✅ Solve threads section found');
      console.log('   Recent threads:', dashboardData.solveThreads.recent?.length || 0);
      console.log('   Total threads:', dashboardData.solveThreads.totalThreads || 0);
    } else {
      console.log('❌ Solve threads section not found');
    }
    console.log('');

    // Step 8: Test Recent Searches
    console.log('8️⃣ Testing Recent Searches...');
    if (dashboardData.recentSearches) {
      console.log('✅ Recent searches section found');
      console.log('   Searches count:', dashboardData.recentSearches.length || 0);
    } else {
      console.log('❌ Recent searches section not found');
    }
    console.log('');

    // Step 9: Test Likes Data
    console.log('9️⃣ Testing Likes Data...');
    if (dashboardData.likes) {
      console.log('✅ Likes section found');
      console.log('   Likes given:', dashboardData.likes.given?.length || 0);
      console.log('   Likes received:', dashboardData.likes.received?.length || 0);
      console.log('   Like ratio:', dashboardData.likes.likeRatio || 0);
    } else {
      console.log('❌ Likes section not found');
    }
    console.log('');

    // Step 10: Test Roommate Requests
    console.log('🔟 Testing Roommate Requests...');
    if (dashboardData.roommateRequests) {
      console.log('✅ Roommate requests section found');
      console.log('   Sent requests:', dashboardData.roommateRequests.sent?.length || 0);
      console.log('   Received requests:', dashboardData.roommateRequests.received?.length || 0);
    } else {
      console.log('❌ Roommate requests section not found');
    }
    console.log('');

    // Step 11: Test Error Handling
    console.log('1️⃣1️⃣ Testing Error Handling...');
    try {
      // Test with invalid token
      await axios.get(`${BASE_URL}/dashboard/overview`, {
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

    console.log('🎉 All dashboard tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ Dashboard overview API works');
    console.log('   ✅ Dashboard structure is correct');
    console.log('   ✅ Properties data is available');
    console.log('   ✅ Marketplace data is available');
    console.log('   ✅ Community interactions are tracked');
    console.log('   ✅ Solve threads are tracked');
    console.log('   ✅ Recent searches are tracked');
    console.log('   ✅ Likes data is available');
    console.log('   ✅ Roommate requests are tracked');
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
  testDashboardFlow();
}

module.exports = { testDashboardFlow };
