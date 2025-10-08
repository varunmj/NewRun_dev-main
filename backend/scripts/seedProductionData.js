const mongoose = require('mongoose');
const User = require('../models/user.model');
const Property = require('../models/property.model');
const config = require('../config.json');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to production database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function seedProductionData() {
  try {
    console.log('🌱 Seeding production data for AI insights...');

    // Clear existing test data
    await Property.deleteMany({ 
      title: { 
        $in: [
          "Sathya Keshav's Apt",
          "Stadium View II Apartment", 
          "Lincolnshire West",
          "Barsema Hall"
        ] 
      } 
    });
    console.log('🧹 Cleared existing test properties');

    // Add the exact properties that are working in local dev
    const productionProperties = [
      {
        title: "Sathya Keshav's Apt",
        price: 300,
        bedrooms: 4,
        bathrooms: 2.5,
        address: {
          street: "123 Campus Drive",
          city: "DeKalb",
          state: "IL",
          zipCode: "60115"
        },
        distanceFromUniversity: 1.6,
        availabilityStatus: 'available',
        contactInfo: {
          name: "Sathya Keshav",
          email: "sathya@example.com",
          phone: "555-0123"
        },
        images: ["https://newrun-property-images.s3.us-east-1.amazonaws.com/1758672500478-Stadium-View-II-Apts-6-scaled.jpg"],
        description: "Excellent value for money! Walking distance to campus! Perfect for sharing with roommates!",
        userId: "system-seed"
      },
      {
        title: "Stadium View II Apartment",
        price: 300,
        bedrooms: 4,
        bathrooms: 2,
        address: {
          street: "1315 W Lincoln Hwy",
          city: "DeKalb", 
          state: "IL",
          zipCode: "60115"
        },
        distanceFromUniversity: 4.4,
        availabilityStatus: 'available',
        contactInfo: {
          name: "Property Manager",
          email: "stadium@example.com",
          phone: "555-0456"
        },
        images: ["https://newrun-property-images.s3.us-east-1.amazonaws.com/1758672500478-Stadium-View-II-Apts-6-scaled.jpg"],
        description: "Another great option for sharing with roommates!",
        userId: "system-seed"
      },
      {
        title: "Lincolnshire West",
        price: 350,
        bedrooms: 2,
        bathrooms: 2,
        address: {
          street: "456 Lincolnshire Dr",
          city: "DeKalb",
          state: "IL", 
          zipCode: "60115"
        },
        distanceFromUniversity: 4.0,
        availabilityStatus: 'available',
        contactInfo: {
          name: "Lincolnshire Management",
          email: "lincolnshire@example.com",
          phone: "555-0789"
        },
        images: ["https://newrun-property-images.s3.us-east-1.amazonaws.com/1758672500478-Stadium-View-II-Apts-6-scaled.jpg"],
        description: "Cozy 2BHK apartment with great amenities!",
        userId: "system-seed"
      },
      {
        title: "Barsema Hall",
        price: 1000,
        bedrooms: 11,
        bathrooms: 11,
        address: {
          street: "789 University Ave",
          city: "DeKalb",
          state: "IL",
          zipCode: "60115"
        },
        distanceFromUniversity: 2.8,
        availabilityStatus: 'available',
        contactInfo: {
          name: "University Housing",
          email: "housing@niu.edu",
          phone: "555-0321"
        },
        images: ["https://newrun-property-images.s3.us-east-1.amazonaws.com/1758672500478-Stadium-View-II-Apts-6-scaled.jpg"],
        description: "Perfect for sharing with roommates!",
        userId: "system-seed"
      },
      {
        title: "Campus View 2BR",
        price: 600,
        bedrooms: 2,
        bathrooms: 1,
        address: {
          street: "321 University St",
          city: "DeKalb",
          state: "IL",
          zipCode: "60115"
        },
        distanceFromUniversity: 0.8,
        availabilityStatus: 'available',
        contactInfo: {
          name: "Campus Properties",
          email: "campus@example.com",
          phone: "555-0654"
        },
        images: ["https://newrun-property-images.s3.us-east-1.amazonaws.com/1758672500478-Stadium-View-II-Apts-6-scaled.jpg"],
        description: "Great location near campus!",
        userId: "system-seed"
      }
    ];

    // Insert production properties
    const insertedProperties = await Property.insertMany(productionProperties);
    console.log(`✅ Added ${insertedProperties.length} production properties`);

    // Add test roommates for AI recommendations
    const testRoommates = [
      {
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah.chen@example.com",
        password: "hashedpassword123",
        university: "Northern Illinois University",
        major: "Computer Science",
        onboardingData: {
          budgetRange: { min: 300, max: 500 },
          roommateInterest: true,
          focus: "Housing"
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
        password: "hashedpassword123",
        university: "Northern Illinois University",
        major: "Business",
        onboardingData: {
          budgetRange: { min: 300, max: 600 },
          roommateInterest: true,
          focus: "Housing"
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
      }
    ];

    // Clear existing test users
    await User.deleteMany({ email: { $in: testRoommates.map(r => r.email) } });
    
    // Insert test roommates
    const insertedRoommates = await User.insertMany(testRoommates);
    console.log(`✅ Added ${insertedRoommates.length} test roommates`);

    console.log('🎉 Production data seeding completed!');
    console.log('\n📋 Production Data Summary:');
    console.log('🏠 Properties: 5 (Sathya Keshav, Stadium View II, Lincolnshire West, Barsema Hall, Campus View)');
    console.log('👥 Roommates: 2 (Sarah Chen, Alex Johnson)');
    console.log('\n🚀 Production AI insights should now work with real data!');

  } catch (error) {
    console.error('❌ Error seeding production data:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
connectDB().then(() => seedProductionData());
