import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdDescription, MdCheckCircle, MdStar, MdSchedule, MdSupport, MdDocumentScanner, MdTimeline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Visa = () => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userVisaStatus, setUserVisaStatus] = useState('');

  useEffect(() => {
    // Get user's current visa status for personalized recommendations
    if (user?.onboardingData?.visaStatus) {
      setUserVisaStatus(user.onboardingData.visaStatus);
    }
  }, [user]);

  const services = [
    {
      id: 'f1-application',
      name: 'F-1 Visa Application',
      price: 150,
      duration: '2-3 weeks',
      features: ['Document preparation', 'Interview guidance', 'Application review', 'Status tracking', 'Email support'],
      requirements: 'I-20, Passport, Financial documents',
      popular: true,
      description: 'Complete F-1 visa application assistance for new students'
    },
    {
      id: 'visa-renewal',
      name: 'Visa Renewal',
      price: 100,
      duration: '1-2 weeks',
      features: ['Document review', 'Renewal application', 'Status tracking', 'Priority support'],
      requirements: 'Current visa, I-20, Passport',
      popular: false,
      description: 'Renew your existing F-1 visa before expiration'
    },
    {
      id: 'opt-application',
      name: 'OPT Application',
      price: 200,
      duration: '3-4 weeks',
      features: ['OPT application prep', 'I-765 form assistance', 'Documentation support', 'Timeline guidance', 'Priority support'],
      requirements: 'F-1 visa, I-20, Degree completion',
      popular: false,
      description: 'Optional Practical Training application for work authorization'
    },
    {
      id: 'cpt-application',
      name: 'CPT Application',
      price: 120,
      duration: '1-2 weeks',
      features: ['CPT application prep', 'Employer verification', 'I-20 update', 'Documentation support'],
      requirements: 'F-1 visa, I-20, Job offer',
      popular: false,
      description: 'Curricular Practical Training for internship authorization'
    }
  ];

  const handleSelectService = async (service) => {
    setIsLoading(true);
    try {
      // Simulate API call for service selection
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
      // API call to start visa service
      const response = await axiosInstance.post('/services/visa/start', {
        serviceId: selectedService.id,
        userId: user?.id,
        currentVisaStatus: userVisaStatus,
        university: user?.onboardingData?.university
      });
      
      if (response.data.success) {
        alert('Visa service initiated! You will receive detailed instructions via email.');
      }
    } catch (error) {
      console.error('Error starting visa service:', error);
      alert('Error starting visa service. Please try again.');
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
            <MdDescription className="text-4xl text-blue-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Visa Services</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Expert guidance for all your visa needs. From F-1 applications to OPT and CPT assistance.
            {userVisaStatus && (
              <span className="block mt-2 text-blue-400">
                Current status: {userVisaStatus} - We'll customize our services for you
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
            <MdDocumentScanner className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Document Preparation</h3>
            <p className="text-gray-300">Complete document review and preparation assistance</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSchedule className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Timeline Management</h3>
            <p className="text-gray-300">Stay on track with personalized timelines and deadlines</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Expert Support</h3>
            <p className="text-gray-300">Dedicated immigration specialists available throughout the process</p>
          </div>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedService?.id === service.id
                  ? 'border-blue-500 bg-blue-500/10'
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
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 mb-4">{service.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-white">
                    ${service.price}
                  </div>
                  <div className="text-sm text-gray-400">
                    Duration: {service.duration}
                  </div>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedService?.id === service.id ? 'Selected' : 'Select Service'}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Service Start Section */}
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Start {selectedService.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Our immigration specialists will guide you through every step of the process.
                {userVisaStatus && ` We'll customize the service based on your current ${userVisaStatus} status.`}
              </p>
              <button
                onClick={handleStartService}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Service - $' + selectedService.price}
              </button>
            </div>
          </motion.div>
        )}

        {/* Timeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center mb-6">
            <MdTimeline className="text-3xl text-blue-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Application Timeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Document Review</h4>
              <p className="text-gray-300 text-sm">We review all your documents and prepare the application</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Application Submission</h4>
              <p className="text-gray-300 text-sm">Submit your application with our guidance</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Interview Prep</h4>
              <p className="text-gray-300 text-sm">Prepare for your visa interview with our experts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Approval & Follow-up</h4>
              <p className="text-gray-300 text-sm">Track your application and get your visa</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default Visa;
