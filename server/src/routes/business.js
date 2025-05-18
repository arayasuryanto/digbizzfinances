const express = require('express');
const { check } = require('express-validator');
const {
  setupBusiness,
  updateBusiness,
  getBusiness
} = require('../controllers/business');

const { protect } = require('../middleware/auth-new');

const router = express.Router();

// All routes are protected
router.use(protect);

// Setup business profile
router.put(
  '/setup',
  [
    check('type', 'Business type is required').not().isEmpty(),
    check('type', 'Business type must be valid').isIn(['personal', 'food', 'service', 'product'])
  ],
  setupBusiness
);

// Update business profile
router.put(
  '/',
  [
    check('type', 'Business type must be valid if provided')
      .optional()
      .isIn(['personal', 'food', 'service', 'product'])
  ],
  updateBusiness
);

// Get business profile
router.get('/', getBusiness);

module.exports = router;