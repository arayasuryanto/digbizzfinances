/**
 * FIXED auth middleware with better error handling
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User-fixed');

exports.protect = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    
    // Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Found token in Authorization header');
    }
    
    // Check if token exists
    if (!token) {
      console.log('No token found');
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      console.log('Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecretkey123456789');
      console.log('Token valid, user ID:', decoded.id);
      
      // Get user from the database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('No user found with ID:', decoded.id);
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Set user on request
      req.user = {
        id: user._id,
        name: user.name
      };
      
      console.log('Authentication successful for user:', user.name);
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Uncaught error in auth middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};