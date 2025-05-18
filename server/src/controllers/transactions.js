const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Initialize global mockTransactions object if it doesn't exist
if (!global.mockTransactions) {
  global.mockTransactions = {};
}

// Initialize global mockUsersData object if it doesn't exist
if (!global.mockUsersData) {
  global.mockUsersData = {};
}

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    // Build query
    let query = { user: req.user.id };
    
    // Filter by type
    if (req.query.type && ['income', 'expense'].includes(req.query.type)) {
      query.type = req.query.type;
    }
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate) };
    }

    // Filter by needs_review
    if (req.query.needs_review === 'true') {
      query.needs_review = true;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;
    
    try {
      const transactions = await Transaction.find(query)
        .sort({ date: -1 })
        .skip(startIndex)
        .limit(limit);

      // Get total count for pagination
      const count = await Transaction.countDocuments(query);

      res.status(200).json({
        success: true,
        count,
        data: transactions,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (dbError) {
      // Fallback to mock transactions if MongoDB is unavailable
      console.error('Database error in getTransactions, using fallback:', dbError.message);
      
      // Ensure user data storage exists
      if (!global.mockUsersData[req.user.id]) {
        global.mockUsersData[req.user.id] = {
          messages: {},
          transactions: {}
        };
      }
      
      // Get user's transactions from user-specific storage
      let mockTransactionsList = Object.values(global.mockUsersData[req.user.id].transactions || {})
        .filter(transaction => {
          // Type filter
          if (query.type && transaction.type !== query.type) return false;
          
          // Category filter
          if (query.category && transaction.category !== query.category) return false;
          
          // Date range filter
          if (query.date) {
            const transactionDate = new Date(transaction.date);
            if (query.date.$gte && transactionDate < new Date(query.date.$gte)) return false;
            if (query.date.$lte && transactionDate > new Date(query.date.$lte)) return false;
          }
          
          // Needs review filter
          if (query.needs_review === true && !transaction.needs_review) return false;
          
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const count = mockTransactionsList.length;
      
      // Apply pagination
      mockTransactionsList = mockTransactionsList.slice(startIndex, startIndex + limit);
      
      res.status(200).json({
        success: true,
        count,
        data: mockTransactionsList,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        },
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in getTransactions:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    try {
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        // Check if this exists in user-specific transactions
        if (global.mockUsersData?.[req.user.id]?.transactions?.[req.params.id]) {
          const mockTransaction = global.mockUsersData[req.user.id].transactions[req.params.id];
          
          return res.status(200).json({
            success: true,
            data: mockTransaction,
            source: 'fallback'
          });
        }
        
        // Fallback to check global transaction registry
        if (global.mockTransactions && global.mockTransactions[req.params.id]) {
          const mockTransaction = global.mockTransactions[req.params.id];
          
          // Check if user owns this transaction
          if (mockTransaction.user !== req.user.id) {
            return res.status(401).json({
              success: false,
              error: 'Not authorized to access this transaction'
            });
          }
          
          return res.status(200).json({
            success: true,
            data: mockTransaction,
            source: 'fallback'
          });
        }
        
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Make sure user owns transaction
      if (transaction.user.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access this transaction'
        });
      }

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (dbError) {
      // Fallback to mock transactions if MongoDB is unavailable
      console.error('Database error in getTransaction, using fallback:', dbError.message);
      
      // First check user-specific storage
      if (global.mockUsersData?.[req.user.id]?.transactions?.[req.params.id]) {
        const mockTransaction = global.mockUsersData[req.user.id].transactions[req.params.id];
        
        return res.status(200).json({
          success: true,
          data: mockTransaction,
          source: 'fallback'
        });
      }
      
      // Fallback to check global registry
      if (global.mockTransactions && global.mockTransactions[req.params.id]) {
        const mockTransaction = global.mockTransactions[req.params.id];
        
        // Check if user owns this transaction
        if (mockTransaction.user !== req.user.id) {
          return res.status(401).json({
            success: false,
            error: 'Not authorized to access this transaction'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: mockTransaction,
          source: 'fallback'
        });
      }
      
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
  } catch (err) {
    console.error('Server error in getTransaction:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Add user to req.body
    req.body.user = req.user.id;
    
    // Format the date
    if (req.body.date) {
      const date = new Date(req.body.date);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      req.body.formatted_date = date.toLocaleDateString('id-ID', options);
    } else {
      const date = new Date();
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      req.body.formatted_date = date.toLocaleDateString('id-ID', options);
      req.body.date = date;
    }

    try {
      const transaction = await Transaction.create(req.body);

      // Update user balance
      const user = await User.findById(req.user.id);
      
      if (req.body.type === 'income') {
        user.balance += req.body.amount;
      } else {
        user.balance -= req.body.amount;
      }
      
      await user.save();

      res.status(201).json({
        success: true,
        data: transaction,
        balance: user.balance
      });
    } catch (dbError) {
      // Fallback to mock storage if MongoDB is unavailable
      console.error('Database error in createTransaction, using fallback:', dbError.message);
      
      // Create a mock transaction with an ID
      const mockTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mockTransaction = {
        _id: mockTransactionId,
        user: req.user.id,
        type: req.body.type,
        amount: req.body.amount,
        category: req.body.category,
        subCategories: req.body.subCategories || [],
        text: req.body.text,
        date: req.body.date,
        formatted_date: req.body.formatted_date,
        confidence: req.body.confidence || 1.0,
        needs_review: req.body.needs_review || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Ensure user data storage exists
      if (!global.mockUsersData[req.user.id]) {
        global.mockUsersData[req.user.id] = {
          messages: {},
          transactions: {}
        };
      }
      
      // Save to user-specific transaction registry
      global.mockUsersData[req.user.id].transactions[mockTransactionId] = mockTransaction;
      
      // Also save to global registry for backward compatibility
      global.mockTransactions[mockTransactionId] = mockTransaction;
      
      // Save to file for persistence between server restarts
      const localStoragePersistence = require('../utils/localStoragePersistence');
      localStoragePersistence.saveUserData(req.user.id, 'transactions', global.mockUsersData[req.user.id].transactions);
      
      // Update user's mock balance
      let updatedBalance = 0;
      
      try {
        // Try to find the user from MongoDB first
        const user = await User.findById(req.user.id);
        updatedBalance = user.balance;
        
        // Update balance based on transaction type
        if (req.body.type === 'income') {
          updatedBalance += req.body.amount;
        } else {
          updatedBalance -= req.body.amount;
        }
        
        // Save updated balance to MongoDB if possible
        user.balance = updatedBalance;
        await user.save();
      } catch (userDbError) {
        // If can't find in MongoDB, check mock user
        if (global.mockUsers && global.mockUsers[req.user.id]) {
          updatedBalance = global.mockUsers[req.user.id].balance || 0;
          
          // Update balance based on transaction type
          if (req.body.type === 'income') {
            updatedBalance += req.body.amount;
          } else {
            updatedBalance -= req.body.amount;
          }
          
          // Update mock user balance
          global.mockUsers[req.user.id].balance = updatedBalance;
        } else {
          // No user found in mock registry either, create one
          if (!global.mockUsers) {
            global.mockUsers = {};
          }
          
          updatedBalance = req.body.type === 'income' ? req.body.amount : -req.body.amount;
          
          global.mockUsers[req.user.id] = {
            _id: req.user.id,
            balance: updatedBalance,
            createdAt: new Date()
          };
        }
      }
      
      console.log(`Mock transaction created with ID: ${mockTransactionId}. Mock transaction count:`, 
        Object.keys(global.mockTransactions).length);
      
      res.status(201).json({
        success: true,
        data: mockTransaction,
        balance: updatedBalance,
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in createTransaction:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
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

    // Make sure user owns transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this transaction'
      });
    }

    // Handle balance adjustment if amount or type changes
    let balanceAdjustment = 0;
    const user = await User.findById(req.user.id);
    
    // Remove the effect of the old transaction
    if (transaction.type === 'income') {
      balanceAdjustment -= transaction.amount;
    } else {
      balanceAdjustment += transaction.amount;
    }
    
    // Add the effect of the updated transaction
    if (req.body.type === 'income') {
      balanceAdjustment += req.body.amount;
    } else {
      balanceAdjustment -= req.body.amount;
    }
    
    // Format the date if it's being updated
    if (req.body.date) {
      const date = new Date(req.body.date);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      req.body.formatted_date = date.toLocaleDateString('id-ID', options);
    }

    // Update the transaction
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Update user balance
    user.balance += balanceAdjustment;
    await user.save();

    res.status(200).json({
      success: true,
      data: transaction,
      balance: user.balance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Make sure user owns transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this transaction'
      });
    }

    // Adjust user balance
    const user = await User.findById(req.user.id);
    
    if (transaction.type === 'income') {
      user.balance -= transaction.amount;
    } else {
      user.balance += transaction.amount;
    }
    
    await user.save();

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      balance: user.balance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get transactions summary
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionsSummary = async (req, res) => {
  try {
    // Filter by date range
    let dateFilter = {};
    if (req.query.startDate && req.query.endDate) {
      dateFilter = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      dateFilter = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      dateFilter = { $lte: new Date(req.query.endDate) };
    }

    try {
      // Build pipeline for income summary
      const mongoose = require('mongoose');
      const incomeSummary = await Transaction.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
            type: 'income',
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      // Build pipeline for expense summary
      const expenseSummary = await Transaction.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId(req.user.id),
            type: 'expense',
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      // Calculate totals
      const totalIncome = incomeSummary.reduce((sum, item) => sum + item.total, 0);
      const totalExpense = expenseSummary.reduce((sum, item) => sum + item.total, 0);

      res.status(200).json({
        success: true,
        data: {
          income: {
            categories: incomeSummary,
            total: totalIncome
          },
          expense: {
            categories: expenseSummary,
            total: totalExpense
          },
          balance: totalIncome - totalExpense
        }
      });
    } catch (dbError) {
      // Fallback to mock transactions if MongoDB is unavailable
      console.error('Database error in getTransactionsSummary, using fallback:', dbError.message);
      
      // Ensure user data storage exists
      if (!global.mockUsersData[req.user.id]) {
        global.mockUsersData[req.user.id] = {
          messages: {},
          transactions: {}
        };
      }
      
      // Get user-specific transactions and filter by date
      const mockTransactionsList = Object.values(global.mockUsersData[req.user.id].transactions || {}).filter(transaction => {
        // Date range filter
        if (Object.keys(dateFilter).length > 0) {
          const transactionDate = new Date(transaction.date);
          if (dateFilter.$gte && transactionDate < new Date(dateFilter.$gte)) return false;
          if (dateFilter.$lte && transactionDate > new Date(dateFilter.$lte)) return false;
        }
        
        return true;
      });
      
      // Group by category for income
      const incomeByCategory = {};
      const expenseByCategory = {};
      
      mockTransactionsList.forEach(transaction => {
        if (transaction.type === 'income') {
          if (!incomeByCategory[transaction.category]) {
            incomeByCategory[transaction.category] = { count: 0, total: 0 };
          }
          incomeByCategory[transaction.category].count += 1;
          incomeByCategory[transaction.category].total += transaction.amount;
        } else {
          if (!expenseByCategory[transaction.category]) {
            expenseByCategory[transaction.category] = { count: 0, total: 0 };
          }
          expenseByCategory[transaction.category].count += 1;
          expenseByCategory[transaction.category].total += transaction.amount;
        }
      });
      
      // Format income summary
      const incomeSummary = Object.keys(incomeByCategory).map(category => ({
        _id: category,
        count: incomeByCategory[category].count,
        total: incomeByCategory[category].total
      })).sort((a, b) => b.total - a.total);
      
      // Format expense summary
      const expenseSummary = Object.keys(expenseByCategory).map(category => ({
        _id: category,
        count: expenseByCategory[category].count,
        total: expenseByCategory[category].total
      })).sort((a, b) => b.total - a.total);
      
      // Calculate totals
      const totalIncome = incomeSummary.reduce((sum, item) => sum + item.total, 0);
      const totalExpense = expenseSummary.reduce((sum, item) => sum + item.total, 0);

      res.status(200).json({
        success: true,
        data: {
          income: {
            categories: incomeSummary,
            total: totalIncome
          },
          expense: {
            categories: expenseSummary,
            total: totalExpense
          },
          balance: totalIncome - totalExpense
        },
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in getTransactionsSummary:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Add a function to sync mock transactions to database when connection is restored
exports.syncMockTransactionsToDatabase = async () => {
  try {
    if (!global.mockTransactions || Object.keys(global.mockTransactions).length === 0) {
      console.log('No mock transactions to sync to database');
      return { success: true, synced: 0 };
    }
    
    console.log(`Attempting to sync ${Object.keys(global.mockTransactions).length} mock transactions to database...`);
    
    // Group transactions by user
    const transactionsByUser = {};
    Object.values(global.mockTransactions).forEach(txn => {
      if (!transactionsByUser[txn.user]) {
        transactionsByUser[txn.user] = [];
      }
      transactionsByUser[txn.user].push(txn);
    });
    
    let totalSynced = 0;
    
    // Process each user's transactions
    for (const userId in transactionsByUser) {
      const userTransactions = transactionsByUser[userId];
      
      // Get current user balance from DB if possible
      let user;
      try {
        user = await User.findById(userId);
      } catch (err) {
        console.error(`Could not find user ${userId} in database for transaction sync`);
        continue; // Skip this user's transactions
      }
      
      // Calculate balance adjustments
      let balanceAdjustment = 0;
      
      // Convert mock transaction IDs to MongoDB compatible ones
      const transactionsToInsert = userTransactions.map(({ _id, ...rest }) => {
        // Calculate balance adjustment
        if (rest.type === 'income') {
          balanceAdjustment += rest.amount;
        } else {
          balanceAdjustment -= rest.amount;
        }
        
        return rest;
      });
      
      // Insert the transactions
      const result = await Transaction.insertMany(transactionsToInsert);
      totalSynced += result.length;
      
      console.log(`Synced ${result.length} transactions for user ${userId}`);
      
      // Update user's balance
      if (user) {
        user.balance += balanceAdjustment;
        await user.save();
        console.log(`Updated balance for user ${userId} by ${balanceAdjustment}`);
      }
      
      // Remove synced transactions from mock registry
      userTransactions.forEach(txn => {
        delete global.mockTransactions[txn._id];
      });
    }
    
    console.log(`Sync complete. Synced ${totalSynced} transactions to database.`);
    return { success: true, synced: totalSynced };
  } catch (err) {
    console.error('Error syncing mock transactions to database:', err);
    return { success: false, error: err.message };
  }
};