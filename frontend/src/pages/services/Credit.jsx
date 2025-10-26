import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdCreditCard, MdCheckCircle, MdStar, MdTrendingUp, MdSupport, MdSecurity, MdTimeline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Credit = () => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userVisaStatus, setUserVisaStatus] = useState('');

  useEffect(() => {
    if (user?.onboardingData?.visaStatus) {
      setUserVisaStatus(user.onboardingData.visaStatus);
    }
  }, [user]);

  const services = [
    {
      id: 'credit-starter',
      name: 'Credit Starter Kit',
      price: 25,
      duration: 'Ongoing',
      features: ['Secured credit card', 'Credit monitoring', 'Educational resources', 'Monthly reports'],
      requirements: 'Bank account, Student ID',
      popular: true,
      description: 'Start building credit with a secured credit card'
    },
    {
      id: 'credit-builder',
      name: 'Credit Builder Program',
      price: 50,
      duration: '6 months',
      features: ['Secured credit card', 'Credit monitoring', 'Personalized tips', 'Score tracking', 'Priority support'],
      requirements: 'Bank account, Student ID, Income verification',
      popular: false,
      description: 'Comprehensive credit building program with guidance'
    },
    {
      id: 'credit-optimizer',
      name: 'Credit Optimizer',
      price: 75,
      duration: '12 months',
      features: ['Multiple credit products', 'Advanced monitoring', 'Personal advisor', 'Optimization strategies', '24/7 support'],
      requirements: 'Bank account, Student ID, Income verification, 6+ months history',
      popular: false,
      description: 'Advanced credit optimization for established students'
    }
  ];

  const handleSelectService = async (service) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedService(service);
    } catch (error) {
      console.error('Error selecting service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartService = async () => {
    if (!selectedService) return;
    
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/services/credit/start', {
        serviceId: selectedService.id,
        userId: user?.id,
        visaStatus: userVisaStatus
      });
      
      if (response.data.success) {
        alert('Credit building service initiated! You will receive your credit card within 5-7 business days.');
      }
    } catch (error) {
      console.error('Error starting credit service:', error);
      alert('Error starting credit service. Please try again.');
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
            <MdCreditCard className="text-4xl text-purple-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Credit Building</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build your US credit history with student-friendly credit products and expert guidance.
            {userVisaStatus && (
              <span className="block mt-2 text-purple-400">
                Tailored for {userVisaStatus} visa holders
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
            <MdSecurity className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">No Credit History Required</h3>
            <p className="text-gray-300">Start building credit even without existing credit history</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdTrendingUp className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Score Monitoring</h3>
            <p className="text-gray-300">Track your credit score progress with detailed analytics</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Expert Guidance</h3>
            <p className="text-gray-300">Personalized tips and strategies from credit experts</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedService?.id === service.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/20'
              } ${service.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <MdStar className="mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 mb-4">{service.description}</p>
                <div className="text-4xl font-bold text-white mb-2">
                  ${service.price}
                  <span className="text-lg text-gray-400">/month</span>
                </div>
                <div className="text-sm text-gray-400">
                  Duration: {service.duration}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-white mb-2">Requirements:</h4>
                <p className="text-gray-300 text-sm">{service.requirements}</p>
              </div>

              <button
                onClick={() => handleSelectService(service)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  selectedService?.id === service.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedService?.id === service.id ? 'Selected' : 'Select Service'}
              </button>
            </div>
          ))}
        </motion.div>

        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-purple-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Start {selectedService.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Begin building your credit history with our student-friendly credit products.
              </p>
              <button
                onClick={handleStartService}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Service - $' + selectedService.price + '/month'}
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
            <MdTimeline className="text-3xl text-purple-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Credit Building Timeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Month 1-3</h4>
              <p className="text-gray-300 text-sm">Establish credit history with secured card</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Month 4-6</h4>
              <p className="text-gray-300 text-sm">Build positive payment history</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Month 7-9</h4>
              <p className="text-gray-300 text-sm">Qualify for unsecured credit products</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Month 10-12</h4>
              <p className="text-gray-300 text-sm">Achieve good credit score (700+)</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default Credit;
