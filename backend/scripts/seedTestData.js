const mongoose = require('mongoose');
const User = require('../models/user.model');
const Property = require('../models/property.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newrun', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data for AI testing...');

    // Add test properties
    const testProperties = [
      {
        title: "Downtown Studio Apartment",
        price: 800,
        bedrooms: 1,
        bathrooms: 1,
        address: "123 Main St, DeKalb, IL",
        distanceFromUniversity: 0.5,
        furnished: true,
        availableFrom: new Date('2024-01-15'),
        availabilityStatus: 'available',
        campusId: "Northern Illinois University",
        contactInfo: {
          name: "John Smith",
          email: "john@example.com",
          phone: "555-0123"
        },
        images: ["https://example.com/image1.jpg"]
      },
      {
        title: "Campus View 2BR",
        price: 1200,
        bedrooms: 2,
        bathrooms: 1,
        address: "456 University Ave, DeKalb, IL",
        distanceFromUniversity: 1.2,
        furnished: false,
        availableFrom: new Date('2024-01-20'),
        availabilityStatus: 'available',
        campusId: "Northern Illinois University",
        contactInfo: {
          name: "Sarah Johnson",
          email: "sarah@example.com",
          phone: "555-0456"
        },
        images: ["https://example.com/image2.jpg"]
      },
      {
        title: "Student Housing Complex",
        price: 600,
        bedrooms: 1,
        bathrooms: 1,
        address: "789 College St, DeKalb, IL",
        distanceFromUniversity: 0.8,
        furnished: true,
        availableFrom: new Date('2024-01-10'),
        availabilityStatus: 'available',
        campusId: "Northern Illinois University",
        contactInfo: {
          name: "Mike Davis",
          email: "mike@example.com",
          phone: "555-0789"
        },
        images: ["https://example.com/image3.jpg"]
      }
    ];

    // Clear existing test properties
    await Property.deleteMany({ title: { $in: testProperties.map(p => p.title) } });
    
    // Insert test properties
    const insertedProperties = await Property.insertMany(testProperties);
    console.log(`✅ Added ${insertedProperties.length} test properties`);

    // Add test roommates (users with Synapse data)
    const testRoommates = [
      {
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah.chen@example.com",
        university: "Northern Illinois University",
        major: "Computer Science",
        onboardingData: {
          budgetRange: { min: 400, max: 600 }
        },
        synapse: {
          culture: {
            primaryLanguage: "English",
            otherLanguages: ["Mandarin"]
          },
          lifestyle: {
            sleepPattern: "early_bird",
            cleanliness: 4
          },
          habits: {
            smoking: false,
            partying: 2
          },
          dealbreakers: ["smoking", "loud_music"]
        }
      },
      {
        firstName: "Alex",
        lastName: "Johnson",
        email: "alex.johnson@example.com",
        university: "Northern Illinois University",
        major: "Business",
        onboardingData: {
          budgetRange: { min: 500, max: 700 }
        },
        synapse: {
          culture: {
            primaryLanguage: "English"
          },
          lifestyle: {
            sleepPattern: "night_owl",
            cleanliness: 3
          },
          habits: {
            smoking: false,
            partying: 3
          },
          dealbreakers: ["smoking"]
        }
      },
      {
        firstName: "Maria",
        lastName: "Garcia",
        email: "maria.garcia@example.com",
        university: "Northern Illinois University",
        major: "Engineering",
        onboardingData: {
          budgetRange: { min: 450, max: 650 }
        },
        synapse: {
          culture: {
            primaryLanguage: "Spanish",
            otherLanguages: ["English"]
          },
          lifestyle: {
            sleepPattern: "early_bird",
            cleanliness: 5
          },
          habits: {
            smoking: false,
            partying: 1
          },
          dealbreakers: ["smoking", "pets"]
        }
      }
    ];

    // Clear existing test users
    await User.deleteMany({ email: { $in: testRoommates.map(r => r.email) } });
    
    // Insert test roommates
    const insertedRoommates = await User.insertMany(testRoommates);
    console.log(`✅ Added ${insertedRoommates.length} test roommates`);

    console.log('🎉 Test data seeding completed!');
    console.log('\n📋 Test Data Summary:');
    console.log('🏠 Properties: 3 (Downtown Studio, Campus View 2BR, Student Housing)');
    console.log('👥 Roommates: 3 (Sarah Chen, Alex Johnson, Maria Garcia)');
    console.log('\n🧪 Now you can test the AI system with real data!');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedTestData();
