import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdSchool, 
  MdAssignment, 
  MdSchedule, 
  MdGrade, 
  MdGroup,
  MdBook,
  MdCalendarToday,
  MdNotifications,
  MdTrendingUp,
  MdLightbulb,
  MdAdd,
  MdRoute,
  MdLocationOn,
  MdEdit,
  MdDelete,
  MdCheck,
  MdClose,
  MdWarning,
  MdInfo
} from 'react-icons/md';
import Navbar from '../components/Navbar/Navbar';
import NewRunDrawer from '../components/ui/NewRunDrawer';
import axiosInstance from '../utils/axiosInstance';
import '../styles/newrun-hero.css';

/**
 * Academic Hub Dashboard
 * AI-powered academic planning and course management
 * CEO-level UX with comprehensive academic insights
 */
const AcademicHub = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [overdueAssignments, setOverdueAssignments] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [dashboardData, setDashboardData] = useState({});
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddStudyGroup, setShowAddStudyGroup] = useState(false);
  const [showJoinStudyGroup, setShowJoinStudyGroup] = useState(false);

  // Sample academic data
  const sampleCourses = [
    {
      id: 1,
      name: 'Computer Science 101',
      code: 'CS 101',
      professor: 'Dr. Smith',
      credits: 3,
      grade: 'A',
      schedule: 'MWF 10:00-11:00',
      room: 'Room 205',
      status: 'active'
    },
    {
      id: 2,
      name: 'Mathematics 201',
      code: 'MATH 201',
      professor: 'Dr. Johnson',
      credits: 4,
      grade: 'B+',
      schedule: 'TTH 2:00-3:30',
      room: 'Room 150',
      status: 'active'
    },
    {
      id: 3,
      name: 'English Literature',
      code: 'ENG 301',
      professor: 'Dr. Williams',
      credits: 3,
      grade: 'A-',
      schedule: 'MW 1:00-2:30',
      room: 'Room 320',
      status: 'active'
    }
  ];

  const sampleDeadlines = [
    {
      id: 1,
      title: 'Course Registration',
      date: '2024-01-15',
      type: 'urgent',
      description: 'Register for Spring 2024 courses'
    },
    {
      id: 2,
      title: 'Midterm Exam - CS 101',
      date: '2024-01-20',
      type: 'important',
      description: 'Computer Science 101 midterm exam'
    },
    {
      id: 3,
      title: 'Assignment Due - MATH 201',
      date: '2024-01-18',
      type: 'normal',
      description: 'Calculus homework assignment'
    }
  ];

  const sampleStudyGroups = [
    {
      id: 1,
      subject: 'Computer Science',
      members: 8,
      nextMeeting: 'Tomorrow 6:00 PM',
      location: 'Library Room 3',
      description: 'CS 101 study group for midterm preparation'
    },
    {
      id: 2,
      subject: 'Mathematics',
      members: 5,
      nextMeeting: 'Friday 4:00 PM',
      location: 'Math Lab',
      description: 'Calculus problem solving session'
    }
  ];

  const sampleInsights = [
    {
      type: 'urgent',
      title: 'Registration Deadline',
      message: 'Course registration closes in 3 days. Don\'t miss out on your preferred classes.',
      action: 'Register Now',
      icon: MdNotifications
    },
    {
      type: 'success',
      title: 'Great Progress',
      message: 'Your GPA has improved by 0.3 points this semester. Keep up the excellent work!',
      action: 'View Grades',
      icon: MdTrendingUp
    },
    {
      type: 'info',
      title: 'Study Group Available',
      message: 'A new CS 101 study group is forming. Join to improve your understanding.',
      action: 'Join Group',
      icon: MdGroup
    }
  ];

  const getTypeStyles = (type) => {
    const styles = {
      urgent: 'border-red-500/30 bg-red-500/5 text-red-300',
      important: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
      normal: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
      success: 'border-green-500/30 bg-green-500/5 text-green-300',
      info: 'border-blue-500/30 bg-blue-500/5 text-blue-300'
    };
    return styles[type] || styles.info;
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/academic/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
        setCourses(response.data.data.courses || []);
        setAssignments(response.data.data.assignments || []);
        setCalendarEvents(response.data.data.events || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/academic/courses');
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      const [upcomingRes, overdueRes] = await Promise.all([
        axiosInstance.get('/api/academic/assignments/upcoming'),
        axiosInstance.get('/api/academic/assignments/overdue')
      ]);
      
      if (upcomingRes.data.success) {
        setUpcomingAssignments(upcomingRes.data.data);
      }
      if (overdueRes.data.success) {
        setOverdueAssignments(overdueRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Fetch study groups
  const fetchStudyGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/academic/study-groups/my-groups');
      if (response.data.success) {
        setStudyGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching study groups:', error);
    }
  };

  // Fetch calendar events
  const fetchCalendarEvents = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const response = await axiosInstance.get(`/api/academic/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (response.data.success) {
        setCalendarEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  // Add new course
  const addCourse = async (courseData) => {
    try {
      const response = await axiosInstance.post('/api/academic/courses', courseData);
      if (response.data.success) {
        await fetchCourses();
        await fetchDashboardData();
        setShowAddCourse(false);
      }
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  // Add new assignment
  const addAssignment = async (assignmentData) => {
    try {
      const response = await axiosInstance.post('/api/academic/assignments', assignmentData);
      if (response.data.success) {
        await fetchAssignments();
        await fetchDashboardData();
        setShowAddAssignment(false);
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
    }
  };

  // Join study group
  const joinStudyGroup = async (groupId) => {
    try {
      const response = await axiosInstance.post(`/api/academic/study-groups/${groupId}/join`);
      if (response.data.success) {
        await fetchStudyGroups();
        setShowJoinStudyGroup(false);
      }
    } catch (error) {
      console.error('Error joining study group:', error);
    }
  };

  // Create study group
  const createStudyGroup = async (studyGroupData) => {
    try {
      const response = await axiosInstance.post('/api/academic/study-groups', studyGroupData);
      if (response.data.success) {
        await fetchStudyGroups();
        setShowJoinStudyGroup(false);
      }
    } catch (error) {
      console.error('Error creating study group:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    // Use sample data as fallback
    setCourses(sampleCourses);
    setStudyGroups(sampleStudyGroups);
    setAiInsights(sampleInsights);
    
    // Fetch real data
    fetchDashboardData();
    fetchCourses();
    fetchAssignments();
    fetchStudyGroups();
    fetchCalendarEvents();
  }, []);

  return (
    <div className="nr-dots-page min-h-screen text-white relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl" />
      </div>

      {/* Navbar at top (outside hero) */}
      <Navbar />
      {/* Hero Section - starts from top */}
      <section className="nr-hero-bg nr-hero-starry relative flex min-h-screen items-center overflow-hidden pt-0">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl" />
          <div className="hero-orb absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[110rem] px-4 py-14 pt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-left">
              {/* Simple, clean badges */}
              <div className="text-left transition-all duration-1000 opacity-100 translate-y-0">
                <div className="flex items-center justify-start gap-3 mb-8 flex-wrap">
                  <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    AI-powered planning
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    Smart scheduling
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-white/70 rounded-full bg-white/5 px-3 py-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Grade tracking
                  </span>
                </div>
              </div>

              {/* Enhanced headline */}
              <div className="text-left transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl">
                  Master your{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent animate-pulse">
                    academic journey
                  </span>{" "}
                  with smart planning.
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
                      Succeed smarter, not harder.
                    </div>
                  </div>
                </h1>
              </div>

              {/* Enhanced CTA section */}
              <div className="mt-8 text-left transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <button 
                    className="hero-cta-button group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-base font-bold text-black shadow-[0_12px_32px_rgba(255,153,0,.4)] hover:shadow-[0_16px_40px_rgba(255,153,0,.5)] hover:scale-105 transition-all duration-300 hover:from-orange-400 hover:to-orange-500" 
                    type="button"
                  >
                    <span>View Courses</span>
                    <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                      <div className="w-2 h-2 bg-black rounded-full" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                  </button>
                  
                  <button 
                    onClick={() => setShowJoinStudyGroup(true)}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                  >
                    <span className="text-lg">+</span>
                    Join Study Group
                  </button>
                </div>
              </div>

              {/* Academic Stats Capsule */}
              <div className="mt-8 flex justify-start transition-all duration-1000 delay-800 opacity-100 translate-y-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/80">
                    <span className="font-bold text-amber-400">{dashboardData.gpa || '3.7'} GPA</span>
                    <span className="ml-1">• {dashboardData.totalCredits || '10'} Credits</span>
                    <span className="ml-1">• {dashboardData.activeCourses || courses.length} Courses</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content - Academic Visual */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="p-8 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-3xl border border-orange-500/30 backdrop-blur-md">
                  <MdSchool className="text-8xl text-orange-400 mx-auto" />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <MdGrade className="text-green-400 text-sm" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <MdSchedule className="text-blue-400 text-sm" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Academic Overview - NewRun Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <MdSchool className="text-xl text-orange-400" />
              </div>
              <span className="text-orange-400 text-sm font-medium">+0.3</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{dashboardData.gpa || '3.7'}</h3>
            <p className="text-white/60 text-sm">Current GPA</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MdAssignment className="text-xl text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-medium">10</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{dashboardData.totalCredits || '10'}</h3>
            <p className="text-white/60 text-sm">Credits This Semester</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <MdSchedule className="text-xl text-green-400" />
              </div>
              <span className="text-green-400 text-sm font-medium">3</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{dashboardData.activeCourses || courses.length}</h3>
            <p className="text-white/60 text-sm">Active Courses</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <MdGroup className="text-xl text-orange-400" />
              </div>
              <span className="text-orange-400 text-sm font-medium">2</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{dashboardData.studyGroups || studyGroups.length}</h3>
            <p className="text-white/60 text-sm">Study Groups</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <MdLightbulb className="text-xl text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">AI Academic Insights</h2>
              </div>
              <div className="space-y-4">
                {sampleInsights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <IconComponent className="text-xl text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                          <p className="text-white/70 text-sm mb-3">{insight.message}</p>
                          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                            {insight.action} →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Current Courses */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <MdBook className="text-xl text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Current Courses</h2>
              </div>
              <div className="space-y-4">
                {sampleCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{course.name}</h3>
                          <span className="text-white/60 text-sm">{course.code}</span>
                          <span className="text-white/60 text-sm">• {course.credits} credits</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>Prof. {course.professor}</span>
                          <span>•</span>
                          <span>{course.schedule}</span>
                          <span>•</span>
                          <span>{course.room}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getGradeColor(course.grade)}`}>
                          {course.grade}
                        </div>
                        <div className="text-white/60 text-sm">Current Grade</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <MdCalendarToday className="text-xl text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
              </div>
              <div className="space-y-4">
                {upcomingAssignments.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <MdCalendarToday className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>No upcoming assignments</p>
                  </div>
                ) : (
                  upcomingAssignments.map((assignment, index) => (
                  <motion.div
                    key={assignment._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getTypeStyles(assignment.priority)} hover:bg-white/5 transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{assignment.title}</h3>
                        <p className="text-white/70 text-sm mb-2">{assignment.description || 'No description'}</p>
                        <div className="text-white/60 text-xs">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          {assignment.courseId && (
                            <span className="ml-2 text-blue-400">• {assignment.courseId.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/60 text-sm">
                          {assignment.priority === 'urgent' ? 'Due soon' : 
                           assignment.priority === 'high' ? 'High priority' : 'Normal priority'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Study Groups */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <MdGroup className="text-xl text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Study Groups</h2>
              </div>
              <div className="space-y-4">
                {sampleStudyGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{group.subject}</h3>
                      <span className="text-white/60 text-sm">{group.members} members</span>
                    </div>
                    <p className="text-white/70 text-sm mb-2">{group.description}</p>
                    <div className="flex items-center justify-between text-sm text-white/60">
                      <span>{group.nextMeeting}</span>
                      <span>{group.location}</span>
                    </div>
                  </motion.div>
                ))}
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
            className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-full shadow-2xl shadow-orange-500/25 flex items-center justify-center group transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: isQuickActionsOpen ? 45 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <MdSchedule className="text-white text-xl" />
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
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <MdSchedule className="text-orange-400" />
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
                  onClick={() => setShowAddCourse(true)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 hover:from-orange-500/30 hover:to-orange-600/30 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-orange-500/30 hover:border-orange-400/50 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                      <MdSchool className="text-orange-400 text-sm" />
                    </div>
                    <span className="text-sm">Register for Courses</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
                
                <motion.button 
                  onClick={() => setShowJoinStudyGroup(true)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                      <MdGroup className="text-green-400 text-sm" />
                    </div>
                    <span className="text-sm">Join Study Group</span>
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
                      <MdCalendarToday className="text-blue-400 text-sm" />
                    </div>
                    <span className="text-sm">View Academic Calendar</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                      <MdLightbulb className="text-purple-400 text-sm" />
                    </div>
                    <span className="text-sm">AI Study Recommendations</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add New Course</h3>
              <button 
                onClick={() => setShowAddCourse(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MdClose className="text-white/60" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const courseData = {
                name: formData.get('name'),
                code: formData.get('code'),
                professor: { name: formData.get('professor') },
                credits: parseInt(formData.get('credits')),
                semester: formData.get('semester'),
                year: parseInt(formData.get('year')),
                schedule: {
                  days: formData.get('days').split(',').map(d => d.trim()),
                  startTime: formData.get('startTime'),
                  endTime: formData.get('endTime'),
                  room: formData.get('room')
                }
              };
              addCourse(courseData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Course Name</label>
                <input 
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                  placeholder="e.g., Computer Science 101"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Course Code</label>
                  <input 
                    name="code"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                    placeholder="e.g., CS 101"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Credits</label>
                  <input 
                    name="credits"
                    type="number"
                    required
                    min="1"
                    max="6"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                    placeholder="3"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-2">Professor</label>
                <input 
                  name="professor"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Semester</label>
                  <select 
                    name="semester"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Year</label>
                  <input 
                    name="year"
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                    placeholder="2024"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Start Time</label>
                  <input 
                    name="startTime"
                    type="time"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">End Time</label>
                  <input 
                    name="endTime"
                    type="time"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-2">Days (comma separated)</label>
                <input 
                  name="days"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                  placeholder="Monday, Wednesday, Friday"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-2">Room</label>
                <input 
                  name="room"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-orange-400 focus:outline-none"
                  placeholder="Room 205"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Study Group Drawer */}
      <NewRunDrawer
        isOpen={showJoinStudyGroup}
        onClose={() => setShowJoinStudyGroup(false)}
        title="Join Study Group"
        icon={<MdGroup className="text-green-400" />}
      >
        <div className="space-y-6">
          {/* Available Study Groups */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Available Study Groups</h3>
            <div className="space-y-3">
              {studyGroups.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <MdGroup className="text-4xl mx-auto mb-3 opacity-50" />
                  <p>No study groups available</p>
                </div>
              ) : (
                studyGroups.map((group) => (
                  <div key={group._id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{group.name}</h4>
                        <p className="text-white/70 text-sm mb-2">{group.description}</p>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>👥 {group.memberCount || group.members?.length || 0} members</span>
                          <span>📚 {group.courseId?.name || 'General'}</span>
                          {group.schedule?.time && (
                            <span>🕐 {group.schedule.time}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => joinStudyGroup(group._id)}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create New Study Group */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Study Group</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const studyGroupData = {
                name: formData.get('name'),
                description: formData.get('description'),
                courseId: formData.get('courseId'),
                maxMembers: parseInt(formData.get('maxMembers')),
                location: {
                  type: formData.get('locationType'),
                  room: formData.get('room')
                },
                schedule: {
                  frequency: formData.get('frequency'),
                  days: formData.get('days').split(',').map(d => d.trim()),
                  time: formData.get('time')
                }
              };
              createStudyGroup(studyGroupData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Group Name</label>
                <input 
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                  placeholder="e.g., CS 101 Study Group"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-2">Description</label>
                <textarea 
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                  placeholder="What will you study together?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Course</label>
                  <select 
                    name="courseId"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course._id || course.id} value={course._id || course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Max Members</label>
                  <input 
                    name="maxMembers"
                    type="number"
                    min="2"
                    max="20"
                    defaultValue="10"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Location Type</label>
                  <select 
                    name="locationType"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  >
                    <option value="on_campus">On Campus</option>
                    <option value="online">Online</option>
                    <option value="off_campus">Off Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Room/Location</label>
                  <input 
                    name="room"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                    placeholder="e.g., Library Room 3"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Frequency</label>
                  <select 
                    name="frequency"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="daily">Daily</option>
                    <option value="as_needed">As Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Time</label>
                  <input 
                    name="time"
                    type="time"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-2">Days (comma separated)</label>
                <input 
                  name="days"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                  placeholder="Monday, Wednesday, Friday"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowJoinStudyGroup(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-400 hover:to-green-500 transition-all"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      </NewRunDrawer>
    </div>
  );
};

export default AcademicHub;
