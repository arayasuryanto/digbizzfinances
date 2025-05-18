/**
 * Direct database test file
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  hasSetupAccount: {
    type: Boolean,
    default: false
  },
  business: {
    type: {
      type: String,
      enum: ['personal', 'food', 'service', 'product', null],
      default: null
    },
    name: String
  }
});

// Password encryption middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create model
const User = mongoose.model('TestUser', UserSchema);

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Clear any existing test users
    const deleteResult = await User.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing test users`);
    
    // Create a test user
    console.log('Creating test user...');
    const testUser = await User.create({
      name: 'Test User',
      phone: '123-456-7890',
      password: 'password123',
      hasSetupAccount: true,
      business: {
        type: 'personal',
        name: 'Personal Account'
      }
    });
    
    console.log('Test user created:', testUser);
    
    // Find the user we just created
    console.log('Retrieving user by phone number...');
    const foundUser = await User.findOne({ phone: '123-456-7890' }).select('+password');
    console.log('Found user:', foundUser ? 'Yes' : 'No');
    
    if (foundUser) {
      console.log('User details:', {
        id: foundUser._id,
        name: foundUser.name,
        phone: foundUser.phone,
        hasPassword: !!foundUser.password,
        hasSetupAccount: foundUser.hasSetupAccount,
        business: foundUser.business
      });
    }
    
    console.log('\n✅ Database test completed successfully! Your MongoDB connection is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
runTest();