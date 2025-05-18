const express = require('express');
const { check } = require('express-validator');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary
} = require('../controllers/transactions');

const { protect } = require('../middleware/auth-new');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get transactions summary
router.get('/summary', getTransactionsSummary);

// Get all transactions
router.get('/', getTransactions);

// Get single transaction
router.get('/:id', getTransaction);

// Create transaction
router.post(
  '/',
  [
    check('type', 'Transaction type is required').not().isEmpty(),
    check('type', 'Transaction type must be income or expense').isIn(['income', 'expense']),
    check('amount', 'Amount is required').not().isEmpty(),
    check('amount', 'Amount must be a number').isNumeric(),
    check('amount', 'Amount must be at least 0').isFloat({ min: 0 }),
    check('category', 'Category is required').not().isEmpty(),
    check('text', 'Transaction description is required').not().isEmpty()
  ],
  createTransaction
);

// Update transaction
router.put(
  '/:id',
  [
    check('type', 'Transaction type must be income or expense if provided')
      .optional()
      .isIn(['income', 'expense']),
    check('amount', 'Amount must be a number if provided')
      .optional()
      .isNumeric(),
    check('amount', 'Amount must be at least 0')
      .optional()
      .isFloat({ min: 0 })
  ],
  updateTransaction
);

// Delete transaction
router.delete('/:id', deleteTransaction);

module.exports = router;