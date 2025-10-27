const mongoose = require('mongoose');

const financialReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  summary: {
    totalIncome: {
      type: Number,
      default: 0
    },
    totalExpenses: {
      type: Number,
      default: 0
    },
    netIncome: {
      type: Number,
      default: 0
    },
    savingsRate: {
      type: Number,
      default: 0
    },
    averageDailySpending: {
      type: Number,
      default: 0
    }
  },
  categoryBreakdown: [{
    category: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    transactionCount: {
      type: Number,
      required: true
    },
    averageTransaction: {
      type: Number,
      required: true
    }
  }],
  trends: {
    incomeGrowth: {
      type: Number,
      default: 0
    },
    expenseGrowth: {
      type: Number,
      default: 0
    },
    savingsGrowth: {
      type: Number,
      default: 0
    },
    topSpendingCategory: {
      type: String,
      default: ''
    },
    mostFrequentCategory: {
      type: String,
      default: ''
    }
  },
  insights: {
    spendingPatterns: [String],
    recommendations: [String],
    alerts: [String],
    achievements: [String],
    riskFactors: [String]
  },
  goals: {
    savingsGoal: {
      type: Number,
      default: 0
    },
    savingsProgress: {
      type: Number,
      default: 0
    },
    goalAchievementRate: {
      type: Number,
      default: 0
    }
  },
  aiAnalysis: {
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    keyFindings: [String],
    nextSteps: [String],
    riskAssessment: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  charts: {
    monthlyTrends: [{
      month: String,
      income: Number,
      expenses: Number,
      savings: Number
    }],
    categoryDistribution: [{
      category: String,
      amount: Number,
      color: String
    }],
    spendingByDay: [{
      day: String,
      amount: Number
    }]
  },
  isGenerated: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
financialReportSchema.index({ userId: 1, reportType: 1, 'period.startDate': -1 });
financialReportSchema.index({ userId: 1, generatedAt: -1 });
financialReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for report duration in days
financialReportSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.period.endDate - this.period.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted period
financialReportSchema.virtual('formattedPeriod').get(function() {
  const start = this.period.startDate.toLocaleDateString();
  const end = this.period.endDate.toLocaleDateString();
  return `${start} - ${end}`;
});

// Pre-save middleware to calculate derived fields
financialReportSchema.pre('save', function(next) {
  // Calculate net income
  this.summary.netIncome = this.summary.totalIncome - this.summary.totalExpenses;
  
  // Calculate savings rate
  if (this.summary.totalIncome > 0) {
    this.summary.savingsRate = (this.summary.netIncome / this.summary.totalIncome) * 100;
  }
  
  // Calculate average daily spending
  if (this.durationDays > 0) {
    this.summary.averageDailySpending = this.summary.totalExpenses / this.durationDays;
  }
  
  next();
});

// Method to generate insights
financialReportSchema.methods.generateInsights = function() {
  const insights = [];
  
  // Spending pattern insights
  if (this.summary.savingsRate > 20) {
    insights.push("Great job! You're saving more than 20% of your income.");
  } else if (this.summary.savingsRate < 0) {
    insights.push("You're spending more than you earn. Consider reducing expenses.");
  }
  
  // Category insights
  const topCategory = this.categoryBreakdown[0];
  if (topCategory && topCategory.percentage > 40) {
    insights.push(`${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of your spending.`);
  }
  
  // Trend insights
  if (this.trends.expenseGrowth > 10) {
    insights.push("Your expenses have increased significantly this period.");
  } else if (this.trends.expenseGrowth < -10) {
    insights.push("You've successfully reduced your expenses this period!");
  }
  
  this.insights.spendingPatterns = insights;
  return insights;
};

// Method to generate recommendations
financialReportSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  // Savings recommendations
  if (this.summary.savingsRate < 10) {
    recommendations.push("Consider increasing your savings rate to at least 10%.");
  }
  
  // Category-specific recommendations
  const housingCategory = this.categoryBreakdown.find(cat => cat.category === 'housing');
  if (housingCategory && housingCategory.percentage > 30) {
    recommendations.push("Housing costs are high. Consider finding ways to reduce rent or utilities.");
  }
  
  const foodCategory = this.categoryBreakdown.find(cat => cat.category === 'food');
  if (foodCategory && foodCategory.percentage > 15) {
    recommendations.push("Food expenses are high. Consider meal planning or cooking at home more often.");
  }
  
  this.insights.recommendations = recommendations;
  return recommendations;
};

// Static method to generate report
financialReportSchema.statics.generateReport = async function(userId, reportType, startDate, endDate) {
  const Transaction = mongoose.model('Transaction');
  const Budget = mongoose.model('Budget');
  
  // Get transactions for the period
  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
  
  // Calculate summary
  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate category breakdown
  const categoryMap = {};
  expenses.forEach(transaction => {
    if (!categoryMap[transaction.category]) {
      categoryMap[transaction.category] = {
        amount: 0,
        count: 0
      };
    }
    categoryMap[transaction.category].amount += transaction.amount;
    categoryMap[transaction.category].count += 1;
  });
  
  const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
    transactionCount: data.count,
    averageTransaction: data.amount / data.count
  })).sort((a, b) => b.amount - a.amount);
  
  // Get budget for goals
  const budget = await Budget.findOne({ userId, 'period.isActive': true });
  
  // Create report
  const report = new this({
    userId,
    reportType,
    period: { startDate, endDate },
    summary: {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      averageDailySpending: totalExpenses / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    },
    categoryBreakdown,
    goals: {
      savingsGoal: budget?.savingsGoal || 0,
      savingsProgress: budget ? (totalIncome - totalExpenses) / budget.savingsGoal * 100 : 0,
      goalAchievementRate: budget ? Math.min(100, ((totalIncome - totalExpenses) / budget.savingsGoal) * 100) : 0
    }
  });
  
  // Generate insights and recommendations
  report.generateInsights();
  report.generateRecommendations();
  
  await report.save();
  return report;
};

module.exports = mongoose.model('FinancialReport', financialReportSchema);













