/**
 * Strict messages routes
 */
const express = require('express');
const { check } = require('express-validator');
const {
  getMessages,
  createMessage,
  createBatchMessages,
  deleteAllMessages
} = require('../controllers/messages-strict');

const { protect } = require('../middleware/auth-strict');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all messages
router.get('/', getMessages);

// Create message
router.post(
  '/',
  [
    check('sender', 'Sender is required').not().isEmpty(),
    check('sender', 'Sender must be user or assistant').isIn(['user', 'assistant']),
    check('text', 'Message text is required').not().isEmpty()
  ],
  createMessage
);

// Create batch messages
router.post(
  '/batch',
  [
    check('messages', 'Messages array is required').isArray(),
    check('messages.*.sender', 'Sender is required for all messages').not().isEmpty(),
    check('messages.*.sender', 'Sender must be user or assistant for all messages').isIn(['user', 'assistant']),
    check('messages.*.text', 'Text is required for all messages').not().isEmpty()
  ],
  createBatchMessages
);

// Delete all messages
router.delete('/', deleteAllMessages);

module.exports = router;