const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'housing',
      'food', 
      'transportation',
      'books',
      'entertainment',
      'health',
      'education',
      'utilities',
      'insurance',
      'savings',
      'other'
    ]
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  nextDueDate: {
    type: Date,
    required: function() {
      return this.isRecurring;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'],
    default: 'card'
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiInsights: {
    categoryConfidence: Number,
    suggestedTags: [String],
    spendingPattern: String,
    anomaly: Boolean
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, amount: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Virtual for month/year for grouping
transactionSchema.virtual('monthYear').get(function() {
  return this.date.toISOString().substring(0, 7); // YYYY-MM format
});

// Pre-save middleware to handle recurring transactions
transactionSchema.pre('save', function(next) {
  if (this.isRecurring && this.recurringPattern && !this.nextDueDate) {
    const now = new Date();
    switch (this.recurringPattern) {
      case 'daily':
        this.nextDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        this.nextDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        this.nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case 'yearly':
        this.nextDueDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
    }
  }
  next();
});

// Static method to get spending summary
transactionSchema.statics.getSpendingSummary = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to get monthly trends
transactionSchema.statics.getMonthlyTrends = async function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ];

  return this.aggregate(pipeline);
};

// Instance method to check if transaction is overdue
transactionSchema.methods.isOverdue = function() {
  if (!this.isRecurring) return false;
  return this.nextDueDate && this.nextDueDate < new Date();
};

module.exports = mongoose.model('Transaction', transactionSchema);
