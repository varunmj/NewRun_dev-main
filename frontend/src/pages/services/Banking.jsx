import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAccountBalance, MdCheckCircle, MdStar, MdSecurity, MdCreditCard, MdSupport, MdTrendingUp } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Banking = () => {
  const { user } = useAuth();
  const [selectedBank, setSelectedBank] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userVisaStatus, setUserVisaStatus] = useState('');

  useEffect(() => {
    // Get user's visa status for personalized recommendations
    if (user?.onboardingData?.visaStatus) {
      setUserVisaStatus(user.onboardingData.visaStatus);
    }
  }, [user]);

  const banks = [
    {
      id: 'chase-student',
      name: 'Chase College Checking',
      logo: '🏦',
      features: ['No monthly fee for students', 'No minimum balance', 'Free ATM withdrawals', 'Mobile banking app', 'No SSN required for F1 students'],
      requirements: 'Student ID + I-20',
      popular: true,
      description: 'Perfect for international students with no credit history'
    },
    {
      id: 'bank-of-america',
      name: 'Bank of America Advantage Banking',
      logo: '🏛️',
      features: ['Student discount', 'Free online banking', 'Debit card included', 'Mobile check deposit', 'International wire transfers'],
      requirements: 'Student ID + Passport',
      popular: false,
      description: 'Great for students who need international banking features'
    },
    {
      id: 'wells-fargo',
      name: 'Wells Fargo Student Checking',
      logo: '🏪',
      features: ['No monthly fee', 'Free checks', 'Online banking', 'Mobile app', 'Campus branch access'],
      requirements: 'Student ID + I-20',
      popular: false,
      description: 'Convenient campus locations and student-friendly services'
    }
  ];

  const handleSelectBank = async (bank) => {
    setIsLoading(true);
    try {
      // Simulate API call for bank selection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedBank(bank);
    } catch (error) {
      console.error('Error selecting bank:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedBank) return;
    
    setIsLoading(true);
    try {
      // API call to initiate bank account application
      const response = await axiosInstance.post('/services/banking/apply', {
        bankId: selectedBank.id,
        userId: user?.id,
        visaStatus: userVisaStatus,
        university: user?.onboardingData?.university
      });
      
      if (response.data.success) {
        alert('Bank account application initiated! You will receive instructions via email.');
      }
    } catch (error) {
      console.error('Error applying for bank account:', error);
      alert('Error applying for bank account. Please try again.');
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
            <MdAccountBalance className="text-4xl text-green-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Banking Solutions</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Open a US bank account without SSN requirements. Perfect for international students.
            {userVisaStatus && (
              <span className="block mt-2 text-green-400">
                Optimized for {userVisaStatus} visa holders
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
            <MdSecurity className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">No SSN Required</h3>
            <p className="text-gray-300">Open accounts with just your student ID and visa documents</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdCreditCard className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Student Benefits</h3>
            <p className="text-gray-300">No monthly fees, free ATM withdrawals, and student discounts</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Dedicated Support</h3>
            <p className="text-gray-300">24/7 support team familiar with international student needs</p>
          </div>
        </motion.div>

        {/* Banks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {banks.map((bank, index) => (
            <div
              key={bank.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedBank?.id === bank.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/10 hover:border-white/20'
              } ${bank.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {bank.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <MdStar className="mr-1" />
                    Recommended
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">{bank.logo}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{bank.name}</h3>
                <p className="text-gray-400 mb-4">{bank.description}</p>
              </div>

              <div className="space-y-2 mb-6">
                {bank.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-white mb-2">Requirements:</h4>
                <p className="text-gray-300 text-sm">{bank.requirements}</p>
              </div>

              <button
                onClick={() => handleSelectBank(bank)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  selectedBank?.id === bank.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedBank?.id === bank.id ? 'Selected' : 'Select Bank'}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Application Section */}
        {selectedBank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-8 border border-green-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Apply for {selectedBank.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                We'll guide you through the application process and help you gather all required documents.
                {userVisaStatus && ` Your ${userVisaStatus} visa status will be used to streamline the process.`}
              </p>
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Start Application'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Credit Building Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center mb-6">
            <MdTrendingUp className="text-3xl text-yellow-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Build Your Credit History</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Student Credit Cards</h4>
              <p className="text-gray-300 mb-4">
                Start building your US credit history with student-friendly credit cards
                that don't require a credit history or SSN.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">No credit history required</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Low credit limits to start</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Cashback rewards on campus purchases</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Credit Building Tips</h4>
              <p className="text-gray-300 mb-4">
                Learn how to build and maintain a good credit score while in school.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Pay bills on time</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Keep credit utilization low</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <MdCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm">Monitor your credit score regularly</span>
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

export default Banking;
