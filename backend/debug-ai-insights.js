// Debug script to test AI insights in production
require('dotenv').config();
const axios = require('axios');

async function testAIInsights() {
  console.log('🧪 Testing AI Insights in Production...');
  
  // Test 1: Check if OpenAI API key is working
  console.log('\n1️⃣ Testing OpenAI API Key...');
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello, test message" }],
      max_tokens: 10
    }, {
      headers: {
        Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ OpenAI API Key is working');
  } catch (error) {
    console.log('❌ OpenAI API Key failed:', error.response?.data || error.message);
    return;
  }

  // Test 2: Check if AI insights endpoint is accessible
  console.log('\n2️⃣ Testing AI Insights Endpoint...');
  try {
    const insightsResponse = await axios.post('https://api.newrun.club/api/ai/insights', {
      dashboardData: {}
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE', // You'll need to replace this
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ AI Insights endpoint is working');
    console.log('Response:', insightsResponse.data);
  } catch (error) {
    console.log('❌ AI Insights endpoint failed:', error.response?.data || error.message);
  }

  // Test 3: Check if tool endpoints are working
  console.log('\n3️⃣ Testing Tool Endpoints...');
  try {
    const toolResponse = await axios.post('https://api.newrun.club/api/ai/tools/find-properties', {
      campusId: "Northern Illinois University",
      budgetMin: 300,
      budgetMax: 1000
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE', // You'll need to replace this
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Tool endpoints are working');
    console.log('Properties found:', toolResponse.data.properties?.length || 0);
  } catch (error) {
    console.log('❌ Tool endpoints failed:', error.response?.data || error.message);
  }

  console.log('\n🏁 Debug complete!');
}

testAIInsights().catch(console.error);

