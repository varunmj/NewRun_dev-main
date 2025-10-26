import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAttachMoney, MdCheckCircle, MdStar, MdCalculate, MdSupport, MdDocumentScanner, MdTimeline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Tax = () => {
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
      id: 'basic-filing',
      name: 'Basic Tax Filing',
      price: 50,
      duration: '1-2 days',
      features: ['Form 1040-NR preparation', 'Document review', 'E-filing', 'Basic support'],
      requirements: 'W-2, 1099 forms, Passport',
      popular: true,
      description: 'Standard tax filing for international students'
    },
    {
      id: 'comprehensive-filing',
      name: 'Comprehensive Filing',
      price: 100,
      duration: '3-5 days',
      features: ['Form 1040-NR preparation', 'Document review', 'E-filing', 'Deduction optimization', 'Priority support', 'Audit protection'],
      requirements: 'All tax documents, Bank statements',
      popular: false,
      description: 'Complete tax filing with optimization and protection'
    },
    {
      id: 'multi-year-filing',
      name: 'Multi-Year Filing',
      price: 150,
      duration: '1 week',
      features: ['Multiple year filing', 'Back tax preparation', 'Penalty abatement', 'Comprehensive review', 'Priority support'],
      requirements: 'All tax documents for multiple years',
      popular: false,
      description: 'File multiple years of taxes at once'
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
      const response = await axiosInstance.post('/services/tax/start', {
        serviceId: selectedService.id,
        userId: user?.id,
        visaStatus: userVisaStatus
      });
      
      if (response.data.success) {
        alert('Tax service initiated! You will receive detailed instructions via email.');
      }
    } catch (error) {
      console.error('Error starting tax service:', error);
      alert('Error starting tax service. Please try again.');
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
            <MdAttachMoney className="text-4xl text-green-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Tax Services</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Expert tax filing services for international students. Maximize your refunds and stay compliant.
            {userVisaStatus && (
              <span className="block mt-2 text-green-400">
                Specialized for {userVisaStatus} visa holders
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
            <MdCalculate className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Expert Preparation</h3>
            <p className="text-gray-300">Professional tax preparation by certified specialists</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdDocumentScanner className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Document Review</h3>
            <p className="text-gray-300">Complete review of all your tax documents</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Audit Protection</h3>
            <p className="text-gray-300">Protection and support in case of IRS audits</p>
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
                  ? 'border-green-500 bg-green-500/10'
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
                    ? 'bg-green-600 text-white'
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
            className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-8 border border-green-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Start {selectedService.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Our tax specialists will help you maximize your refunds and stay compliant.
              </p>
              <button
                onClick={handleStartService}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Service - $' + selectedService.price}
              </button>
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Tax;
