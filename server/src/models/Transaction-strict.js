/**
 * Strict Transaction model
 */
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify transaction type']
  },
  amount: {
    type: Number,
    required: [true, 'Please add a transaction amount'],
    min: [0, 'Amount must be at least 0']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category']
  },
  subCategories: {
    type: [String],
    default: []
  },
  text: {
    type: String,
    required: [true, 'Please add a transaction description'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  formatted_date: {
    type: String
  },
  confidence: {
    type: Number,
    default: 1.0,
    min: [0, 'Confidence cannot be negative'],
    max: [1, 'Confidence cannot be more than 1']
  },
  needs_review: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Format the date before saving
TransactionSchema.pre('save', function(next) {
  if (!this.formatted_date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    this.formatted_date = this.date.toLocaleDateString('id-ID', options);
  }
  next();
});

// Create index for faster queries
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1 });
TransactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);