const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  updateDetails
} = require('../controllers/auth-new');

const { protect } = require('../middleware/auth-new');

const router = express.Router();

// Register a user
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

// Login user
router.post(
  '/login',
  [
    check('phone', 'Phone number is required').not().isEmpty(),
    check('password', 'Password is required').exists()
  ],
  login
);

// Get current logged in user
router.get('/me', protect, getMe);

// Logout user
router.post('/logout', protect, logout);

// Update user details
router.put(
  '/updatedetails',
  protect,
  [
    check('name', 'Name is required').not().isEmpty()
  ],
  updateDetails
);

module.exports = router;