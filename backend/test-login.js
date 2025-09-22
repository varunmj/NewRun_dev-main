const mongoose = require('mongoose');
const config = require('./config.json');

// Connect to database
mongoose.connect(config.connectionString);

// Import User model
const User = require('./models/user.model');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Find user by email
    const user = await User.findOne({ email: 'varunmj1994@gmail.com' });
    
    if (user) {
      console.log('User found:', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordType: user.password ? (user.password.startsWith('$2') ? 'hashed' : 'plain') : 'none',
        passwordLength: user.password ? user.password.length : 0
      });
    } else {
      console.log('No user found with email: varunmj1994@gmail.com');
      
      // List all users
      const allUsers = await User.find({}, 'email firstName lastName');
      console.log('All users in database:', allUsers);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testLogin();
