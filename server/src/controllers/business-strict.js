/**
 * Strict business controller
 */
const User = require('../models/User-strict');
const { validationResult } = require('express-validator');

/**
 * @desc    Setup business profile
 * @route   PUT /api/business/setup
 * @access  Private
 */
exports.setupBusiness = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, name, businessOwner, transactionCategories } = req.body;
    
    console.log('=== SETUP BUSINESS ===');
    console.log('Setting up business for user:', req.user.id);
    console.log('Business type:', type);

    // Find user in database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update business info
    user.business = {
      type,
      name: name || '',
      businessOwner: businessOwner || '',
      transactionCategories: transactionCategories || {
        income: [],
        expense: []
      }
    };
    
    // Mark account as setup
    user.hasSetupAccount = true;
    
    // Save changes
    await user.save();
    console.log('Business setup complete for user:', user.name);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          hasSetupAccount: user.hasSetupAccount,
          business: user.business
        }
      }
    });
  } catch (error) {
    console.error('*** SETUP BUSINESS ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error during business setup'
    });
  }
};

/**
 * @desc    Update business profile
 * @route   PUT /api/business
 * @access  Private
 */
exports.updateBusiness = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, name, businessOwner, transactionCategories } = req.body;
    
    console.log('=== UPDATE BUSINESS ===');
    console.log('Updating business for user:', req.user.id);

    // Find user in database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Create or update business object
    if (!user.business) {
      user.business = {};
    }
    
    // Update fields if provided
    if (type) user.business.type = type;
    if (name) user.business.name = name;
    if (businessOwner) user.business.businessOwner = businessOwner;
    if (transactionCategories) user.business.transactionCategories = transactionCategories;
    
    // Save changes
    await user.save();
    console.log('Business updated for user:', user.name);
    
    res.status(200).json({
      success: true,
      data: user.business
    });
  } catch (error) {
    console.error('*** UPDATE BUSINESS ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error during business update'
    });
  }
};

/**
 * @desc    Get business profile
 * @route   GET /api/business
 * @access  Private
 */
exports.getBusiness = async (req, res) => {
  try {
    console.log('=== GET BUSINESS ===');
    console.log('Getting business for user:', req.user.id);

    // Find user in database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.business || null,
      hasSetupAccount: user.hasSetupAccount || false
    });
  } catch (error) {
    console.error('*** GET BUSINESS ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};