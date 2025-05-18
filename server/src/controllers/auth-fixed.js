/**
 * FIXED auth controller with manual password hashing and better error handling
 */
const User = require('../models/User-fixed');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

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
    console.log('Registering user with phone:', phone);
    
    // Check if user exists
    try {
      const existingUser = await User.findOne({ phone });
      
      if (existingUser) {
        console.log('User already exists with phone:', phone);
        return res.status(400).json({
          success: false,
          error: 'User already exists with this phone number'
        });
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during user lookup'
      });
    }
    
    // Hash the password
    console.log('Hashing password...');
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Error hashing password:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during password hashing'
      });
    }
    
    // Create user with manually hashed password
    console.log('Creating user in database...');
    let user;
    try {
      user = new User({
        name,
        phone,
        password: hashedPassword,
        hasSetupAccount: false
      });
      
      await user.save();
      console.log('User created successfully with ID:', user._id);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during user creation'
      });
    }
    
    // Generate token
    try {
      // Generate token using jwt directly
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'fallbacksecretkey123456789',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );
      
      console.log('Generated token for user');
      
      // Return success response
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          hasSetupAccount: user.hasSetupAccount || false,
          business: user.business || null,
          balance: user.balance || 0
        }
      });
    } catch (error) {
      console.error('Error generating token:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during token generation'
      });
    }
  } catch (error) {
    console.error('Uncaught error in register:', error);
    return res.status(500).json({
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
    console.log('Attempting login for phone:', phone);
    
    // Find user
    let user;
    try {
      user = await User.findOne({ phone }).select('+password');
      
      if (!user) {
        console.log('No user found with phone:', phone);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      console.log('Found user with ID:', user._id);
    } catch (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during user lookup'
      });
    }
    
    // Check password
    try {
      console.log('Verifying password...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('Password invalid');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      console.log('Password valid');
    } catch (error) {
      console.error('Error verifying password:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during password verification'
      });
    }
    
    // Generate token
    try {
      // Generate token using jwt directly
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'fallbacksecretkey123456789',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );
      
      console.log('Generated token for user');
      console.log('Login successful for user:', user.name);
      
      // Return success response
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          hasSetupAccount: user.hasSetupAccount || false,
          business: user.business || null,
          balance: user.balance || 0
        }
      });
    } catch (error) {
      console.error('Error generating token:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during token generation'
      });
    }
  } catch (error) {
    console.error('Uncaught error in login:', error);
    return res.status(500).json({
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
    console.error('Error in getMe:', error);
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
    console.error('Error in updateDetails:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};