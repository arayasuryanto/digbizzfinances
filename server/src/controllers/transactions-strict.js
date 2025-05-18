/**
 * Strict transactions controller
 */
const Transaction = require('../models/Transaction-strict');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res) => {
  try {
    const pageSize = 10;
    const page = parseInt(req.query.page, 10) || 1;
    
    console.log('=== GET TRANSACTIONS ===');
    console.log('User ID:', req.user.id);
    console.log('Page:', page);
    
    const count = await Transaction.countDocuments({ user: req.user.id });
    
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(pageSize)
      .skip((page - 1) * pageSize);
    
    console.log(`Found ${transactions.length} transactions`);
    
    res.status(200).json({
      success: true,
      count,
      data: transactions,
      pagination: {
        page,
        pages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('*** GET TRANSACTIONS ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving transactions'
    });
  }
};

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Make sure transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this transaction'
      });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('*** GET TRANSACTION ERROR ***', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error retrieving transaction'
    });
  }
};

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    console.log('=== CREATE TRANSACTION ===');
    console.log('User ID:', req.user.id);
    console.log('Transaction data:', req.body);
    
    const { type, amount, category, subCategories, text, date, needs_review, confidence } = req.body;
    
    // Create transaction
    const transaction = new Transaction({
      user: req.user.id,
      type,
      amount,
      category,
      subCategories: subCategories || [],
      text,
      date: date ? new Date(date) : new Date(),
      needs_review: needs_review || false,
      confidence: confidence || 1.0
    });
    
    // Save transaction
    await transaction.save();
    console.log('Transaction saved with ID:', transaction._id);
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('*** CREATE TRANSACTION ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating transaction'
    });
  }
};

/**
 * @desc    Update transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
exports.updateTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    let transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Make sure transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this transaction'
      });
    }
    
    // Update transaction
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('*** UPDATE TRANSACTION ERROR ***', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error updating transaction'
    });
  }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Make sure transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this transaction'
      });
    }
    
    await transaction.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('*** DELETE TRANSACTION ERROR ***', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error deleting transaction'
    });
  }
};

/**
 * @desc    Get transactions summary (income, expense, balance)
 * @route   GET /api/transactions/summary
 * @access  Private
 */
exports.getTransactionsSummary = async (req, res) => {
  try {
    console.log('=== GET TRANSACTIONS SUMMARY ===');
    console.log('User ID:', req.user.id);
    
    // Aggregate pipeline to calculate income, expense, and balance
    const result = await Transaction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Initialize summary with default values
    const summary = {
      income: 0,
      expense: 0,
      balance: 0
    };
    
    // Process aggregation results
    result.forEach(item => {
      if (item._id === 'income') {
        summary.income = item.total;
      } else if (item._id === 'expense') {
        summary.expense = item.total;
      }
    });
    
    // Calculate balance
    summary.balance = summary.income - summary.expense;
    
    console.log('Transaction summary:', summary);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('*** GET TRANSACTIONS SUMMARY ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving transactions summary'
    });
  }
};