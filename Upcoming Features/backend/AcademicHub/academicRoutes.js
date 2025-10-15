const express = require('express');
const router = express.Router();
const { authenticateToken, getAuthUserId } = require('../utilities');
const Course = require('../models/course.model');
const Assignment = require('../models/assignment.model');
const StudyGroup = require('../models/studyGroup.model');
const AcademicCalendar = require('../models/academicCalendar.model');

// ==================== COURSE MANAGEMENT ====================

// Get all courses for user
router.get('/courses', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { semester, year, status } = req.query;
    
    let query = { userId };
    
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    
    const courses = await Course.find(query)
      .populate('userId', 'name email')
      .sort({ semester: -1, year: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

// Get single course
router.get('/courses/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const course = await Course.findOne({ _id: req.params.id, userId })
      .populate('userId', 'name email');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message
    });
  }
});

// Create new course
router.post('/courses', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const courseData = {
      ...req.body,
      userId
    };
    
    const course = new Course(courseData);
    await course.save();
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
});

// Update course
router.put('/courses/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
});

// Delete course
router.delete('/courses/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const course = await Course.findOneAndDelete({ _id: req.params.id, userId });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Also delete related assignments and calendar events
    await Assignment.deleteMany({ courseId: req.params.id });
    await AcademicCalendar.deleteMany({ courseId: req.params.id });
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
});

// ==================== ASSIGNMENT MANAGEMENT ====================

// Get all assignments for user
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { courseId, status, priority, dueDate } = req.query;
    
    let query = { userId };
    
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    // Date filtering
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }
    
    const assignments = await Assignment.find(query)
      .populate('courseId', 'name code')
      .sort({ dueDate: 1, priority: -1 });
    
    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
});

// Get upcoming assignments
router.get('/assignments/upcoming', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { days = 7 } = req.query;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    
    const assignments = await Assignment.find({
      userId,
      dueDate: { $lte: futureDate, $gte: new Date() },
      status: { $nin: ['completed', 'submitted'] }
    })
      .populate('courseId', 'name code color')
      .sort({ dueDate: 1 });
    
    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Error fetching upcoming assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming assignments',
      error: error.message
    });
  }
});

// Get overdue assignments
router.get('/assignments/overdue', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    
    const assignments = await Assignment.find({
      userId,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'submitted'] }
    })
      .populate('courseId', 'name code color')
      .sort({ dueDate: 1 });
    
    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Error fetching overdue assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue assignments',
      error: error.message
    });
  }
});

// Create new assignment
router.post('/assignments', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const assignmentData = {
      ...req.body,
      userId
    };
    
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    
    // Create calendar event for assignment
    await AcademicCalendar.create({
      userId,
      courseId: assignment.courseId,
      assignmentId: assignment._id,
      title: assignment.title,
      description: assignment.description,
      type: 'assignment',
      startDate: assignment.dueDate,
      priority: assignment.priority,
      color: '#ef4444'
    });
    
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message
    });
  }
});

// Update assignment
router.put('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Update calendar event if due date changed
    if (req.body.dueDate) {
      await AcademicCalendar.findOneAndUpdate(
        { assignmentId: req.params.id },
        { startDate: req.body.dueDate }
      );
    }
    
    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message
    });
  }
});

// Delete assignment
router.delete('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Delete related calendar event
    await AcademicCalendar.findOneAndDelete({ assignmentId: req.params.id });
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error.message
    });
  }
});

// ==================== STUDY GROUP MANAGEMENT ====================

// Get all study groups
router.get('/study-groups', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { courseId, status, isPublic } = req.query;
    
    let query = {};
    
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    
    // If not public, only show groups user is member of
    if (isPublic === 'false') {
      query['members.user'] = userId;
    }
    
    const studyGroups = await StudyGroup.find(query)
      .populate('courseId', 'name code')
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: studyGroups,
      count: studyGroups.length
    });
  } catch (error) {
    console.error('Error fetching study groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study groups',
      error: error.message
    });
  }
});

