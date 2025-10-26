import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdHealthAndSafety, MdCheckCircle, MdStar, MdLocalHospital, MdEmergency, MdSupport, MdShield } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const HealthInsurance = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userUniversity, setUserUniversity] = useState('');

  useEffect(() => {
    // Get user's university for personalized recommendations
    if (user?.onboardingData?.university) {
      setUserUniversity(user.onboardingData.university);
    }
  }, [user]);

  const plans = [
    {
      id: 'student-basic',
      name: 'Student Basic',
      price: 120,
      coverage: 'Essential',
      deductible: 500,
      features: ['Primary care visits', 'Emergency room coverage', 'Prescription drugs', 'Mental health services', 'Preventive care'],
      network: 'National',
      popular: false,
      description: 'Essential coverage for basic healthcare needs'
    },
    {
      id: 'student-comprehensive',
      name: 'Student Comprehensive',
      price: 180,
      coverage: 'Comprehensive',
      deductible: 250,
      features: ['Primary care visits', 'Emergency room coverage', 'Prescription drugs', 'Mental health services', 'Preventive care', 'Specialist visits', 'Dental coverage', 'Vision coverage'],
      network: 'National + International',
      popular: true,
      description: 'Complete coverage for all your healthcare needs'
    },
    {
      id: 'student-premium',
      name: 'Student Premium',
      price: 250,
      coverage: 'Premium',
      deductible: 100,
      features: ['Primary care visits', 'Emergency room coverage', 'Prescription drugs', 'Mental health services', 'Preventive care', 'Specialist visits', 'Dental coverage', 'Vision coverage', 'International coverage', 'Telemedicine', 'Wellness programs'],
      network: 'Global',
      popular: false,
      description: 'Premium coverage with international benefits'
    }
  ];

  const handleSelectPlan = async (plan) => {
    setIsLoading(true);
    try {
      // Simulate API call for plan selection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedPlan(plan);
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    try {
      // API call to enroll in health insurance
      const response = await axiosInstance.post('/services/health-insurance/enroll', {
        planId: selectedPlan.id,
        userId: user?.id,
        university: userUniversity,
        visaStatus: user?.onboardingData?.visaStatus
      });
      
      if (response.data.success) {
        alert('Health insurance enrollment initiated! You will receive your insurance card via email.');
      }
    } catch (error) {
      console.error('Error enrolling in health insurance:', error);
      alert('Error enrolling in health insurance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Navbar />
      <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <MdHealthAndSafety className="text-4xl text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Health Insurance</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive health insurance plans designed for students. Meet university requirements and protect your health.
            {userUniversity && (
              <span className="block mt-2 text-red-400">
                Compliant with {userUniversity} requirements
              </span>
            )}
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdShield className="text-3xl text-red-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">University Compliant</h3>
            <p className="text-gray-300">Meets all university health insurance requirements for international students</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdLocalHospital className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Campus Network</h3>
            <p className="text-gray-300">Access to campus health centers and nearby medical facilities</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">24/7 Support</h3>
            <p className="text-gray-300">Dedicated support team for claims and medical emergencies</p>
          </div>
        </motion.div>

        {/* Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedPlan?.id === plan.id
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/10 hover:border-white/20'
              } ${plan.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <MdStar className="mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-white mb-2">
                  ${plan.price}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                <div className="text-sm text-gray-400">
                  Deductible: ${plan.deductible} | Network: {plan.network}
                </div>
              </div>

              <div className="space-y-2 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  selectedPlan?.id === plan.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Enrollment Section */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-2xl p-8 border border-red-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Enroll in {selectedPlan.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Your health insurance will be active immediately upon enrollment.
                {userUniversity && ` This plan meets all ${userUniversity} requirements.`}
              </p>
              <button
                onClick={handleEnroll}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-red-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Enrolling...' : 'Enroll Now - $' + selectedPlan.price + '/month'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Emergency Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center mb-6">
            <MdEmergency className="text-3xl text-red-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Emergency Services</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">24/7 Emergency Hotline</h4>
              <p className="text-gray-300 mb-4">
                Access to emergency medical services and assistance in multiple languages.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Emergency medical evacuation</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">24/7 multilingual support</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Direct billing to insurance</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Campus Health Centers</h4>
              <p className="text-gray-300 mb-4">
                Easy access to campus health services and nearby medical facilities.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Campus health center visits</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Prescription drug coverage</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Mental health counseling</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default HealthInsurance;
