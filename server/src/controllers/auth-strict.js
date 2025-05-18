/**
 * Strict auth controller with no fallbacks
 */
const User = require('../models/User-strict');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, password } = req.body;
    
    console.log('=== REGISTER ===');
    console.log('Attempting to register user:', phone);

    // Check if user exists
    const existingUser = await User.findOne({ phone });
    
    if (existingUser) {
      console.log('User already exists with phone:', phone);
      return res.status(400).json({
        success: false,
        error: 'User already exists with this phone number'
      });
    }

    // Create user document
    console.log('Creating new user...');
    
    const user = new User({
      name,
      phone,
      password,
      hasSetupAccount: false
    });
    
    // Save user to database
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
    
    // Send response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hasSetupAccount: false,
        business: null,
        balance: 0
      }
    });
  } catch (error) {
    console.error('*** REGISTER ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, password } = req.body;
    
    console.log('=== LOGIN ===');
    console.log('Attempting to login user with phone:', phone);
    
    // Find user with password
    const user = await User.findOne({ phone }).select('+password');
    
    if (!user) {
      console.log('No user found with phone:', phone);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('Password does not match for user:', phone);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
    
    console.log('Login successful for user:', user.name);
    
    // Send response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hasSetupAccount: user.hasSetupAccount || false,
        business: user.business || null,
        balance: user.balance || 0
      }
    });
  } catch (error) {
    console.error('*** LOGIN ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hasSetupAccount: user.hasSetupAccount || false,
        business: user.business || null,
        balance: user.balance || 0
      }
    });
  } catch (error) {
    console.error('*** GET ME ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

/**
 * @desc    Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name
    };
    
    if (req.body.email) {
      fieldsToUpdate.email = req.body.email;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hasSetupAccount: user.hasSetupAccount || false,
        business: user.business || null,
        balance: user.balance || 0
      }
    });
  } catch (error) {
    console.error('*** UPDATE DETAILS ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};