// Get user's study groups
router.get('/study-groups/my-groups', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    
    const studyGroups = await StudyGroup.find({
      $or: [
        { creator: userId },
        { 'members.user': userId, 'members.status': 'active' }
      ]
    })
      .populate('courseId', 'name code')
      .populate('creator', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: studyGroups,
      count: studyGroups.length
    });
  } catch (error) {
    console.error('Error fetching user study groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user study groups',
      error: error.message
    });
  }
});

// Create study group
router.post('/study-groups', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const studyGroupData = {
      ...req.body,
      creator: userId
    };
    
    const studyGroup = new StudyGroup(studyGroupData);
    
    // Add creator as admin member
    studyGroup.members.push({
      user: userId,
      role: 'admin',
      status: 'active'
    });
    
    await studyGroup.save();
    
    res.status(201).json({
      success: true,
      message: 'Study group created successfully',
      data: studyGroup
    });
  } catch (error) {
    console.error('Error creating study group:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create study group',
      error: error.message
    });
  }
});

// Join study group
router.post('/study-groups/:id/join', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }
    
    await studyGroup.addMember(userId);
    
    res.json({
      success: true,
      message: 'Successfully joined study group'
    });
  } catch (error) {
    console.error('Error joining study group:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Leave study group
router.post('/study-groups/:id/leave', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }
    
    await studyGroup.removeMember(userId);
    
    res.json({
      success: true,
      message: 'Successfully left study group'
    });
  } catch (error) {
    console.error('Error leaving study group:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ACADEMIC CALENDAR ====================

// Get calendar events
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { startDate, endDate, type } = req.query;
    
    let query = { userId };
    
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (type) query.type = type;
    
    const events = await AcademicCalendar.find(query)
      .populate('courseId', 'name code color')
      .populate('assignmentId', 'title type')
      .populate('studyGroupId', 'name')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: error.message
    });
  }
});

// Create calendar event
router.post('/calendar', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const eventData = {
      ...req.body,
      userId
    };
    
    const event = new AcademicCalendar(eventData);
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Calendar event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create calendar event',
      error: error.message
    });
  }
});

// ==================== DASHBOARD & ANALYTICS ====================

// Get academic dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    
    // Get current semester courses
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    let currentSemester = 'Fall';
    if (currentMonth >= 0 && currentMonth <= 4) currentSemester = 'Spring';
    else if (currentMonth >= 5 && currentMonth <= 7) currentSemester = 'Summer';
    
    const activeCourses = await Course.find({
      userId,
      status: 'enrolled',
      semester: currentSemester,
      year: currentYear
    });
    
    // Get upcoming assignments (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);
    
    const upcomingAssignments = await Assignment.find({
      userId,
      dueDate: { $lte: upcomingDate, $gte: new Date() },
      status: { $nin: ['completed', 'submitted'] }
    }).populate('courseId', 'name code color');
    
    // Get overdue assignments
    const overdueAssignments = await Assignment.find({
      userId,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'submitted'] }
    }).populate('courseId', 'name code color');
    
    // Get study groups user is part of
    const studyGroups = await StudyGroup.find({
      'members.user': userId,
      'members.status': 'active'
    }).populate('courseId', 'name code');
    
    // Get upcoming calendar events (next 7 days)
    const upcomingEvents = await AcademicCalendar.find({
      userId,
      startDate: { $lte: upcomingDate, $gte: new Date() },
      status: 'scheduled'
    }).populate('courseId', 'name code color');
    
    // Calculate GPA
    const completedCourses = await Course.find({
      userId,
      status: 'completed',
      grade: { $ne: null, $nin: ['P', 'NP', 'I', 'W'] }
    });
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    completedCourses.forEach(course => {
      const gradePoints = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
      };
      
      if (gradePoints[course.grade] !== undefined) {
        totalPoints += gradePoints[course.grade] * course.credits;
        totalCredits += course.credits;
      }
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
    
    res.json({
      success: true,
      data: {
        activeCourses: activeCourses.length,
        upcomingAssignments: upcomingAssignments.length,
        overdueAssignments: overdueAssignments.length,
        studyGroups: studyGroups.length,
        upcomingEvents: upcomingEvents.length,
        gpa: gpa,
        totalCredits: totalCredits,
        courses: activeCourses,
        assignments: upcomingAssignments,
        events: upcomingEvents
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router;







