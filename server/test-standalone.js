/**
 * Standalone test application for MongoDB
 */
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Load env vars
dotenv.config();

// Create express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('URI:', process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Define User model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  hasSetupAccount: {
    type: Boolean,
    default: false
  }
});

// Hash passwords
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('TestUser', UserSchema);

// Routes

// @route   GET /api/test
// @desc    Test route
// @access  Public
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// @route   POST /api/register
// @desc    Register a user
// @access  Public
app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    console.log('Registering user:', name, phone);
    
    // Check if user exists
    let user = await User.findOne({ phone });
    
    if (user) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    user = new User({
      name,
      phone,
      password
    });
    
    await user.save();
    console.log('User saved with ID:', user._id);
    
    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        hasSetupAccount: user.hasSetupAccount
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/login
// @desc    Login user
// @access  Public
app.post('/api/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    console.log('Login attempt for phone:', phone);
    
    // Find user
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('Login successful for user:', user.name);
    
    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        hasSetupAccount: user.hasSetupAccount
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (for testing)
// @access  Public
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users
// @desc    Delete all users (for testing)
// @access  Public
app.delete('/api/users', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'All users deleted' });
  } catch (error) {
    console.error('Delete users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start server
const PORT = 5678;
app.listen(PORT, () => console.log(`Standalone test server running on port ${PORT}`));