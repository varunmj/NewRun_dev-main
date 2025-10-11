const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateToken } = require('../utilities');

/**
 * Academic Hub API Routes
 * AI-powered academic planning and course management
 */

// Get user's academic overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Sample academic data (replace with real data from database)
    const academicOverview = {
      gpa: user.academicData?.gpa || 3.7,
      credits: user.academicData?.credits || 10,
      courses: user.academicData?.courses || [],
      deadlines: user.academicData?.deadlines || [],
      studyGroups: user.academicData?.studyGroups || []
    };

    res.json({ success: true, data: academicOverview });
  } catch (error) {
    console.error('Error fetching academic overview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get AI academic insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate AI insights based on user's academic data
    const insights = generateAcademicInsights(user.academicData);

    res.json({ success: true, insights });
  } catch (error) {
    console.error('Error generating academic insights:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add course
router.post('/courses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, code, professor, credits, schedule, room } = req.body;

    // Validate input
    if (!name || !code || !credits) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, code, and credits are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize academic data if it doesn't exist
    if (!user.academicData) {
      user.academicData = {
        courses: [],
        deadlines: [],
        studyGroups: [],
        gpa: 0,
        credits: 0
      };
    }

    // Add new course
    const newCourse = {
      name,
      code,
      professor: professor || '',
      credits: parseInt(credits),
      schedule: schedule || '',
      room: room || '',
      status: 'active',
      grade: null,
      createdAt: new Date()
    };

    user.academicData.courses.push(newCourse);
    user.academicData.credits += parseInt(credits);
    await user.save();

    res.json({ success: true, course: newCourse });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add deadline
router.post('/deadlines', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, date, type, description } = req.body;

    // Validate input
    if (!title || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and date are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize academic data if it doesn't exist
    if (!user.academicData) {
      user.academicData = { deadlines: [] };
    }

    // Add new deadline
    const newDeadline = {
      title,
      date: new Date(date),
      type: type || 'normal',
      description: description || '',
      completed: false,
      createdAt: new Date()
    };

    user.academicData.deadlines.push(newDeadline);
    await user.save();

    res.json({ success: true, deadline: newDeadline });
  } catch (error) {
    console.error('Error adding deadline:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get upcoming deadlines
router.get('/deadlines', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const user = await User.findById(userId);
    if (!user || !user.academicData?.deadlines) {
      return res.json({ success: true, deadlines: [] });
    }

    // Filter deadlines by date range
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));

    const upcomingDeadlines = user.academicData.deadlines
      .filter(deadline => 
        deadline.date >= now && 
        deadline.date <= futureDate && 
        !deadline.completed
      )
      .sort((a, b) => a.date - b.date);

    res.json({ success: true, deadlines: upcomingDeadlines });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Join study group
router.post('/study-groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, description, nextMeeting, location } = req.body;

    // Validate input
    if (!subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize academic data if it doesn't exist
    if (!user.academicData) {
      user.academicData = { studyGroups: [] };
    }

    // Add new study group
    const newStudyGroup = {
      subject,
      description: description || '',
      nextMeeting: nextMeeting || '',
      location: location || '',
      members: 1, // Start with 1 member (the user)
      createdAt: new Date()
    };

    user.academicData.studyGroups.push(newStudyGroup);
    await user.save();

    res.json({ success: true, studyGroup: newStudyGroup });
  } catch (error) {
    console.error('Error joining study group:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update course grade
router.put('/courses/:courseId/grade', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const { grade } = req.body;

    if (!grade) {
      return res.status(400).json({ 
        success: false, 
        message: 'Grade is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.academicData?.courses) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find and update course
    const course = user.academicData.courses.find(c => c._id.toString() === courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.grade = grade;
    course.updatedAt = new Date();

    // Recalculate GPA
    const coursesWithGrades = user.academicData.courses.filter(c => c.grade);
    if (coursesWithGrades.length > 0) {
      const totalPoints = coursesWithGrades.reduce((sum, c) => {
        const gradePoints = getGradePoints(c.grade);
        return sum + (gradePoints * c.credits);
      }, 0);
      
      const totalCredits = coursesWithGrades.reduce((sum, c) => sum + c.credits, 0);
      user.academicData.gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    }

    await user.save();

    res.json({ success: true, course, gpa: user.academicData.gpa });
  } catch (error) {
    console.error('Error updating course grade:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Generate AI academic insights
function generateAcademicInsights(academicData) {
  const insights = [];

  if (!academicData) {
    return [
      {
        type: 'info',
        title: 'Welcome to Academic Hub',
        message: 'Start adding your courses to get personalized academic insights.',
        action: 'Add First Course',
        priority: 'medium'
      }
    ];
  }

  // Deadline analysis
  if (academicData.deadlines && academicData.deadlines.length > 0) {
    const upcomingDeadlines = academicData.deadlines.filter(deadline => {
      const daysUntil = Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0 && !deadline.completed;
    });

    if (upcomingDeadlines.length > 0) {
      insights.push({
        type: 'urgent',
        title: 'Upcoming Deadlines',
        message: `You have ${upcomingDeadlines.length} deadline(s) due within a week. Don't miss them!`,
        action: 'View Deadlines',
        priority: 'high'
      });
    }
  }

  // GPA analysis
  if (academicData.gpa > 0) {
    if (academicData.gpa >= 3.5) {
      insights.push({
        type: 'success',
        title: 'Excellent GPA',
        message: `Your GPA of ${academicData.gpa.toFixed(2)} is excellent! Keep up the great work.`,
        action: 'View Grades',
        priority: 'medium'
      });
    } else if (academicData.gpa < 2.5) {
      insights.push({
        type: 'urgent',
        title: 'GPA Improvement Needed',
        message: `Your GPA of ${academicData.gpa.toFixed(2)} needs improvement. Consider joining study groups.`,
        action: 'Find Study Groups',
        priority: 'high'
      });
    }
  }

  // Study group suggestions
  if (academicData.courses && academicData.courses.length > 0) {
    insights.push({
      type: 'info',
      title: 'Study Group Available',
      message: 'A new study group for your courses is forming. Join to improve your understanding.',
      action: 'Join Study Group',
      priority: 'low'
    });
  }

  return insights;
}

// Helper function to convert letter grades to points
function getGradePoints(grade) {
  const gradeMap = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  return gradeMap[grade] || 0.0;
}

module.exports = router;
