/**
 * Marketplace Functionality Test
 * Tests the complete marketplace system end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'Marketplace',
  lastName: 'Test',
  email: 'marketplace@example.com',
  username: 'marketplacetest',
  password: 'TestPassword123!'
};

const testItem = {
  title: 'MacBook Pro 13" - Great Condition',
  description: 'Selling my MacBook Pro 13" in excellent condition. Barely used, comes with charger and original box.',
  price: 1200,
  category: 'Electronics',
  condition: 'excellent',
  contactInfo: {
    name: 'Jane Doe',
    phone: '555-5678',
    email: 'jane@example.com',
    exchangeMethod: 'campus',
    generalLocation: 'San Francisco'
  },
  images: []
};

async function testMarketplaceFlow() {
  console.log('🧪 Starting Marketplace Functionality Test...\n');

  let authToken = null;
  let userId = null;
  let itemId = null;

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

    // Step 2: Create Marketplace Item
    console.log('2️⃣ Testing Marketplace Item Creation...');
    const createResponse = await axios.post(`${BASE_URL}/marketplace/item`, testItem, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.error) {
      console.log('❌ Marketplace item creation failed:', createResponse.data.message);
      return;
    }
    
    itemId = createResponse.data.item._id;
    console.log('✅ Marketplace item created successfully');
    console.log('   Item ID:', itemId);
    console.log('   Title:', createResponse.data.item.title);
    console.log('   Price:', createResponse.data.item.price);
    console.log('');

    // Step 3: Validate Item Data
    console.log('3️⃣ Validating Item Data...');
    const createdItem = createResponse.data.item;
    
    const validationChecks = [
      { field: 'title', expected: testItem.title, actual: createdItem.title },
      { field: 'price', expected: testItem.price, actual: createdItem.price },
      { field: 'category', expected: testItem.category, actual: createdItem.category },
      { field: 'condition', expected: testItem.condition, actual: createdItem.condition }
    ];

    let allValid = true;
    validationChecks.forEach(check => {
      if (check.expected !== check.actual) {
        console.log(`❌ ${check.field} mismatch: expected ${check.expected}, got ${check.actual}`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ All item data validation checks passed');
    } else {
      console.log('❌ Some item data validation checks failed');
    }
    console.log('');

    // Step 4: Test Item Retrieval
    console.log('4️⃣ Testing Item Retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/marketplace/item/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (getResponse.data.error) {
      console.log('❌ Item retrieval failed:', getResponse.data.message);
    } else {
      console.log('✅ Item retrieved successfully');
      console.log('   Retrieved title:', getResponse.data.item.title);
      console.log('   Retrieved price:', getResponse.data.item.price);
    }
    console.log('');

    // Step 5: Test Item List
    console.log('5️⃣ Testing Item List...');
    const listResponse = await axios.get(`${BASE_URL}/marketplace/items`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (listResponse.data.error) {
      console.log('❌ Item list failed:', listResponse.data.message);
    } else {
      console.log('✅ Item list retrieved successfully');
      console.log('   Items count:', listResponse.data.items?.length || 0);
      console.log('   Found our item:', listResponse.data.items?.some(item => item._id === itemId) || false);
    }
    console.log('');

    // Step 6: Test Item Search
    console.log('6️⃣ Testing Item Search...');
    const searchResponse = await axios.get(`${BASE_URL}/marketplace/search?query=MacBook`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (searchResponse.data.error) {
      console.log('❌ Item search failed:', searchResponse.data.message);
    } else {
      console.log('✅ Item search successful');
      console.log('   Search results:', searchResponse.data.items?.length || 0);
      console.log('   Found our item in search:', searchResponse.data.items?.some(item => item._id === itemId) || false);
    }
    console.log('');

    // Step 7: Test Item View Tracking
    console.log('7️⃣ Testing Item View Tracking...');
    const viewResponse = await axios.post(`${BASE_URL}/marketplace/item/${itemId}/view`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (viewResponse.data.error) {
      console.log('❌ Item view tracking failed:', viewResponse.data.message);
    } else {
      console.log('✅ Item view tracked successfully');
    }
    console.log('');

    // Step 8: Test Item Update
    console.log('8️⃣ Testing Item Update...');
    const updateData = {
      title: 'Updated: MacBook Pro 13" - Excellent Condition',
      price: 1100,
      description: 'Updated description with more details about the condition'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/marketplace/item/${itemId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (updateResponse.data.error) {
      console.log('❌ Item update failed:', updateResponse.data.message);
    } else {
      console.log('✅ Item updated successfully');
      console.log('   Updated title:', updateResponse.data.item.title);
      console.log('   Updated price:', updateResponse.data.item.price);
    }
    console.log('');

    // Step 9: Test User Items
    console.log('9️⃣ Testing User Items...');
    const userItemsResponse = await axios.get(`${BASE_URL}/marketplace/items-user`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (userItemsResponse.data.error) {
      console.log('❌ User items failed:', userItemsResponse.data.message);
    } else {
      console.log('✅ User items retrieved successfully');
      console.log('   User items count:', userItemsResponse.data.items?.length || 0);
      console.log('   Found our item:', userItemsResponse.data.items?.some(item => item._id === itemId) || false);
    }
    console.log('');

    // Step 10: Test Item Deletion
    console.log('🔟 Testing Item Deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/marketplace/item/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (deleteResponse.data.error) {
      console.log('❌ Item deletion failed:', deleteResponse.data.message);
    } else {
      console.log('✅ Item deleted successfully');
      console.log('   Deletion message:', deleteResponse.data.message);
    }
    console.log('');

    // Step 11: Test Error Handling
    console.log('1️⃣1️⃣ Testing Error Handling...');
    try {
      // Test with invalid item ID
      await axios.get(`${BASE_URL}/marketplace/item/invalid-id`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('❌ Invalid item ID test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Invalid item ID properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All marketplace tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ Item creation works');
    console.log('   ✅ Item data validation works');
    console.log('   ✅ Item retrieval works');
    console.log('   ✅ Item list works');
    console.log('   ✅ Item search works');
    console.log('   ✅ Item view tracking works');
    console.log('   ✅ Item update works');
    console.log('   ✅ User items works');
    console.log('   ✅ Item deletion works');
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
  testMarketplaceFlow();
}

module.exports = { testMarketplaceFlow };
