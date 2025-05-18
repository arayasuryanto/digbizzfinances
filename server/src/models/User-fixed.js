/**
 * FIXED User model with proper password handling
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create user schema
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
    select: false
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
  }
}, {
  timestamps: true
});

// Password encryption is DISABLED to start with - we'll manually hash passwords
// in the controllers to ensure it works properly

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'fallbacksecretkey123456789',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Create the model
module.exports = mongoose.model('User', UserSchema);