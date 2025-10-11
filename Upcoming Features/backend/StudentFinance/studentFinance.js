const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateToken } = require('../utilities');

/**
 * Student Finance API Routes
 * AI-powered financial management for students
 */

// Get user's financial overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's financial data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Sample financial data (replace with real data from database)
    const financialOverview = {
      monthlyIncome: user.financialData?.monthlyIncome || 0,
      monthlyExpenses: user.financialData?.monthlyExpenses || 0,
      savings: user.financialData?.savings || 0,
      goals: user.financialData?.goals || [],
      budget: user.financialData?.budget || {
        housing: 0,
        food: 0,
        transportation: 0,
        books: 0,
        entertainment: 0,
        health: 0
      }
    };

    res.json({ success: true, data: financialOverview });
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get AI financial insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's financial data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate AI insights based on user's financial data
    const insights = generateFinancialInsights(user.financialData);

    res.json({ success: true, insights });
  } catch (error) {
    console.error('Error generating financial insights:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add expense transaction
router.post('/expense', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, category, description, date } = req.body;

    // Validate input
    if (!amount || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount and category are required' 
      });
    }

    // Add expense to user's financial data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize financial data if it doesn't exist
    if (!user.financialData) {
      user.financialData = {
        expenses: [],
        income: [],
        goals: [],
        budget: {}
      };
    }

    // Add new expense
    const newExpense = {
      amount: parseFloat(amount),
      category,
      description: description || '',
      date: date || new Date(),
      createdAt: new Date()
    };

    user.financialData.expenses.push(newExpense);
    await user.save();

    res.json({ success: true, expense: newExpense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Set financial goals
router.post('/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, targetAmount, currentAmount, deadline, category } = req.body;

    // Validate input
    if (!title || !targetAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and target amount are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize financial data if it doesn't exist
    if (!user.financialData) {
      user.financialData = { goals: [] };
    }

    // Add new goal
    const newGoal = {
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline ? new Date(deadline) : null,
      category: category || 'general',
      createdAt: new Date()
    };

    user.financialData.goals.push(newGoal);
    await user.save();

    res.json({ success: true, goal: newGoal });
  } catch (error) {
    console.error('Error setting financial goal:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get expense breakdown
router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    const user = await User.findById(userId);
    if (!user || !user.financialData?.expenses) {
      return res.json({ success: true, expenses: [], breakdown: {} });
    }

    // Filter expenses by period
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    }

    const filteredExpenses = user.financialData.expenses.filter(expense => 
      new Date(expense.date) >= startDate
    );

    // Calculate breakdown by category
    const breakdown = {};
    filteredExpenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });

    res.json({ 
      success: true, 
      expenses: filteredExpenses,
      breakdown,
      total: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Generate AI financial insights
function generateFinancialInsights(financialData) {
  const insights = [];

  if (!financialData) {
    return [
      {
        type: 'info',
        title: 'Welcome to Student Finance',
        message: 'Start tracking your expenses to get personalized financial insights.',
        action: 'Add First Expense',
        priority: 'medium'
      }
    ];
  }

  // Budget analysis
  if (financialData.expenses && financialData.expenses.length > 0) {
    const totalExpenses = financialData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyBudget = financialData.budget?.total || 2000;

    if (totalExpenses > monthlyBudget * 0.9) {
      insights.push({
        type: 'urgent',
        title: 'Budget Alert',
        message: `You've spent ${Math.round((totalExpenses / monthlyBudget) * 100)}% of your monthly budget. Consider reducing expenses.`,
        action: 'View Budget',
        priority: 'high'
      });
    }
  }

  // Savings analysis
  if (financialData.goals && financialData.goals.length > 0) {
    const activeGoals = financialData.goals.filter(goal => 
      goal.currentAmount < goal.targetAmount
    );

    if (activeGoals.length > 0) {
      insights.push({
        type: 'success',
        title: 'Savings Progress',
        message: `You have ${activeGoals.length} active savings goals. Keep up the great work!`,
        action: 'View Goals',
        priority: 'medium'
      });
    }
  }

  // Optimization suggestions
  insights.push({
    type: 'info',
    title: 'Optimization Tip',
    message: 'Consider using a meal plan to reduce food expenses by up to 30%.',
    action: 'Learn More',
    priority: 'low'
  });

  return insights;
}

module.exports = router;
