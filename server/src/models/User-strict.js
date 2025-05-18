/**
 * Strict User model with proper validation
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Define the schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    trim: true,
    sparse: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  hasSetupAccount: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  },
  business: {
    type: {
      type: String,
      enum: ['personal', 'food', 'service', 'product', null],
      default: null
    },
    name: {
      type: String,
      default: ''
    },
    businessOwner: {
      type: String,
      default: ''
    },
    transactionCategories: {
      income: [String],
      expense: [String]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  console.log('Pre-save hook running for user:', this.phone);
  
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    console.log('Hashing password');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Create the model
const User = mongoose.model('User', UserSchema);

// Clear all existing users for testing (REMOVE THIS IN PRODUCTION)
const clearAllUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('Cleared all users from database');
  } catch (error) {
    console.error('Failed to clear users:', error);
  }
};

module.exports = User;
module.exports.clearAllUsers = clearAllUsers;