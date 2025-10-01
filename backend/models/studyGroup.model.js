const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    }
  }],
  maxMembers: {
    type: Number,
    default: 10,
    min: 2,
    max: 50
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String],
  location: {
    type: {
      type: String,
      enum: ['online', 'on_campus', 'off_campus'],
      default: 'on_campus'
    },
    address: String,
    room: String,
    building: String,
    onlineLink: String
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'as_needed'],
      default: 'weekly'
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    time: String,
    duration: Number, // in minutes
    timezone: {
      type: String,
      default: 'America/Chicago'
    }
  },
  studyTopics: [String],
  resources: [{
    name: String,
    url: String,
    type: String,
    description: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sessions: [{
    date: Date,
    topic: String,
    description: String,
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    notes: String,
    resources: [String]
  }],
  rules: [String],
  requirements: {
    minGPA: Number,
    yearLevel: [String],
    major: [String],
    other: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'full'],
    default: 'active'
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    }
  },
  statistics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    },
    memberSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
studyGroupSchema.index({ courseId: 1, status: 1 });
studyGroupSchema.index({ 'members.user': 1 });
studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ isPublic: 1, status: 1 });

// Virtual for member count
studyGroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for available spots
studyGroupSchema.virtual('availableSpots').get(function() {
  return this.maxMembers - this.memberCount;
});

// Virtual for is full
studyGroupSchema.virtual('isFull').get(function() {
  return this.memberCount >= this.maxMembers;
});

// Method to add member
studyGroupSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    if (existingMember.status === 'banned') {
      throw new Error('User is banned from this study group');
    }
    if (existingMember.status === 'active') {
      throw new Error('User is already a member');
    }
    // Reactivate member
    existingMember.status = 'active';
    existingMember.joinedAt = new Date();
  } else {
    // Check if group is full
    if (this.isFull) {
      throw new Error('Study group is full');
    }
    
    // Add new member
    this.members.push({
      user: userId,
      role: role,
      status: 'active'
    });
  }
  
  return this.save();
};

// Method to remove member
studyGroupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this study group');
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

// Method to update member role
studyGroupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this study group');
  }
  
  member.role = newRole;
  return this.save();
};

// Method to check if user is member
studyGroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
};

// Method to check if user is admin
studyGroupSchema.methods.isAdmin = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && 
    member.role === 'admin' && 
    member.status === 'active'
  );
};

module.exports = mongoose.model('StudyGroup', studyGroupSchema);

