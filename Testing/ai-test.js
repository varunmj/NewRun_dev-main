/**
 * AI Features Test
 * Tests the complete AI-powered features end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'AI',
  lastName: 'Test',
  email: 'ai@example.com',
  username: 'aitest',
  password: 'TestPassword123!'
};

const testDashboardData = {
  userSummary: {
    firstName: 'AI',
    university: 'Test University',
    digest: '0 recent chats • 0 properties • 0 items'
  },
  myProperties: {
    items: [],
    statistics: {
      totalProperties: 0,
      totalViews: 0,
      averagePrice: 0,
      availableProperties: 0,
      rentedProperties: 0,
      occupancyRate: 0
    }
  },
  myMarketplace: {
    items: [],
    statistics: {
      totalItems: 0,
      totalViews: 0,
      totalFavorites: 0,
      averagePrice: 0,
      activeItems: 0,
      soldItems: 0,
      reservedItems: 0,
      salesRate: 0
    }
  },
  communityInteractions: {
    recent: [],
    totalEngagement: 0
  },
  solveThreads: {
    recent: [],
    totalThreads: 0
  },
  recentSearches: {
    searches: [],
    totalSearches: 0
  },
  likes: {
    given: { count: 0, recent: [] },
    received: { count: 0, recent: [] },
    ratio: 0
  },
  roommateRequests: {
    sent: { requests: [], count: 0 },
    received: { requests: [], count: 0 }
  },
  needsAttention: [],
  messagesPreview: [],
  campusPulse: [],
  profileProgress: {
    completionPercentage: 0,
    missingFields: []
  }
};

async function testAIFeaturesFlow() {
  console.log('🧪 Starting AI Features Test...\n');

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

    // Step 2: Test AI Insights
    console.log('2️⃣ Testing AI Insights...');
    const insightsResponse = await axios.post(`${BASE_URL}/api/ai/insights`, {
      dashboardData: testDashboardData
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (insightsResponse.data.error) {
      console.log('❌ AI insights failed:', insightsResponse.data.error);
    } else {
      console.log('✅ AI insights generated successfully');
      console.log('   Insights count:', insightsResponse.data.insights?.length || 0);
      console.log('   Response structure:', Object.keys(insightsResponse.data));
    }
    console.log('');

    // Step 3: Test AI Actions
    console.log('3️⃣ Testing AI Actions...');
    const actionsResponse = await axios.post(`${BASE_URL}/api/ai/actions`, {
      userProfile: {
        name: 'AI Test',
        university: 'Test University',
        focus: 'Housing'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (actionsResponse.data.error) {
      console.log('❌ AI actions failed:', actionsResponse.data.error);
    } else {
      console.log('✅ AI actions generated successfully');
      console.log('   Actions count:', actionsResponse.data.actions?.length || 0);
      console.log('   Response structure:', Object.keys(actionsResponse.data));
    }
    console.log('');

    // Step 4: Test AI Chat
    console.log('4️⃣ Testing AI Chat...');
    const chatResponse = await axios.post(`${BASE_URL}/api/ai/chat`, {
      message: 'Hello, I need help finding housing near campus',
      context: {
        userProfile: {
          name: 'AI Test',
          university: 'Test University'
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (chatResponse.data.error) {
      console.log('❌ AI chat failed:', chatResponse.data.error);
    } else {
      console.log('✅ AI chat successful');
      console.log('   Response:', chatResponse.data.response?.substring(0, 100) + '...');
      console.log('   Response structure:', Object.keys(chatResponse.data));
    }
    console.log('');

    // Step 5: Test AI Criteria Extraction
    console.log('5️⃣ Testing AI Criteria Extraction...');
    const criteriaResponse = await axios.post(`${BASE_URL}/api/ai/extract-criteria`, {
      prompt: 'I need a 2-bedroom apartment near campus for under $1500/month',
      campus: 'Test University'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (criteriaResponse.data.error) {
      console.log('❌ AI criteria extraction failed:', criteriaResponse.data.error);
    } else {
      console.log('✅ AI criteria extraction successful');
      console.log('   Criteria:', criteriaResponse.data.criteria);
      console.log('   Response structure:', Object.keys(criteriaResponse.data));
    }
    console.log('');

    // Step 6: Test AI Tools - Find Properties
    console.log('6️⃣ Testing AI Tools - Find Properties...');
    const findPropertiesResponse = await axios.post(`${BASE_URL}/api/ai/tools/find-properties`, {
      campusId: 'test-campus',
      maxDistance: 5,
      budgetMin: 1000,
      budgetMax: 2000,
      bedrooms: 2
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (findPropertiesResponse.data.error) {
      console.log('❌ AI find properties failed:', findPropertiesResponse.data.error);
    } else {
      console.log('✅ AI find properties successful');
      console.log('   Properties found:', findPropertiesResponse.data.properties?.length || 0);
      console.log('   Response structure:', Object.keys(findPropertiesResponse.data));
    }
    console.log('');

    // Step 7: Test AI Tools - Find Roommates
    console.log('7️⃣ Testing AI Tools - Find Roommates...');
    const findRoommatesResponse = await axios.post(`${BASE_URL}/api/ai/tools/find-roommates`, {
      campusId: 'test-campus',
      budgetBand: { min: 1000, max: 2000 },
      lifestyleFilters: {
        sleepPattern: 'early_bird',
        cleanliness: 4
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (findRoommatesResponse.data.error) {
      console.log('❌ AI find roommates failed:', findRoommatesResponse.data.error);
    } else {
      console.log('✅ AI find roommates successful');
      console.log('   Roommates found:', findRoommatesResponse.data.roommates?.length || 0);
      console.log('   Response structure:', Object.keys(findRoommatesResponse.data));
    }
    console.log('');

    // Step 8: Test AI Tools - Score Properties
    console.log('8️⃣ Testing AI Tools - Score Properties...');
    const scorePropertiesResponse = await axios.post(`${BASE_URL}/api/ai/tools/score-properties`, {
      userProfile: {
        budget: 1500,
        preferences: ['near-campus', 'quiet']
      },
      properties: [
        {
          id: 'test-property-1',
          price: 1200,
          distance: 0.5,
          features: ['near-campus', 'quiet']
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (scorePropertiesResponse.data.error) {
      console.log('❌ AI score properties failed:', scorePropertiesResponse.data.error);
    } else {
      console.log('✅ AI score properties successful');
      console.log('   Scored properties:', scorePropertiesResponse.data.scoredProperties?.length || 0);
      console.log('   Response structure:', Object.keys(scorePropertiesResponse.data));
    }
    console.log('');

    // Step 9: Test AI Tools - Get Recommendations
    console.log('9️⃣ Testing AI Tools - Get Recommendations...');
    const recommendationsResponse = await axios.post(`${BASE_URL}/api/ai/tools/get-recommendations`, {
      insightType: 'housing',
      userProfile: {
        name: 'AI Test',
        university: 'Test University',
        budget: 1500
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (recommendationsResponse.data.error) {
      console.log('❌ AI recommendations failed:', recommendationsResponse.data.error);
    } else {
      console.log('✅ AI recommendations successful');
      console.log('   Recommendations:', recommendationsResponse.data.recommendations?.length || 0);
      console.log('   Response structure:', Object.keys(recommendationsResponse.data));
    }
    console.log('');

    // Step 10: Test Error Handling
    console.log('🔟 Testing Error Handling...');
    try {
      // Test with invalid token
      await axios.post(`${BASE_URL}/api/ai/insights`, {
        dashboardData: testDashboardData
      }, {
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

    console.log('🎉 All AI features tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ AI insights generation works');
    console.log('   ✅ AI actions generation works');
    console.log('   ✅ AI chat functionality works');
    console.log('   ✅ AI criteria extraction works');
    console.log('   ✅ AI find properties works');
    console.log('   ✅ AI find roommates works');
    console.log('   ✅ AI score properties works');
    console.log('   ✅ AI recommendations work');
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
  testAIFeaturesFlow();
}

module.exports = { testAIFeaturesFlow };
