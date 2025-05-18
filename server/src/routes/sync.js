const express = require('express');
const { protect } = require('../middleware/auth');
const db = require('../config/db');
const messagesController = require('../controllers/messages');
const transactionsController = require('../controllers/transactions');

const router = express.Router();

// @desc    Sync offline data to database
// @route   POST /api/sync
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    // Check if connected to database
    if (!db.isConnectedToDB()) {
      return res.status(503).json({
        success: false,
        error: 'Database is not connected. Cannot sync data.'
      });
    }

    // Sync messages
    const messagesResult = await messagesController.syncMockMessagesToDatabase();
    
    // Sync transactions
    const transactionsResult = await transactionsController.syncMockTransactionsToDatabase();
    
    // Return results
    res.status(200).json({
      success: true,
      data: {
        messages: messagesResult,
        transactions: transactionsResult
      }
    });
  } catch (err) {
    console.error('Error syncing data:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Check database connection status
// @route   GET /api/sync/status
// @access  Public
router.get('/status', (req, res) => {
  const isConnected = db.isConnectedToDB();
  
  res.status(200).json({
    success: true,
    data: {
      connected: isConnected,
      offlineData: {
        messages: global.mockMessages ? Object.keys(global.mockMessages).length : 0,
        transactions: global.mockTransactions ? Object.keys(global.mockTransactions).length : 0
      }
    }
  });
});

module.exports = router;