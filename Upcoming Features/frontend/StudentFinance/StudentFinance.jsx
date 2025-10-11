import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdAccountBalance, 
  MdTrendingUp, 
  MdTrendingDown, 
  MdSavings, 
  MdReceipt,
  MdAttachMoney,
  MdPieChart,
  MdNotifications,
  MdFlag,
  MdAnalytics,
  MdAdd,
  MdSchedule,
  MdGpsFixed
} from 'react-icons/md';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import Navbar from '../components/Navbar/Navbar';
import NewRunDrawer from '../components/ui/NewRunDrawer';
import axiosInstance from '../utils/axiosInstance';
import '../styles/newrun-hero.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Point glow plugin for better marker visibility
  // Custom plugin to draw markers on top of everything
  const markersOnTop = {
    id: 'markersOnTop',
    afterDatasetsDraw(chart) {
      const lineIdx = chart.data.datasets.findIndex(d => d.type === 'line' && d.label === 'Savings');
      if (lineIdx === -1) return;
      const meta = chart.getDatasetMeta(lineIdx);
      const { ctx } = chart;

      ctx.save();
      meta.data.forEach(pt => {
        const { x, y } = pt.tooltipPosition();

        // soft glow
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,197,94,0.22)'; // green glow
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#22c55e';
        ctx.fill();
        ctx.shadowBlur = 0;

        // outer ring
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // inner fill (match card bg for contrast on bars)
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#0b0f14'; // NewRun card bg
        ctx.fill();
      });
      ctx.restore();
    }
  };

/**
 * Student Finance Dashboard
 * AI-powered financial management for students
 * CEO-level UX with comprehensive financial insights
 */
