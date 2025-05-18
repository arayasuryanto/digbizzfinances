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
    required: [true, 'Please specify sender type']
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
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  }
}, {
  timestamps: true
});

// Create index for faster queries
MessageSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);