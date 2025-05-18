/**
 * Strict Message model
 */
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: [true, 'Sender is required']
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Create index for faster queries
MessageSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);