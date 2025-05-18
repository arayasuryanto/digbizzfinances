/**
 * Strict auth middleware with no fallbacks
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User-strict');

exports.protect = async (req, res, next) => {
  let token;
  
  console.log('Auth middleware checking request...');
  
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in Authorization header');
  }
  
  // Make sure token exists
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', decoded.id);
    
    // Check if user exists in database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Set user on request object
    req.user = {
      id: user._id,
      name: user.name
    };
    
    console.log('Authentication successful for user:', user.name);
    next();
  } catch (error) {
    console.error('*** AUTH MIDDLEWARE ERROR ***', error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};