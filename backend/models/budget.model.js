const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  monthlyIncome: {
    type: Number,
    required: true,
    min: 0
  },
  savingsGoal: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [{
    name: {
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
    budgetedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    color: {
      type: String,
      default: '#3B82F6'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  period: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  alerts: {
    spendingThreshold: {
      type: Number,
      default: 0.8, // Alert when 80% of budget is spent
      min: 0,
      max: 1
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    }
  },
  goals: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    targetDate: {
      type: Date,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiInsights: {
    spendingPatterns: [String],
    recommendations: [String],
    riskFactors: [String],
    lastAnalyzed: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
budgetSchema.index({ userId: 1, 'period.isActive': 1 });
budgetSchema.index({ userId: 1, createdAt: -1 });

// Virtual for total budgeted amount
budgetSchema.virtual('totalBudgeted').get(function() {
  return this.categories.reduce((total, category) => {
    return total + (category.isActive ? category.budgetedAmount : 0);
  }, 0);
});

// Virtual for total spent amount
budgetSchema.virtual('totalSpent').get(function() {
  return this.categories.reduce((total, category) => {
    return total + (category.isActive ? category.spentAmount : 0);
  }, 0);
});

// Virtual for remaining budget
budgetSchema.virtual('remainingBudget').get(function() {
  return this.totalBudgeted - this.totalSpent;
});

// Virtual for savings rate
budgetSchema.virtual('savingsRate').get(function() {
  if (this.monthlyIncome === 0) return 0;
  return (this.savingsGoal / this.monthlyIncome) * 100;
});

// Virtual for budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.totalBudgeted === 0) return 0;
  return (this.totalSpent / this.totalBudgeted) * 100;
});

// Pre-save middleware to calculate end date
budgetSchema.pre('save', function(next) {
  if (this.isNew && !this.period.endDate) {
    // Set end date to one month from start date
    this.period.endDate = new Date(this.period.startDate);
    this.period.endDate.setMonth(this.period.endDate.getMonth() + 1);
  }
  next();
});

// Method to update spent amounts from transactions
budgetSchema.methods.updateSpentAmounts = async function() {
  const Transaction = mongoose.model('Transaction');
  
  for (let category of this.categories) {
    if (!category.isActive) continue;
    
    const spentAmount = await Transaction.aggregate([
      {
        $match: {
          userId: this.userId,
          type: 'expense',
          category: category.name,
          date: { $gte: this.period.startDate, $lte: this.period.endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    category.spentAmount = spentAmount.length > 0 ? spentAmount[0].total : 0;
  }
  
  await this.save();
};

// Method to check if budget is over
budgetSchema.methods.isOverBudget = function() {
  return this.totalSpent > this.totalBudgeted;
};

// Method to get category performance
budgetSchema.methods.getCategoryPerformance = function() {
  return this.categories.map(category => {
    const utilization = category.budgetedAmount > 0 
      ? (category.spentAmount / category.budgetedAmount) * 100 
      : 0;
    
    return {
      name: category.name,
      budgetedAmount: category.budgetedAmount,
      spentAmount: category.spentAmount,
      remainingAmount: category.budgetedAmount - category.spentAmount,
      utilizationPercentage: utilization,
      isOverBudget: category.spentAmount > category.budgetedAmount,
      color: category.color
    };
  });
};

// Static method to get budget summary
budgetSchema.statics.getBudgetSummary = async function(userId) {
  const budget = await this.findOne({
    userId,
    'period.isActive': true
  });
  
  if (!budget) return null;
  
  await budget.updateSpentAmounts();
  
  return {
    totalBudgeted: budget.totalBudgeted,
    totalSpent: budget.totalSpent,
    remainingBudget: budget.remainingBudget,
    utilizationPercentage: budget.utilizationPercentage,
    isOverBudget: budget.isOverBudget(),
    categoryPerformance: budget.getCategoryPerformance(),
    savingsGoal: budget.savingsGoal,
    savingsRate: budget.savingsRate
  };
};

module.exports = mongoose.model('Budget', budgetSchema);

