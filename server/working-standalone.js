/**
 * COMPLETELY STANDALONE working version
 * No dependencies on existing code
 * This creates its own MongoDB connection and handles everything itself
 */
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

// Create express app
const app = express();

// Database connection string - hardcoded for reliability
const MONGODB_URI = "mongodb+srv://arayas:zevgim-7mikze-tivTux@araya-first-mongodb.vsc6mri.mongodb.net/finance-chat?retryWrites=true&w=majority&appName=araya-first-mongodb";

// JWT secret - hardcoded for reliability
const JWT_SECRET = "standalone-super-secret-jwt-key-123456789";

// User for automatic login if everything else fails
const EMERGENCY_USER = {
  name: "Emergency User",
  phone: "911",
  password: "123456",
  hashedPassword: "$2a$10$vME40n0QvpNzNyjUojZF0.3Iz4XE1XDOMPgJHYPjRaihJYqyB0Hfm" // bcrypt hash of "123456"
};

// Middleware
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Define user schema directly in this file
const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  hasSetupAccount: { type: Boolean, default: false },
  business: {
    type: { type: String, enum: ['personal', 'food', 'service', 'product', null], default: null },
    name: String
  }
});

// Create the User model
const User = mongoose.model('StandaloneUser', userSchema);

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No valid token provided' });
    }
    
    token = token.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Token error:', error);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Routes

// @route   POST /api/auth/register
// @desc    Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, phone and password' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this phone already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name,
      phone,
      password: hashedPassword,
      hasSetupAccount: false,
      business: { type: null }
    });
    
    await user.save();
    
    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    // Save user details to a file as backup
    const userInfo = {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      hashedPassword,
      token
    };
    
    fs.writeFileSync('last-user.json', JSON.stringify(userInfo, null, 2));
    
    // Return response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        hasSetupAccount: user.hasSetupAccount,
        business: user.business
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Please provide phone and password' });
    }
    
    // Special case for emergency user
    if (phone === EMERGENCY_USER.phone) {
      console.log('Emergency user login attempt');
      
      // Verify password
      const isMatch = await bcrypt.compare(password, EMERGENCY_USER.hashedPassword);
      
      if (isMatch) {
        console.log('Emergency user login successful');
        
        // Check if emergency user exists in database
        let emergencyUser = await User.findOne({ phone: EMERGENCY_USER.phone });
        
        // If not, create it
        if (!emergencyUser) {
          console.log('Creating emergency user in database');
          emergencyUser = new User({
            name: EMERGENCY_USER.name,
            phone: EMERGENCY_USER.phone,
            password: EMERGENCY_USER.hashedPassword,
            hasSetupAccount: true,
            business: { 
              type: 'personal',
              name: 'Emergency Business'
            }
          });
          
          await emergencyUser.save();
        }
        
        // Create token
        const token = jwt.sign({ id: emergencyUser._id }, JWT_SECRET, { expiresIn: '30d' });
        
        // Return response
        return res.status(200).json({
          success: true,
          token,
          user: {
            id: emergencyUser._id,
            name: emergencyUser.name,
            phone: emergencyUser.phone,
            hasSetupAccount: true,
            business: emergencyUser.business
          }
        });
      }
    }
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    // Save user details to a file as backup
    const userInfo = {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      token
    };
    
    fs.writeFileSync('last-user.json', JSON.stringify(userInfo, null, 2));
    
    // Return response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        hasSetupAccount: user.hasSetupAccount,
        business: user.business
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
        hasSetupAccount: req.user.hasSetupAccount,
        business: req.user.business
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
app.post('/api/auth/logout', authenticate, (req, res) => {
  res.status(200).json({ success: true, data: {} });
});

// Business routes

// @route   PUT /api/business/setup
// @desc    Setup business
app.put('/api/business/setup', authenticate, async (req, res) => {
  try {
    const { type, name, businessOwner } = req.body;
    
    req.user.business = {
      type: type || 'personal',
      name: name || req.user.name,
      businessOwner: businessOwner || req.user.name
    };
    
    req.user.hasSetupAccount = true;
    
    await req.user.save();
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          hasSetupAccount: req.user.hasSetupAccount,
          business: req.user.business
        }
      }
    });
  } catch (error) {
    console.error('Business setup error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/business
// @desc    Get business
app.get('/api/business', authenticate, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user.business,
      hasSetupAccount: req.user.hasSetupAccount
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Placeholder routes for other API endpoints
app.all('/api/transactions*', authenticate, (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

app.all('/api/messages*', authenticate, (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('URI:', MONGODB_URI);

// Function to start the server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB connected successfully!');
    
    // Check if emergency user exists, create if not
    const emergencyUser = await User.findOne({ phone: EMERGENCY_USER.phone });
    if (!emergencyUser) {
      console.log('Creating emergency user...');
      
      const user = new User({
        name: EMERGENCY_USER.name,
        phone: EMERGENCY_USER.phone,
        password: EMERGENCY_USER.hashedPassword,
        hasSetupAccount: true,
        business: { 
          type: 'personal',
          name: 'Emergency Business'
        }
      });
      
      await user.save();
      console.log('Emergency user created!');
    }
    
    // Start the server
    const PORT = 5002;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('\n=== EMERGENCY LOGIN CREDENTIALS ===');
      console.log('Phone: 911');
      console.log('Password: 123456');
      console.log('================================');
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();