/**
 * Strict messages controller
 */
const Message = require('../models/Message-strict');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all messages
 * @route   GET /api/messages
 * @access  Private
 */
exports.getMessages = async (req, res) => {
  try {
    console.log('=== GET MESSAGES ===');
    console.log('User ID:', req.user.id);
    
    const messages = await Message.find({ user: req.user.id }).sort({ timestamp: 1 });
    
    console.log(`Found ${messages.length} messages`);
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('*** GET MESSAGES ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving messages'
    });
  }
};

/**
 * @desc    Create message
 * @route   POST /api/messages
 * @access  Private
 */
exports.createMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    console.log('=== CREATE MESSAGE ===');
    console.log('User ID:', req.user.id);
    console.log('Message data:', req.body);
    
    const { sender, text, metadata } = req.body;
    
    // Create message
    const message = new Message({
      user: req.user.id,
      sender,
      text,
      metadata: metadata || {},
      timestamp: new Date()
    });
    
    // Save message
    await message.save();
    console.log('Message saved with ID:', message._id);
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('*** CREATE MESSAGE ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating message'
    });
  }
};

/**
 * @desc    Create batch messages
 * @route   POST /api/messages/batch
 * @access  Private
 */
exports.createBatchMessages = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    console.log('=== CREATE BATCH MESSAGES ===');
    console.log('User ID:', req.user.id);
    
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }
    
    console.log(`Processing batch of ${messages.length} messages`);
    
    // Prepare messages with user ID
    const messagesToSave = messages.map(msg => ({
      user: req.user.id,
      sender: msg.sender,
      text: msg.text,
      metadata: msg.metadata || {},
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }));
    
    // Save all messages
    const savedMessages = await Message.insertMany(messagesToSave);
    console.log(`Saved ${savedMessages.length} messages`);
    
    res.status(201).json({
      success: true,
      count: savedMessages.length,
      data: savedMessages
    });
  } catch (error) {
    console.error('*** CREATE BATCH MESSAGES ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating batch messages'
    });
  }
};

/**
 * @desc    Delete all messages
 * @route   DELETE /api/messages
 * @access  Private
 */
exports.deleteAllMessages = async (req, res) => {
  try {
    console.log('=== DELETE ALL MESSAGES ===');
    console.log('User ID:', req.user.id);
    
    const result = await Message.deleteMany({ user: req.user.id });
    console.log(`Deleted ${result.deletedCount} messages`);
    
    res.status(200).json({
      success: true,
      count: result.deletedCount,
      data: {}
    });
  } catch (error) {
    console.error('*** DELETE ALL MESSAGES ERROR ***', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting messages'
    });
  }
};