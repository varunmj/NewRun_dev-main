import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdWork, MdCheckCircle, MdStar, MdSchool, MdSupport, MdTrendingUp, MdTimeline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Courses = () => {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userMajor, setUserMajor] = useState('');

  useEffect(() => {
    if (user?.onboardingData?.major) {
      setUserMajor(user.onboardingData.major);
    }
  }, [user]);

  const courses = [
    {
      id: 'academic-english',
      name: 'Academic English',
      price: 200,
      duration: '8 weeks',
      credits: '3',
      features: ['Writing skills', 'Speaking practice', 'Academic vocabulary', 'Online classes', 'Certificate'],
      requirements: 'Student ID, English proficiency test',
      popular: true,
      description: 'Improve your academic English skills for university success'
    },
    {
      id: 'cultural-adaptation',
      name: 'Cultural Adaptation',
      price: 150,
      duration: '6 weeks',
      credits: '2',
      features: ['Cultural awareness', 'Social skills', 'Campus life', 'Online classes', 'Certificate'],
      requirements: 'Student ID, International student status',
      popular: false,
      description: 'Learn to adapt to US culture and campus life'
    },
    {
      id: 'career-preparation',
      name: 'Career Preparation',
      price: 250,
      duration: '10 weeks',
      credits: '3',
      features: ['Resume building', 'Interview skills', 'Networking', 'Job search', 'Certificate'],
      requirements: 'Student ID, Academic standing',
      popular: false,
      description: 'Prepare for your career with professional development skills'
    },
    {
      id: 'major-specific',
      name: 'Major-Specific Course',
      price: 300,
      duration: '12 weeks',
      credits: '4',
      features: ['Subject expertise', 'Industry knowledge', 'Practical skills', 'Online classes', 'Certificate'],
      requirements: 'Student ID, Major declaration',
      popular: false,
      description: `Specialized course for ${userMajor || 'your major'} students`
    }
  ];

  const handleSelectCourse = async (course) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedCourse(course);
    } catch (error) {
      console.error('Error selecting course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/services/courses/enroll', {
        courseId: selectedCourse.id,
        userId: user?.id,
        major: userMajor,
        university: user?.onboardingData?.university
      });
      
      if (response.data.success) {
        alert('Course enrollment successful! You will receive course details via email.');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Error enrolling in course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Navbar />
      <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <MdWork className="text-4xl text-blue-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Academic Courses</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transferable credit courses designed to enhance your academic and professional skills.
            {userMajor && (
              <span className="block mt-2 text-blue-400">
                Specialized courses for {userMajor} students
              </span>
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSchool className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Transferable Credits</h3>
            <p className="text-gray-300">Earn credits that transfer to your university</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdTrendingUp className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Career Focused</h3>
            <p className="text-gray-300">Courses designed to boost your career prospects</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Expert Instructors</h3>
            <p className="text-gray-300">Learn from industry professionals and academics</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          {courses.map((course, index) => (
            <div
              key={course.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedCourse?.id === course.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20'
              } ${course.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {course.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <MdStar className="mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{course.name}</h3>
                <p className="text-gray-400 mb-4">{course.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-white">
                    ${course.price}
                  </div>
                  <div className="text-sm text-gray-400">
                    {course.duration} • {course.credits} credits
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {course.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-white mb-2">Requirements:</h4>
                <p className="text-gray-300 text-sm">{course.requirements}</p>
              </div>

              <button
                onClick={() => handleSelectCourse(course)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  selectedCourse?.id === course.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedCourse?.id === course.id ? 'Selected' : 'Select Course'}
              </button>
            </div>
          ))}
        </motion.div>

        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Enroll in {selectedCourse.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Start your academic journey with our expert-led courses.
                {userMajor && ` Perfect for ${userMajor} students.`}
              </p>
              <button
                onClick={handleEnroll}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Enrolling...' : 'Enroll Now - $' + selectedCourse.price}
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center mb-6">
            <MdTimeline className="text-3xl text-blue-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Course Timeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Enroll</h4>
              <p className="text-gray-300 text-sm">Complete enrollment and payment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Start Learning</h4>
              <p className="text-gray-300 text-sm">Access course materials and begin classes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Complete Course</h4>
              <p className="text-gray-300 text-sm">Finish assignments and assessments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Certificate</h4>
              <p className="text-gray-300 text-sm">Receive certificate and transfer credits</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default Courses;
