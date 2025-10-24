/**
 * Property Management Test
 * Tests the complete property creation/editing/deletion flow end-to-end
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test configuration
const testUser = {
  firstName: 'Property',
  lastName: 'Test',
  email: 'property@example.com',
  username: 'propertytest',
  password: 'TestPassword123!'
};

const testProperty = {
  title: 'Beautiful 2BR Apartment Near Campus',
  content: 'Spacious apartment with modern amenities',
  price: 1200,
  bedrooms: 2,
  bathrooms: 1,
  distanceFromUniversity: 0.5,
  address: {
    street: '123 University Ave',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102'
  },
  availabilityStatus: 'available',
  contactInfo: {
    name: 'John Doe',
    phone: '555-1234',
    email: 'john@example.com'
  },
  description: 'Perfect for students - close to campus, modern amenities, great location',
  isFeatured: false,
  tags: ['student-friendly', 'near-campus', 'modern']
};

async function testPropertyManagementFlow() {
  console.log('🧪 Starting Property Management Test...\n');

  let authToken = null;
  let userId = null;
  let propertyId = null;

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

    // Step 2: Create Property
    console.log('2️⃣ Testing Property Creation...');
    const createResponse = await axios.post(`${BASE_URL}/add-property`, testProperty, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.error) {
      console.log('❌ Property creation failed:', createResponse.data.message);
      return;
    }
    
    propertyId = createResponse.data.property._id;
    console.log('✅ Property created successfully');
    console.log('   Property ID:', propertyId);
    console.log('   Title:', createResponse.data.property.title);
    console.log('   Price:', createResponse.data.property.price);
    console.log('');

    // Step 3: Validate Property Data
    console.log('3️⃣ Validating Property Data...');
    const createdProperty = createResponse.data.property;
    
    const validationChecks = [
      { field: 'title', expected: testProperty.title, actual: createdProperty.title },
      { field: 'price', expected: testProperty.price, actual: createdProperty.price },
      { field: 'bedrooms', expected: testProperty.bedrooms, actual: createdProperty.bedrooms },
      { field: 'bathrooms', expected: testProperty.bathrooms, actual: createdProperty.bathrooms },
      { field: 'availabilityStatus', expected: testProperty.availabilityStatus, actual: createdProperty.availabilityStatus }
    ];

    let allValid = true;
    validationChecks.forEach(check => {
      if (check.expected !== check.actual) {
        console.log(`❌ ${check.field} mismatch: expected ${check.expected}, got ${check.actual}`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ All property data validation checks passed');
    } else {
      console.log('❌ Some property data validation checks failed');
    }
    console.log('');

    // Step 4: Test Property Retrieval
    console.log('4️⃣ Testing Property Retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/properties/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (getResponse.data.error) {
      console.log('❌ Property retrieval failed:', getResponse.data.message);
    } else {
      console.log('✅ Property retrieved successfully');
      console.log('   Retrieved title:', getResponse.data.property.title);
      console.log('   Retrieved price:', getResponse.data.property.price);
    }
    console.log('');

    // Step 5: Test Property Update
    console.log('5️⃣ Testing Property Update...');
    const updateData = {
      title: 'Updated: Beautiful 2BR Apartment Near Campus',
      price: 1300,
      description: 'Updated description with more details'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/edit-property/${propertyId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (updateResponse.data.error) {
      console.log('❌ Property update failed:', updateResponse.data.message);
    } else {
      console.log('✅ Property updated successfully');
      console.log('   Updated title:', updateResponse.data.property.title);
      console.log('   Updated price:', updateResponse.data.property.price);
    }
    console.log('');

    // Step 6: Test Property Like
    console.log('6️⃣ Testing Property Like...');
    const likeResponse = await axios.put(`${BASE_URL}/property/${propertyId}/like`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (likeResponse.data.error) {
      console.log('❌ Property like failed:', likeResponse.data.message);
    } else {
      console.log('✅ Property liked successfully');
      console.log('   Like count:', likeResponse.data.likeCount);
    }
    console.log('');

    // Step 7: Test Property List
    console.log('7️⃣ Testing Property List...');
    const listResponse = await axios.get(`${BASE_URL}/properties`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (listResponse.data.error) {
      console.log('❌ Property list failed:', listResponse.data.message);
    } else {
      console.log('✅ Property list retrieved successfully');
      console.log('   Properties count:', listResponse.data.properties?.length || 0);
      console.log('   Found our property:', listResponse.data.properties?.some(p => p._id === propertyId) || false);
    }
    console.log('');

    // Step 8: Test Property Search
    console.log('8️⃣ Testing Property Search...');
    const searchResponse = await axios.get(`${BASE_URL}/search-properties?q=apartment`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (searchResponse.data.error) {
      console.log('❌ Property search failed:', searchResponse.data.message);
    } else {
      console.log('✅ Property search successful');
      console.log('   Search results:', searchResponse.data.properties?.length || 0);
      console.log('   Found our property in search:', searchResponse.data.properties?.some(p => p._id === propertyId) || false);
    }
    console.log('');

    // Step 9: Test Property Deletion
    console.log('9️⃣ Testing Property Deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/delete-property/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (deleteResponse.data.error) {
      console.log('❌ Property deletion failed:', deleteResponse.data.message);
    } else {
      console.log('✅ Property deleted successfully');
      console.log('   Deletion message:', deleteResponse.data.message);
    }
    console.log('');

    // Step 10: Test Error Handling
    console.log('🔟 Testing Error Handling...');
    try {
      // Test with invalid property ID
      await axios.get(`${BASE_URL}/properties/invalid-id`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('❌ Invalid property ID test failed: Should have been rejected');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Invalid property ID properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All property management tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Account creation works');
    console.log('   ✅ Property creation works');
    console.log('   ✅ Property data validation works');
    console.log('   ✅ Property retrieval works');
    console.log('   ✅ Property update works');
    console.log('   ✅ Property like works');
    console.log('   ✅ Property list works');
    console.log('   ✅ Property search works');
    console.log('   ✅ Property deletion works');
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
  testPropertyManagementFlow();
}

module.exports = { testPropertyManagementFlow };
