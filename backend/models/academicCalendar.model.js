const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    enum: ['assignment', 'exam', 'project', 'meeting', 'study_session', 'deadline', 'holiday', 'break', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  allDay: {
    type: Boolean,
    default: false
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  studyGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup'
  },
  location: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      required: true
    },
    time: {
      type: Number, // minutes before event
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  recurrence: {
    pattern: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1
    },
    daysOfWeek: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    endDate: Date,
    occurrences: Number
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['organizer', 'attendee', 'optional'],
      default: 'attendee'
    },
    status: {
      type: String,
      enum: ['accepted', 'declined', 'tentative', 'pending'],
      default: 'pending'
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [String],
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'course', 'assignment', 'study_group', 'imported'],
      default: 'manual'
    },
    externalId: String,
    lastModified: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
academicCalendarSchema.index({ userId: 1, startDate: 1 });
academicCalendarSchema.index({ userId: 1, type: 1 });
academicCalendarSchema.index({ courseId: 1 });
academicCalendarSchema.index({ startDate: 1, endDate: 1 });

// Virtual for duration in hours
academicCalendarSchema.virtual('durationHours').get(function() {
  if (!this.endDate) return null;
  const diffTime = this.endDate - this.startDate;
  return Math.round(diffTime / (1000 * 60 * 60) * 100) / 100;
});

// Virtual for days until event
academicCalendarSchema.virtual('daysUntilEvent').get(function() {
  const now = new Date();
  const eventDate = new Date(this.startDate);
  const diffTime = eventDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is upcoming
academicCalendarSchema.virtual('isUpcoming').get(function() {
  return this.daysUntilEvent >= 0 && this.status === 'scheduled';
});

// Virtual for is overdue
academicCalendarSchema.virtual('isOverdue').get(function() {
  return this.daysUntilEvent < 0 && this.status === 'scheduled';
});

// Method to check if event is today
academicCalendarSchema.methods.isToday = function() {
  const today = new Date();
  const eventDate = new Date(this.startDate);
  return today.toDateString() === eventDate.toDateString();
};

// Method to check if event is this week
academicCalendarSchema.methods.isThisWeek = function() {
  const today = new Date();
  const eventDate = new Date(this.startDate);
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return eventDate >= weekStart && eventDate <= weekEnd;
};

// Method to get formatted time
academicCalendarSchema.methods.getFormattedTime = function() {
  if (this.allDay) return 'All Day';
  
  const startTime = new Date(this.startDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (this.endDate) {
    const endTime = new Date(this.endDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${startTime} - ${endTime}`;
  }
  
  return startTime;
};

// Method to add attendee
academicCalendarSchema.methods.addAttendee = function(userId, role = 'attendee') {
  const existingAttendee = this.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );
  
  if (existingAttendee) {
    throw new Error('User is already an attendee');
  }
  
  this.attendees.push({
    user: userId,
    role: role,
    status: 'pending'
  });
  
  return this.save();
};

// Method to update attendee status
academicCalendarSchema.methods.updateAttendeeStatus = function(userId, status) {
  const attendee = this.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );
  
  if (!attendee) {
    throw new Error('User is not an attendee');
  }
  
  attendee.status = status;
  return this.save();
};

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);












