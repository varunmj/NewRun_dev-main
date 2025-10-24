const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config.json');

// Connect to database
mongoose.connect(config.connectionString);

// Import User model
const User = require('./models/user.model');

async function resetPassword() {
  try {
    console.log('Resetting password for varunmj1994@gmail.com...');
    
    // Find user by email
    const user = await User.findOne({ email: 'varunmj1994@gmail.com' });
    
    if (user) {
      // Set new password
      const newPassword = 'password123'; // You can change this
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update user password
      await User.findByIdAndUpdate(userId, { password: hashedPassword });
      
      console.log('Password reset successful!');
      console.log('New password:', newPassword);
      console.log('You can now login with:');
      console.log('Email: varunmj1994@gmail.com');
      console.log('Password:', newPassword);
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

resetPassword();
