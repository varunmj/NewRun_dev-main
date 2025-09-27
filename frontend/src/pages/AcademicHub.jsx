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
  MdLocationOn
} from 'react-icons/md';
import Navbar from '../components/Navbar/Navbar';
import axiosInstance from '../utils/axiosInstance';
import '../styles/newrun-hero.css';

/**
 * Academic Hub Dashboard
 * AI-powered academic planning and course management
 * CEO-level UX with comprehensive academic insights
 */
const AcademicHub = () => {
  const [courses, setCourses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

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

  return (
    <div className="nr-dots-page min-h-screen text-white relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl" />
      </div>
      
      <Navbar />

      {/* Hero Section - NewRun Style */}
      <section className="nr-hero-bg nr-hero-starry relative flex min-h-[70vh] items-center overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl" />
          <div className="hero-orb absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[110rem] px-4 py-14 relative z-10">
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
                  
                  <button className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200">
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
                    <span className="font-bold text-amber-400">3.7 GPA</span>
                    <span className="ml-1">• 10 Credits</span>
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
            <h3 className="text-2xl font-bold text-white">3.7</h3>
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
            <h3 className="text-2xl font-bold text-white">10</h3>
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
            <h3 className="text-2xl font-bold text-white">3</h3>
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
            <h3 className="text-2xl font-bold text-white">2</h3>
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
                {sampleDeadlines.map((deadline, index) => (
                  <motion.div
                    key={deadline.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getTypeStyles(deadline.type)} hover:bg-white/5 transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{deadline.title}</h3>
                        <p className="text-white/70 text-sm mb-2">{deadline.description}</p>
                        <div className="text-white/60 text-xs">{deadline.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/60 text-sm">
                          {deadline.type === 'urgent' ? '3 days' : 
                           deadline.type === 'important' ? '5 days' : '7 days'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
    </div>
  );
};

export default AcademicHub;
