const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  professor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    office: {
      type: String,
      trim: true
    }
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  semester: {
    type: String,
    required: true,
    enum: ['Fall', 'Spring', 'Summer', 'Winter']
  },
  year: {
    type: Number,
    required: true
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: String,
    endTime: String,
    room: String,
    building: String
  },
  description: {
    type: String,
    trim: true
  },
  syllabus: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed', 'dropped', 'waitlisted'],
    default: 'enrolled'
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP', 'I', 'W'],
    default: null
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
courseSchema.index({ userId: 1, status: 1 });
courseSchema.index({ userId: 1, semester: 1, year: 1 });
courseSchema.index({ code: 1 });

// Virtual for formatted schedule
courseSchema.virtual('formattedSchedule').get(function() {
  if (!this.schedule.days || this.schedule.days.length === 0) return 'TBA';
  
  const dayAbbr = this.schedule.days.map(day => day.substring(0, 3)).join(', ');
  const time = this.schedule.startTime && this.schedule.endTime 
    ? `${this.schedule.startTime}-${this.schedule.endTime}` 
    : 'TBA';
  const location = this.schedule.room ? ` (${this.schedule.room})` : '';
  
  return `${dayAbbr} ${time}${location}`;
});

// Virtual for GPA points
courseSchema.virtual('gpaPoints').get(function() {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'P': null, 'NP': null, 'I': null, 'W': null
  };
  
  return gradePoints[this.grade] || null;
});

// Method to calculate GPA
courseSchema.methods.calculateGPA = function() {
  if (this.gpaPoints !== null) {
    this.gpa = this.gpaPoints;
    return this.gpa;
  }
  return null;
};

module.exports = mongoose.model('Course', courseSchema);












