/**
 * Remove Fake Listings Script
 * This will remove the specific fake properties shown in the image
 */

const mongoose = require('mongoose');
const Property = require('./backend/models/property.model');

async function connectDB() {
  try {
    // Use the same connection string as your app
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://newrun:newrun123@cluster0.8qjqj.mongodb.net/newrun?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('🔌 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function removeFakeListings() {
  try {
    console.log('🧹 Removing fake listings from database...');
    
    // Remove the specific fake properties shown in the image
    const fakePropertyTitles = [
      'Campus View 2BR',
      'Barsema Hall', 
      'Lincolnshire West',
      'Stadium View II Apartment'
    ];
    
    const deletedProperties = await Property.deleteMany({
      title: { $in: fakePropertyTitles }
    });
    
    console.log(`✅ Removed ${deletedProperties.deletedCount} fake properties`);
    
    // Also remove any properties with fake contact info
    const deletedFakeContacts = await Property.deleteMany({
      $or: [
        { 'contactInfo.email': { $regex: /@example\.com$/ } },
        { 'contactInfo.name': { $in: ['Sathya Keshav', 'Property Manager', 'Test Landlord'] } }
      ]
    });
    
    console.log(`✅ Removed ${deletedFakeContacts.deletedCount} properties with fake contact info`);
    
    // Remove properties with system-seed userId
    const deletedSystemProperties = await Property.deleteMany({
      userId: 'system-seed'
    });
    
    console.log(`✅ Removed ${deletedSystemProperties.deletedCount} system-seeded properties`);
    
    const totalRemoved = deletedProperties.deletedCount + deletedFakeContacts.deletedCount + deletedSystemProperties.deletedCount;
    
    console.log('🎉 Fake listings cleanup completed!');
    console.log(`📊 Total fake properties removed: ${totalRemoved}`);
    console.log('✅ Your housing page will now only show real properties!');

  } catch (error) {
    console.error('❌ Error removing fake listings:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
connectDB().then(() => removeFakeListings());

