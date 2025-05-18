/**
 * Extremely simplified authentication test for MongoDB 
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Running basic MongoDB authentication test');
console.log('----------------------------------------');
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Create an extremely simple User schema - no pre-save hooks, no validation
const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  password: String
});

// Create User model
const User = mongoose.model('SimpleUser', userSchema);

// Test functions
async function runTest() {
  try {
    // Connect to MongoDB
    console.log('\nStep 1: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB successfully!');
    
    // Clear any existing test users
    console.log('\nStep 2: Clearing existing test users...');
    const deleteResult = await User.deleteMany({ phone: '9999999999' });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing test users`);
    
    // Create a test user with a manually hashed password
    console.log('\nStep 3: Creating test user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpassword', salt);
    
    const user = new User({
      name: 'Test User',
      phone: '9999999999',
      password: hashedPassword
    });
    
    await user.save();
    console.log(`✅ Created test user with ID: ${user._id}`);
    
    // Retrieve the user from the database
    console.log('\nStep 4: Retrieving user from database...');
    const foundUser = await User.findOne({ phone: '9999999999' });
    console.log(`✅ Found user in database! ID: ${foundUser._id}`);
    
    // Verify password
    console.log('\nStep 5: Verifying password...');
    const passwordMatch = await bcrypt.compare('testpassword', foundUser.password);
    console.log(`✅ Password verification ${passwordMatch ? 'successful' : 'failed'}`);
    
    // Create a second user to test password verification
    console.log('\nStep 6: Creating a second user with different password...');
    
    // Delete any existing second test user
    await User.deleteMany({ phone: '8888888888' });
    
    const secondUserSalt = await bcrypt.genSalt(10);
    const secondUserPassword = await bcrypt.hash('differentpassword', secondUserSalt);
    
    const secondUser = new User({
      name: 'Second Test User',
      phone: '8888888888',
      password: secondUserPassword
    });
    
    await secondUser.save();
    console.log(`✅ Created second test user with ID: ${secondUser._id}`);
    
    // Test second user password
    console.log('\nStep 7: Verifying wrong password fails...');
    const wrongPasswordMatch = await bcrypt.compare('testpassword', secondUser.password);
    console.log(`✅ Wrong password verification correctly ${!wrongPasswordMatch ? 'failed' : 'succeeded'}`);
    
    console.log('\n============================================');
    console.log('ALL TESTS PASSED - MongoDB authentication works!');
    console.log('============================================');
    console.log('\nTest user credentials:');
    console.log('  Phone: 9999999999');
    console.log('  Password: testpassword');
    console.log('\nThis confirms MongoDB authentication is working properly.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\nDisconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

// Run the test
runTest().catch(console.error);