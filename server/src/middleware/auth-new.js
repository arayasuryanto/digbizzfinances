const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - require authentication with offline support
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token with longer expiration to prevent frequent logouts
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digbizz_finance_chat_jwt_secret_production');
      console.log('Auth middleware - decoded token:', decoded);
      
      try {
        // First try to find the user in MongoDB
        const user = await User.findById(decoded.id);
        
        if (user) {
          // Set user on request object if found in MongoDB
          req.user = {
            id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            hasSetupAccount: user.hasSetupAccount || false,
            business: user.business || null,
            balance: user.balance || 0
          };
          
          console.log('Auth middleware - authenticated MongoDB user:', user.name);
          return next();
        }
        
        // If user not found in MongoDB, check mock users
        if (global.mockUsers && global.mockUsers[decoded.id]) {
          const mockUser = global.mockUsers[decoded.id];
          req.user = {
            id: mockUser._id,
            name: mockUser.name,
            phone: mockUser.phone,
            email: mockUser.email,
            hasSetupAccount: mockUser.hasSetupAccount || false,
            business: mockUser.business || null,
            balance: mockUser.balance || 0
          };
          
          console.log('Auth middleware - authenticated mock user:', mockUser.name);
          return next();
        }
        
        // If not found in either place, return error
        console.log('Auth middleware - user not found for id:', decoded.id);
        return res.status(401).json({
          success: false,
          error: 'User no longer exists'
        });
        
      } catch (dbError) {
        // If MongoDB is unavailable, use mock users
        console.error('Database error in auth middleware:', dbError.message);
        
        // Check if the user exists in our mock registry
        if (global.mockUsers && global.mockUsers[decoded.id]) {
          const mockUser = global.mockUsers[decoded.id];
          req.user = {
            id: mockUser._id,
            name: mockUser.name || 'User',
            phone: mockUser.phone || 'unknown',
            email: mockUser.email,
            hasSetupAccount: mockUser.hasSetupAccount || false,
            business: mockUser.business || null,
            balance: mockUser.balance || 0
          };
          
          console.log('Auth middleware - authenticated mock user (DB error):', mockUser.name || 'User');
          return next();
        }
        
        // If not found in mock registry, create a temporary user with the ID from token
        console.log('Creating temporary user for ID:', decoded.id);
        req.user = {
          id: decoded.id,
          name: 'User',
          phone: 'unknown',
          hasSetupAccount: false,
          business: null,
          balance: 0
        };
        
        // Also add to mock users registry for future use
        global.mockUsers = global.mockUsers || {};
        global.mockUsers[decoded.id] = {
          _id: decoded.id,
          name: 'User',
          phone: 'unknown',
          hasSetupAccount: false,
          business: null,
          balance: 0,
          createdAt: new Date()
        };
        
        // Save to file for persistence
        try {
          const localStoragePersistence = require('../utils/localStoragePersistence');
          localStoragePersistence.saveData(localStoragePersistence.FILES.users, global.mockUsers);
        } catch (e) {
          console.error('Error saving mock user to file:', e);
        }
        
        return next();
      }
      
    } catch (error) {
      console.error('Auth middleware error - invalid token:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware server error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};