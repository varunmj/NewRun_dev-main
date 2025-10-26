import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdPhone, MdCheckCircle, MdStar, MdLocationOn, MdSpeed, MdDataUsage, MdSupport } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const SimCards = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState('');

  useEffect(() => {
    // Get user's campus location for personalized recommendations
    if (user?.onboardingData?.city) {
      setUserLocation(user.onboardingData.city);
    }
  }, [user]);

  const plans = [
    {
      id: 'student-basic',
      name: 'Student Basic',
      price: 25,
      data: '5GB',
      minutes: 'Unlimited',
      text: 'Unlimited',
      features: ['5G/4G LTE', 'Campus WiFi', 'International calling', '24/7 support'],
      popular: false,
      description: 'Perfect for light users and budget-conscious students'
    },
    {
      id: 'student-plus',
      name: 'Student Plus',
      price: 45,
      data: '15GB',
      minutes: 'Unlimited',
      text: 'Unlimited',
      features: ['5G/4G LTE', 'Campus WiFi', 'International calling', 'Hotspot included', 'Premium support'],
      popular: true,
      description: 'Most popular choice for active students'
    },
    {
      id: 'student-premium',
      name: 'Student Premium',
      price: 65,
      data: 'Unlimited',
      minutes: 'Unlimited',
      text: 'Unlimited',
      features: ['5G/4G LTE', 'Campus WiFi', 'International calling', 'Hotspot included', 'Premium support', 'Streaming optimization'],
      popular: false,
      description: 'For heavy data users and content creators'
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

  const handleActivate = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    try {
      // API call to activate SIM card
      const response = await axiosInstance.post('/services/sim-cards/activate', {
        planId: selectedPlan.id,
        userLocation: userLocation,
        userId: user?.id
      });
      
      if (response.data.success) {
        // Show success message or redirect
        alert('SIM card activation initiated! You will receive it within 2-3 business days.');
      }
    } catch (error) {
      console.error('Error activating SIM card:', error);
      alert('Error activating SIM card. Please try again.');
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
            <MdPhone className="text-4xl text-blue-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">SIM Cards</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get connected instantly with our pre-activated SIM cards designed specifically for students.
            {userLocation && (
              <span className="block mt-2 text-blue-400">
                Optimized for {userLocation} area coverage
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
            <MdSpeed className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">5G Ready</h3>
            <p className="text-gray-300">Ultra-fast 5G and 4G LTE coverage on all major networks</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdLocationOn className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Campus Optimized</h3>
            <p className="text-gray-300">Enhanced coverage and WiFi integration for your university</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">24/7 Support</h3>
            <p className="text-gray-300">Dedicated student support team available anytime</p>
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
                  ? 'border-blue-500 bg-blue-500/10'
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
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Data</span>
                  <span className="text-white font-semibold">{plan.data}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Minutes</span>
                  <span className="text-white font-semibold">{plan.minutes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Text</span>
                  <span className="text-white font-semibold">{plan.text}</span>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Activation Section */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Activate Your {selectedPlan.name} Plan?
              </h3>
              <p className="text-gray-300 mb-6">
                Your SIM card will be pre-activated and shipped to your campus address.
                {userLocation && ` We'll optimize it for ${userLocation} coverage.`}
              </p>
              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Activating...' : 'Activate Now - $' + selectedPlan.price + '/month'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Why Choose NewRun SIM Cards?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Student-First Design</h4>
              <p className="text-gray-300">
                Our plans are specifically designed for student needs, with flexible data options,
                international calling, and budget-friendly pricing.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Campus Integration</h4>
              <p className="text-gray-300">
                Seamless integration with your university's WiFi network and special rates
                for campus services and events.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">No Credit Check</h4>
              <p className="text-gray-300">
                Perfect for international students - no SSN or credit history required.
                Just your student ID and you're ready to go.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Easy Setup</h4>
              <p className="text-gray-300">
                Pre-activated SIM cards arrive ready to use. Just insert and start calling,
                texting, and browsing immediately.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default SimCards;