const StudentFinance = () => {
  const [budget, setBudget] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    goals: []
  });

  const [expenses, setExpenses] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  // Transaction drawer state
  const [showTransactionDrawer, setShowTransactionDrawer] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    category: '',
    description: '',
    type: 'expense', // 'expense' or 'income'
    date: new Date().toISOString().split('T')[0]
  });

  // Additional drawer states
  const [showBudgetingDrawer, setShowBudgetingDrawer] = useState(false);
  const [showReportsDrawer, setShowReportsDrawer] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    monthlyIncome: '',
    savingsGoal: '',
    categories: []
  });

  // Sample expense categories - Colorful Scheme
  const expenseCategories = [
    { name: 'Housing', icon: MdAccountBalance, color: 'bg-blue-500', amount: 450, percentage: 25 },
    { name: 'Food', icon: MdReceipt, color: 'bg-green-500', amount: 320, percentage: 18 },
    { name: 'Transportation', icon: MdSchedule, color: 'bg-orange-500', amount: 180, percentage: 10 },
    { name: 'Books', icon: MdAnalytics, color: 'bg-purple-500', amount: 250, percentage: 14 },
    { name: 'Entertainment', icon: MdNotifications, color: 'bg-pink-500', amount: 200, percentage: 11 },
    { name: 'Health', icon: MdFlag, color: 'bg-red-500', amount: 150, percentage: 8 }
  ];

  // Sample AI insights
  const sampleInsights = [
    {
      type: 'urgent',
      title: 'Budget Alert',
      message: 'You\'re $200 over your monthly budget. Consider reducing entertainment expenses.',
      action: 'View Details',
      icon: MdNotifications
    },
    {
      type: 'success',
      title: 'Savings Goal',
      message: 'Great job! You\'ve saved $150 this month. You\'re on track for your $500 goal.',
      action: 'Track Progress',
      icon: MdFlag
    },
    {
      type: 'info',
      title: 'Optimization Tip',
      message: 'Switching to a meal plan could save you $100/month on food expenses.',
      action: 'Learn More',
      icon: MdAnalytics
    }
  ];

  const getTypeStyles = (type) => {
    const styles = {
      urgent: 'border-red-500/30 bg-red-500/5 text-red-300',
      success: 'border-green-500/30 bg-green-500/5 text-green-300',
      warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
      info: 'border-blue-500/30 bg-blue-500/5 text-blue-300'
    };
    return styles[type] || styles.info;
  };

  // Transaction form handlers
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await axiosInstance.post('/api/transactions', {
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        category: transactionForm.category,
        description: transactionForm.description,
        date: transactionForm.date
      });
      
      if (response.data.success) {
        // Reset form
        setTransactionForm({
          amount: '',
          category: '',
          description: '',
          type: 'expense',
          date: new Date().toISOString().split('T')[0]
        });
        
        setShowTransactionDrawer(false);
        
        // You could add a success notification here
        console.log('Transaction created successfully:', response.data.data);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      // You could add an error notification here
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionChange = (field, value) => {
    setTransactionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Budgeting handlers
  const handleBudgetingSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await axiosInstance.post('/api/budgets', {
        name: 'My Budget',
        description: 'Personal budget for student expenses',
        monthlyIncome: parseFloat(budgetForm.monthlyIncome),
        savingsGoal: parseFloat(budgetForm.savingsGoal),
        categories: budgetForm.categories
      });
      
      if (response.data.success) {
        setShowBudgetingDrawer(false);
        // Reset form
        setBudgetForm({
          monthlyIncome: '',
          savingsGoal: '',
          categories: []
        });
        
        console.log('Budget created successfully:', response.data.data);
      }
    } catch (error) {
      console.error('Error setting up budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = (field, value) => {
    setBudgetForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Analysis handler
  const handleQuickAnalysis = async () => {
    const income = parseFloat(budgetForm.monthlyIncome) || 0;
    const savingsGoal = parseFloat(budgetForm.savingsGoal) || 0;
    
    if (income > 0 && savingsGoal > 0) {
      try {
        // Generate a quick financial report
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        
        const response = await axiosInstance.post('/api/reports/generate', {
          reportType: 'monthly',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
        
        if (response.data.success) {
          const report = response.data.data;
          const savingsRate = (savingsGoal / income) * 100;
          const remainingForExpenses = income - savingsGoal;
          
          // Show analysis results with real data
          alert(`Quick Analysis:\n\nMonthly Income: $${income}\nSavings Goal: $${savingsGoal}\nSavings Rate: ${savingsRate.toFixed(1)}%\nRemaining for Expenses: $${remainingForExpenses}\n\nRecent Performance:\nTotal Income: $${report.summary.totalIncome}\nTotal Expenses: $${report.summary.totalExpenses}\nNet Income: $${report.summary.netIncome}\n\n${savingsRate > 30 ? '⚠️ High savings rate - consider reducing goal' : '✅ Healthy savings rate!'}`);
        }
      } catch (error) {
        console.error('Error generating analysis:', error);
        // Fallback to simple analysis
        const savingsRate = (savingsGoal / income) * 100;
        const remainingForExpenses = income - savingsGoal;
        
        alert(`Quick Analysis:\n\nMonthly Income: $${income}\nSavings Goal: $${savingsGoal}\nSavings Rate: ${savingsRate.toFixed(1)}%\nRemaining for Expenses: $${remainingForExpenses}\n\n${savingsRate > 30 ? '⚠️ High savings rate - consider reducing goal' : '✅ Healthy savings rate!'}`);
      }
    } else {
      alert('Please enter both monthly income and savings goal for analysis.');
    }
  };

  return (
    <div className="nr-dots-page min-h-screen text-white relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-full blur-2xl" />
      </div>
      
      <Navbar />

      {/* Hero Section - Transportation Style */}
      <section className="nr-hero-bg nr-hero-starry relative flex min-h-[70vh] items-center overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
          <div className="hero-orb absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[110rem] px-4 py-14 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start relative">
            {/* Financial Tools Section - Left */}
            <div className="lg:col-span-1 order-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300 backdrop-blur-md h-fit"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MdAccountBalance className="text-blue-400" />
                    </div>
                    Financial Tools
                  </h2>
                  <button 
                    onClick={() => setShowTransactionDrawer(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <MdAdd className="text-sm" />
                    Add Transaction
                  </button>
                </div>
                
                {/* Financial Tools Navigation */}
                <div className="space-y-2 mb-6">
                  {[
                    { id: 'tracking', label: 'Expense Tracking', icon: MdReceipt },
                    { id: 'goals', label: 'Savings Goals', icon: MdSavings },
                    { id: 'analysis', label: 'Budget Analysis', icon: MdAnalytics }
                  ].map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <IconComponent className="text-lg" />
                        <span className="font-medium text-sm">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Budget Section */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-white font-semibold mb-3">Quick Budget</h3>
                  <p className="text-white/60 text-sm mb-4">Set up your monthly budget and track spending automatically.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Monthly Budget</span>
                      <span className="text-blue-400 font-semibold">$2,000</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                    <div className="text-xs text-white/60">$1,500 spent this month</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Vertical Separator */}
            <div className="hidden lg:block absolute left-1/4 top-1/2 transform -translate-y-1/2 z-20">
              <div className="w-px h-96 bg-gradient-to-b from-transparent via-white/20 to-transparent relative">
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>

            {/* Main Hero Content */}
            <div className="lg:col-span-2 order-2 lg:order-2">
              {/* Simple, clean badges */}
              <div className="text-left transition-all duration-1000 opacity-100 translate-y-0">
                <div className="flex items-center justify-start gap-3 mb-8 flex-wrap">
                  <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    AI-Powered
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    Smart Budgeting
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    Student-Focused
                  </span>
                </div>
              </div>

              {/* Enhanced headline with better typography and animations */}
              <div className="text-left transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl">
                  Take control of your{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent animate-pulse">
                    financial future
                  </span>{" "}
                  with smart budgeting.
                  <br className="hidden md:block" />
                  <div className="block mt-2 text-2xl md:text-3xl lg:text-4xl h-12 flex items-center justify-start">
                    <div 
                      className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-xl font-semibold"
                      style={{
                        color: '#10b981',
                        textShadow: '0 0 6px #10b981, 0 0 12px #10b981',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      Student Finance Made Simple.
                    </div>
                  </div>
                </h1>
              </div>

              {/* Two Separate Input Boxes - Compact */}
              <div className="mt-8 max-w-3xl transition-all duration-1000 delay-400 opacity-100 translate-y-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Income Box */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <label className="text-white font-medium text-sm">Monthly Income</label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter your monthly income" 
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                    />
                  </div>

                  {/* Savings Goal Box */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <label className="text-white font-medium text-sm">Savings Goal</label>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Set your savings target" 
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                      />
                      <button 
                        onClick={handleQuickAnalysis}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium rounded-md transition-all duration-300 flex items-center gap-1 text-sm"
                      >
                        <MdAnalytics className="text-sm" />
                        Analyze
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact CTA buttons */}
              <div className="mt-6 flex flex-wrap gap-3 transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                <button 
                  onClick={() => setShowBudgetingDrawer(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold text-base rounded-lg transition-all duration-300 shadow-[0_4px_12px_rgba(255,153,0,.3)] hover:shadow-[0_6px_16px_rgba(255,153,0,.4)]"
                >
                  <div className="flex items-center gap-2">
                    <MdAccountBalance className="text-lg" />
                    Start Budgeting
                  </div>
                </button>
                <button 
                  onClick={() => setShowReportsDrawer(true)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-lg transition-all duration-300 border border-white/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <MdAnalytics className="text-lg" />
                    View Reports
                  </div>
                </button>
              </div>

              {/* Stats */}
              <div className="mt-8 flex flex-wrap gap-8 transition-all duration-1000 delay-600 opacity-100 translate-y-0">
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-1">$2,400</div>
                  <div className="text-sm text-white/60">Monthly Income</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">$600</div>
                  <div className="text-sm text-white/60">Monthly Savings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-400 mb-1">25%</div>
                  <div className="text-sm text-white/60">Savings Rate</div>
                </div>
              </div>
            </div>

            {/* Monthly Expenses Chart - Right */}
            <div className="lg:col-span-1 order-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300 backdrop-blur-md h-fit"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <MdAnalytics className="text-green-400" />
                    </div>
                    Monthly Expenses
                  </h3>
                  <div className="text-green-400 text-sm font-medium">+12%</div>
                </div>

                {/* ChatGPT's Optimized NewRun Chart */}
                <div className="bg-white/5 rounded-lg p-4 mb-4 h-56">
                  <Chart
                    type="bar"
                    data={{
                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [
                        // Bars FIRST - NewRun blue styling
                        {
                          type: 'bar',
                          label: 'Expenses',
                          data: [1200, 1350, 1100, 1450, 1300, 1550],
                          // NewRun blue gradient
                          backgroundColor: (ctx) => {
                            const { ctx: c, chartArea } = ctx.chart;
                            if (!chartArea) return 'rgba(59,130,246,.8)';
                            const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            g.addColorStop(0, 'rgba(59,130,246,.6)');   // blue-500 at bottom
                            g.addColorStop(0.5, 'rgba(59,130,246,.9)');  // blue-500 in middle
                            g.addColorStop(1, 'rgba(59,130,246,1)');     // blue-500 at top
                            return g;
                          },
                          borderColor: 'rgba(59,130,246,.3)',
                          borderWidth: 1,
                          borderSkipped: false,
                          borderRadius: 12, // More rounded like buttons
                          barThickness: 20,
                          categoryPercentage: 0.6,
                          barPercentage: 0.9,
                          order: 1, // <-- draw under the line
                        },

                        // Line LAST (so it overlaps bars) - Custom markers on top
                        {
                          type: 'line',
                          label: 'Savings',
                          data: [200, 150, 300, 100, 250, 200],
                          borderColor: '#ffffff',           // bold white line
                          borderWidth: 4,                  // thicker for bold effect
                          segment: { borderDash: [6, 3] }, // clean dashed look
                          tension: 0.25,
                          // hide default markers; plugin will draw them on top
                          pointRadius: 0,
                          pointHoverRadius: 0,
                          // make sure the line itself renders last
                          order: 100,
                          clip: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: 'index', intersect: false },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'bottom',
                          labels: {
                            color: 'rgba(255,255,255,.7)',
                            usePointStyle: true,
                            pointStyle: 'rect',
                            padding: 16,
                            font: { size: 12 },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,.9)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255,255,255,.15)',
                          borderWidth: 1,
                          cornerRadius: 8,
                          callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { color: 'rgba(255,255,255,.6)', font: { size: 11 } },
                        },
                        y: {
                          beginAtZero: true,
                          suggestedMax: 1600, // lets Chart.js breathe a bit
                          grid: { display: false }, // Remove grid lines
                          ticks: {
                            color: 'rgba(255,255,255,.6)',
                            font: { size: 11 },
                            callback: (v) => `$${v}`,
                          },
                        },
                      },
                      elements: {
                        point: { borderWidth: 2 }, // crisper markers
                      },
                      animation: {
                        duration: 700,
                        easing: 'easeOutCubic',
                      },
                    }}
                    plugins={[markersOnTop]}
                  />
                </div>

                {/* Chart Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Current Month</span>
                    <span className="text-white font-semibold">$1,550</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">vs Last Month</span>
                    <span className="text-green-400 font-semibold">+$200</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="text-xs text-white/60">75% of budget used</div>
                </div>

                {/* Expense Categories */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-white font-semibold text-sm mb-3">Top Categories</h4>
                  {[
                    { name: 'Housing', amount: 450, percentage: 25, color: 'bg-blue-500' },
                    { name: 'Food', amount: 320, percentage: 18, color: 'bg-green-500' },
                    { name: 'Transport', amount: 180, percentage: 10, color: 'bg-orange-500' }
                  ].map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                        <span className="text-white/80 text-xs">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-xs">${category.amount}</div>
                        <div className="text-white/60 text-xs">{category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <MdAttachMoney className="text-2xl text-green-400" />
            </div>
            <span className="text-green-400 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">$2,400</h3>
          <p className="text-white/60 text-sm">Monthly Income</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <MdReceipt className="text-2xl text-red-400" />
            </div>
            <span className="text-red-400 text-sm font-medium">+8%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">$1,800</h3>
          <p className="text-white/60 text-sm">Monthly Expenses</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <MdSavings className="text-2xl text-blue-400" />
            </div>
            <span className="text-blue-400 text-sm font-medium">25%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">$600</h3>
          <p className="text-white/60 text-sm">Monthly Savings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <MdPieChart className="text-2xl text-orange-400" />
            </div>
            <span className="text-orange-400 text-sm font-medium">75%</span>
          </div>
          <h3 className="text-2xl font-bold text-white">$4,200</h3>
          <p className="text-white/60 text-sm">Total Savings</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-3">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MdAnalytics className="text-green-400" />
              AI Financial Insights
            </h2>
            <div className="space-y-4">
              {sampleInsights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-green-500/50 hover:bg-white/8"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <IconComponent className="text-xl text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                        <p className="text-white/70 text-sm mb-3">{insight.message}</p>
                        <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
                          {insight.action} →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Expense Categories - Compact Grid */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MdPieChart className="text-green-400" />
                Expense Breakdown
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-white/60">Total: <span className="text-white font-semibold">$1,550</span></div>
                <div className="text-green-400">Remaining: <span className="font-semibold">$450</span></div>
              </div>
            </div>

            {/* Compact Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Header with Icon and Amount */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="text-white text-sm" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm group-hover:text-green-400 transition-colors">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">${category.amount}</div>
                        <div className="text-white/60 text-xs">{category.percentage}%</div>
                      </div>
                    </div>

                    {/* Compact Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-1.5 rounded-full ${category.color.replace('bg-', 'bg-gradient-to-r from-').replace('-500', '-400')} to-${category.color.split('-')[1]}-600`}
                      ></motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Financial Goals - Compact */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MdFlag className="text-green-400" />
              Goals
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white text-sm">Emergency Fund</h3>
                  <span className="text-green-400 text-xs">60%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="text-xs text-white/60 mt-1">$1,200 / $2,000</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white text-sm">Study Abroad</h3>
                  <span className="text-blue-400 text-xs">27%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '27%' }}></div>
                </div>
                <div className="text-xs text-white/60 mt-1">$800 / $3,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Quick Actions Button */}
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-8 left-8 z-50"
    >
      {!isQuickActionsOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsQuickActionsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-400 hover:to-blue-500 rounded-full shadow-2xl shadow-green-500/25 flex items-center justify-center group transition-all duration-300"
        >
          <motion.div
            animate={{ rotate: isQuickActionsOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <MdAccountBalance className="text-white text-xl" />
          </motion.div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
        </motion.button>
      )}

      {/* Expanded State - Quick Actions Menu */}
      <AnimatePresence>
        {isQuickActionsOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            className="w-80 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <MdAccountBalance className="text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Quick Actions</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <button
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Actions List */}
            <div className="p-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-500/20 to-blue-600/20 hover:from-green-500/30 hover:to-blue-600/30 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-green-500/30 hover:border-green-400/50 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                    <MdAdd className="text-green-400 text-sm" />
                  </div>
                  <span className="text-sm">Add Transaction</span>
                </div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <MdGpsFixed className="text-blue-400 text-sm" />
                  </div>
                  <span className="text-sm">Set Budget Goal</span>
                </div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                    <MdAnalytics className="text-orange-400 text-sm" />
                  </div>
                  <span className="text-sm">View Reports</span>
                </div>
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <MdTrendingUp className="text-purple-400 text-sm" />
                  </div>
                  <span className="text-sm">AI Recommendations</span>
                </div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    {/* Transaction Drawer */}
    <NewRunDrawer
      isOpen={showTransactionDrawer}
      onClose={() => setShowTransactionDrawer(false)}
      title="Add Transaction"
      subtitle="Track your income and expenses"
    >
      <div className="px-6 py-4">
        <form onSubmit={handleTransactionSubmit} className="space-y-5">
          {/* Transaction Type */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">Transaction Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleTransactionChange('type', 'expense')}
                className={`flex-1 py-2.5 px-4 rounded-lg border transition-all duration-200 ${
                  transactionForm.type === 'expense'
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MdTrendingDown className="text-base" />
                  <span className="font-medium text-sm">Expense</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTransactionChange('type', 'income')}
                className={`flex-1 py-2.5 px-4 rounded-lg border transition-all duration-200 ${
                  transactionForm.type === 'income'
                    ? 'border-green-500/50 bg-green-500/10 text-green-300'
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MdTrendingUp className="text-base" />
                  <span className="font-medium text-sm">Income</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 text-base">$</span>
              <input
                type="number"
                value={transactionForm.amount}
                onChange={(e) => handleTransactionChange('amount', e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Category</label>
            <select
              value={transactionForm.category}
              onChange={(e) => handleTransactionChange('category', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
              required
            >
              <option value="" className="bg-gray-800">Select a category</option>
              <option value="housing" className="bg-gray-800">Housing</option>
              <option value="food" className="bg-gray-800">Food</option>
              <option value="transportation" className="bg-gray-800">Transportation</option>
              <option value="books" className="bg-gray-800">Books & Supplies</option>
              <option value="entertainment" className="bg-gray-800">Entertainment</option>
              <option value="health" className="bg-gray-800">Health</option>
              <option value="other" className="bg-gray-800">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={transactionForm.description}
              onChange={(e) => handleTransactionChange('description', e.target.value)}
              placeholder="Enter transaction description"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={transactionForm.date}
              onChange={(e) => handleTransactionChange('date', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTransactionDrawer(false)}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/20 transition-all duration-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </NewRunDrawer>

    {/* Budgeting Setup Drawer */}
    <NewRunDrawer
      isOpen={showBudgetingDrawer}
      onClose={() => setShowBudgetingDrawer(false)}
      title="Set Up Your Budget"
      subtitle="Create a personalized budget plan"
    >
      <div className="px-6 py-4">
        <form onSubmit={handleBudgetingSubmit} className="space-y-5">
          {/* Monthly Income */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Monthly Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 text-base">$</span>
              <input
                type="number"
                value={budgetForm.monthlyIncome}
                onChange={(e) => handleBudgetChange('monthlyIncome', e.target.value)}
                placeholder="Enter your monthly income"
                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                required
              />
            </div>
          </div>

          {/* Savings Goal */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Monthly Savings Goal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 text-base">$</span>
              <input
                type="number"
                value={budgetForm.savingsGoal}
                onChange={(e) => handleBudgetChange('savingsGoal', e.target.value)}
                placeholder="Set your savings target"
                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                required
              />
            </div>
          </div>

          {/* Budget Categories */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">Budget Categories</label>
            <div className="space-y-2">
              {[
                { name: 'Housing', icon: MdAccountBalance, color: 'bg-blue-500' },
                { name: 'Food', icon: MdReceipt, color: 'bg-green-500' },
                { name: 'Transportation', icon: MdSchedule, color: 'bg-orange-500' },
                { name: 'Books & Supplies', icon: MdAnalytics, color: 'bg-purple-500' },
                { name: 'Entertainment', icon: MdNotifications, color: 'bg-pink-500' },
                { name: 'Health', icon: MdFlag, color: 'bg-red-500' }
              ].map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                    <div className={`p-1.5 rounded-lg ${category.color}`}>
                      <IconComponent className="text-white text-xs" />
                    </div>
                    <div className="flex-1">
                      <span className="text-white font-medium text-sm">{category.name}</span>
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBudgetingDrawer(false)}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/20 transition-all duration-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Setting up...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </NewRunDrawer>

    {/* Reports Drawer */}
    <NewRunDrawer
      isOpen={showReportsDrawer}
      onClose={() => setShowReportsDrawer(false)}
      title="Financial Reports"
      subtitle="View your spending patterns and insights"
    >
      <div className="space-y-6">
        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MdTrendingUp className="text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">Monthly Summary</h3>
            </div>
            <p className="text-white/60 text-sm">View your monthly spending breakdown and trends</p>
          </div>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MdPieChart className="text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Category Analysis</h3>
            </div>
            <p className="text-white/60 text-sm">See where your money goes by category</p>
          </div>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <MdSavings className="text-orange-400" />
              </div>
              <h3 className="text-white font-semibold">Savings Progress</h3>
            </div>
            <p className="text-white/60 text-sm">Track your savings goals and progress</p>
          </div>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MdAnalytics className="text-purple-400" />
              </div>
              <h3 className="text-white font-semibold">AI Insights</h3>
            </div>
            <p className="text-white/60 text-sm">Get personalized financial recommendations</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4">
          <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg transition-all duration-200 font-medium">
            Generate Full Report
          </button>
        </div>
      </div>
    </NewRunDrawer>
    </div>
  );
};

export default StudentFinance;