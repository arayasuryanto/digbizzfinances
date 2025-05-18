const Message = require('../models/Message');
const { validationResult } = require('express-validator');

// Initialize global mockMessages object if it doesn't exist
if (!global.mockMessages) {
  global.mockMessages = {};
}

// Initialize global mockUsersData object if it doesn't exist
if (!global.mockUsersData) {
  global.mockUsersData = {};
}

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    try {
      const messages = await Message.find({ user: req.user.id })
        .sort({ timestamp: -1 })
        .skip(startIndex)
        .limit(limit);

      // Get total count for pagination
      const count = await Message.countDocuments({ user: req.user.id });

      res.status(200).json({
        success: true,
        count,
        data: messages,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (dbError) {
      // Fallback to mock messages if MongoDB is unavailable
      console.error('Database error in getMessages, using fallback:', dbError.message);
      
      // Ensure user data storage exists
      if (!global.mockUsersData[req.user.id]) {
        global.mockUsersData[req.user.id] = {
          messages: {},
          transactions: {}
        };
      }
      
      // Get mock messages for this user from user-specific storage
      const userMockMessages = Object.values(global.mockUsersData[req.user.id].messages || {})
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(startIndex, startIndex + limit);
      
      const count = Object.keys(global.mockUsersData[req.user.id].messages || {}).length;
      
      res.status(200).json({
        success: true,
        count,
        data: userMockMessages,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        },
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in getMessages:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create new message
// @route   POST /api/messages
// @access  Private
exports.createMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Add user to req.body
    req.body.user = req.user.id;
    
    try {
      const message = await Message.create(req.body);

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (dbError) {
      // Fallback to mock messages if MongoDB is unavailable
      console.error('Database error in createMessage, using fallback:', dbError.message);
      
      // Create a mock message with an ID
      const mockMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mockMessage = {
        _id: mockMessageId,
        user: req.user.id,
        userId: req.body.userId, // Keep track of the front-end user ID if available
        sender: req.body.sender,
        text: req.body.text,
        timestamp: req.body.timestamp || new Date(),
        relatedTransaction: req.body.relatedTransaction || null,
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
      
      // Save to user-specific message registry
      global.mockUsersData[req.user.id].messages[mockMessageId] = mockMessage;
      
      // Also save to global registry for backward compatibility
      global.mockMessages[mockMessageId] = mockMessage;
      
      console.log(`Mock message created for user ${req.user.id}. User message count:`, 
        Object.keys(global.mockUsersData[req.user.id].messages).length);
      
      // Save to file for persistence between server restarts
      try {
        const localStoragePersistence = require('../utils/localStoragePersistence');
        // Save to user-specific file
        localStoragePersistence.saveUserData(req.user.id, 'messages', global.mockUsersData[req.user.id].messages);
      } catch (storageError) {
        console.error('Error saving to file persistence:', storageError);
        // Continue processing even if file storage fails
      }
      
      // Always return a 201 status, even with fallback
      return res.status(201).json({
        success: true,
        data: mockMessage,
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in createMessage:', err);
    // Return a less severe error status (200) to prevent auth redirects
    return res.status(200).json({
      success: false,
      error: 'Server error, but operation may have succeeded',
      errorDetails: err.message
    });
  }
};

// @desc    Create multiple messages
// @route   POST /api/messages/batch
// @access  Private
exports.createBatchMessages = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!Array.isArray(req.body.messages) || req.body.messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of messages'
      });
    }

    // Add user to all messages
    const messagesToCreate = req.body.messages.map(message => ({
      ...message,
      user: req.user.id
    }));
    
    try {
      const messages = await Message.insertMany(messagesToCreate);

      res.status(201).json({
        success: true,
        count: messages.length,
        data: messages
      });
    } catch (dbError) {
      // Fallback to mock messages if MongoDB is unavailable
      console.error('Database error in createBatchMessages, using fallback:', dbError.message);
      
      // Create mock messages with IDs
      const mockMessages = messagesToCreate.map(msg => {
        const mockMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return {
          _id: mockMessageId,
          user: req.user.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp || new Date(),
          relatedTransaction: msg.relatedTransaction || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
      
      // Ensure user data storage exists
      if (!global.mockUsersData[req.user.id]) {
        global.mockUsersData[req.user.id] = {
          messages: {},
          transactions: {}
        };
      }
      
      // Save all mock messages to user-specific registry
      mockMessages.forEach(msg => {
        global.mockUsersData[req.user.id].messages[msg._id] = msg;
        
        // Also save to global registry for backward compatibility
        global.mockMessages[msg._id] = msg;
      });
      
      console.log(`${mockMessages.length} mock messages created for user ${req.user.id}. User message count:`, 
        Object.keys(global.mockUsersData[req.user.id].messages).length);
        
      // Save to file for persistence between server restarts
      const localStoragePersistence = require('../utils/localStoragePersistence');
      localStoragePersistence.saveUserData(req.user.id, 'messages', global.mockUsersData[req.user.id].messages);
      
      res.status(201).json({
        success: true,
        count: mockMessages.length,
        data: mockMessages,
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in createBatchMessages:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete all messages
// @route   DELETE /api/messages
// @access  Private
exports.deleteAllMessages = async (req, res) => {
  try {
    try {
      await Message.deleteMany({ user: req.user.id });
      
      // Also delete any mock messages for this user
      if (global.mockMessages) {
        Object.keys(global.mockMessages).forEach(key => {
          if (global.mockMessages[key].user === req.user.id) {
            delete global.mockMessages[key];
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (dbError) {
      // Fallback if MongoDB is unavailable
      console.error('Database error in deleteAllMessages, using fallback:', dbError.message);
      
      // Delete mock messages for this user
      let deletedCount = 0;
      
      // Delete from global registry for backward compatibility
      if (global.mockMessages) {
        Object.keys(global.mockMessages).forEach(key => {
          if (global.mockMessages[key].user === req.user.id) {
            delete global.mockMessages[key];
            deletedCount++;
          }
        });
      }
      
      // Delete from user-specific storage
      if (global.mockUsersData && global.mockUsersData[req.user.id]) {
        deletedCount = Object.keys(global.mockUsersData[req.user.id].messages || {}).length;
        global.mockUsersData[req.user.id].messages = {};
      }
      
      console.log(`Deleted ${deletedCount} mock messages for user ${req.user.id}`);
      
      // Save to file for persistence between server restarts
      const localStoragePersistence = require('../utils/localStoragePersistence');
      localStoragePersistence.saveUserData(req.user.id, 'messages', {});
      
      res.status(200).json({
        success: true,
        data: {},
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Server error in deleteAllMessages:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Add a function to sync mock messages to database when connection is restored
exports.syncMockMessagesToDatabase = async () => {
  try {
    if (!global.mockMessages || Object.keys(global.mockMessages).length === 0) {
      console.log('No mock messages to sync to database');
      return { success: true, synced: 0 };
    }
    
    console.log(`Attempting to sync ${Object.keys(global.mockMessages).length} mock messages to database...`);
    
    // Group messages by user
    const messagesByUser = {};
    Object.values(global.mockMessages).forEach(msg => {
      if (!messagesByUser[msg.user]) {
        messagesByUser[msg.user] = [];
      }
      messagesByUser[msg.user].push(msg);
    });
    
    let totalSynced = 0;
    
    // Process each user's messages
    for (const userId in messagesByUser) {
      const userMessages = messagesByUser[userId];
      
      // Convert mock message IDs to MongoDB compatible ones
      const messagesToInsert = userMessages.map(({ _id, ...rest }) => rest);
      
      // Insert the messages
      const result = await Message.insertMany(messagesToInsert);
      totalSynced += result.length;
      
      console.log(`Synced ${result.length} messages for user ${userId}`);
      
      // Remove synced messages from mock registry
      userMessages.forEach(msg => {
        delete global.mockMessages[msg._id];
      });
    }
    
    console.log(`Sync complete. Synced ${totalSynced} messages to database.`);
    return { success: true, synced: totalSynced };
  } catch (err) {
    console.error('Error syncing mock messages to database:', err);
    return { success: false, error: err.message };
  }
};