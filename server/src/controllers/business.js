const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Setup business profile
// @route   PUT /api/business/setup
// @access  Private
exports.setupBusiness = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, name, businessOwner, transactionCategories } = req.body;

    const businessData = {
      'business.type': type,
      'business.name': name || '',
      'business.businessOwner': businessOwner || '',
      hasSetupAccount: true
    };

    if (transactionCategories) {
      businessData['business.transactionCategories'] = transactionCategories;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      businessData,
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
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update business profile
// @route   PUT /api/business
// @access  Private
exports.updateBusiness = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Build update object
    const updateFields = {};
    
    if (req.body.type) updateFields['business.type'] = req.body.type;
    if (req.body.name) updateFields['business.name'] = req.body.name;
    if (req.body.businessOwner) updateFields['business.businessOwner'] = req.body.businessOwner;
    if (req.body.transactionCategories) {
      updateFields['business.transactionCategories'] = req.body.transactionCategories;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
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
      data: user.business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get business profile
// @route   GET /api/business
// @access  Private
exports.getBusiness = async (req, res) => {
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
      data: user.business,
      hasSetupAccount: user.hasSetupAccount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};