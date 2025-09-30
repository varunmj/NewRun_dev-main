const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['homework', 'quiz', 'exam', 'project', 'essay', 'lab', 'presentation', 'other'],
    default: 'homework'
  },
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'submitted', 'graded'],
    default: 'not_started'
  },
  points: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    earned: {
      type: Number,
      min: 0
    }
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP', 'I', 'W'],
    default: null
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  instructions: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  submissions: [{
    submittedAt: {
      type: Date,
      default: Date.now
    },
    content: String,
    attachments: [{
      name: String,
      url: String,
      type: String
    }],
    grade: String,
    feedback: String
  }],
  reminders: [{
    date: Date,
    message: String,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  estimatedTime: {
    type: Number, // in hours
    min: 0
  },
  actualTime: {
    type: Number, // in hours
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
assignmentSchema.index({ userId: 1, dueDate: 1 });
assignmentSchema.index({ userId: 1, status: 1 });
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ dueDate: 1, status: 1 });

// Virtual for days until due
assignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for urgency level
assignmentSchema.virtual('urgencyLevel').get(function() {
  const days = this.daysUntilDue;
  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days <= 1) return 'due_tomorrow';
  if (days <= 3) return 'due_soon';
  if (days <= 7) return 'due_this_week';
  return 'due_later';
});

// Virtual for completion percentage
assignmentSchema.virtual('completionPercentage').get(function() {
  if (this.points.earned !== undefined && this.points.total > 0) {
    return Math.round((this.points.earned / this.points.total) * 100);
  }
  return null;
});

// Method to check if assignment is overdue
assignmentSchema.methods.isOverdue = function() {
  return new Date() > this.dueDate && this.status !== 'completed' && this.status !== 'submitted';
};

// Method to get time remaining
assignmentSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  
  if (diffTime < 0) return 'Overdue';
  
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

module.exports = mongoose.model('Assignment', assignmentSchema);
