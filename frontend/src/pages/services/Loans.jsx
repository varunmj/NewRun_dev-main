import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSchool, MdCheckCircle, MdStar, MdAttachMoney, MdSupport, MdSecurity, MdTimeline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Loans = () => {
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userVisaStatus, setUserVisaStatus] = useState('');

  useEffect(() => {
    if (user?.onboardingData?.visaStatus) {
      setUserVisaStatus(user.onboardingData.visaStatus);
    }
  }, [user]);

  const loans = [
    {
      id: 'student-loan-basic',
      name: 'Student Loan Basic',
      amount: 'Up to $10,000',
      rate: '4.5%',
      term: '10 years',
      features: ['No cosigner required', 'Flexible repayment', 'Deferred payments', 'Basic support'],
      requirements: 'Student ID, I-20, Bank statements',
      popular: true,
      description: 'Essential student loan for tuition and living expenses'
    },
    {
      id: 'student-loan-premium',
      name: 'Student Loan Premium',
      amount: 'Up to $25,000',
      rate: '3.9%',
      term: '15 years',
      features: ['No cosigner required', 'Flexible repayment', 'Deferred payments', 'Priority support', 'Rate discounts'],
      requirements: 'Student ID, I-20, Bank statements, Credit check',
      popular: false,
      description: 'Higher amount loan with better rates and terms'
    },
    {
      id: 'emergency-loan',
      name: 'Emergency Loan',
      amount: 'Up to $5,000',
      rate: '6.0%',
      term: '2 years',
      features: ['Quick approval', 'No cosigner required', 'Flexible repayment', '24/7 support'],
      requirements: 'Student ID, I-20, Emergency documentation',
      popular: false,
      description: 'Quick emergency funding for unexpected expenses'
    }
  ];

  const handleSelectLoan = async (loan) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedLoan(loan);
    } catch (error) {
      console.error('Error selecting loan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedLoan) return;
    
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/services/loans/apply', {
        loanId: selectedLoan.id,
        userId: user?.id,
        visaStatus: userVisaStatus,
        university: user?.onboardingData?.university
      });
      
      if (response.data.success) {
        alert('Loan application submitted! You will receive a response within 2-3 business days.');
      }
    } catch (error) {
      console.error('Error applying for loan:', error);
      alert('Error applying for loan. Please try again.');
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
            <MdSchool className="text-4xl text-green-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Student Loans</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Flexible student loan options designed for international students. No cosigner required.
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
            <MdSecurity className="text-3xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">No Cosigner Required</h3>
            <p className="text-gray-300">Get approved without needing a US citizen cosigner</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdAttachMoney className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Competitive Rates</h3>
            <p className="text-gray-300">Low interest rates designed for students</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Flexible Repayment</h3>
            <p className="text-gray-300">Deferred payments while in school</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {loans.map((loan, index) => (
            <div
              key={loan.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedLoan?.id === loan.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/10 hover:border-white/20'
              } ${loan.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {loan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <MdStar className="mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{loan.name}</h3>
                <p className="text-gray-400 mb-4">{loan.description}</p>
                <div className="text-3xl font-bold text-white mb-2">
                  {loan.amount}
                </div>
                <div className="text-sm text-gray-400">
                  Rate: {loan.rate} | Term: {loan.term}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {loan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-white mb-2">Requirements:</h4>
                <p className="text-gray-300 text-sm">{loan.requirements}</p>
              </div>

              <button
                onClick={() => handleSelectLoan(loan)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  selectedLoan?.id === loan.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedLoan?.id === loan.id ? 'Selected' : 'Select Loan'}
              </button>
            </div>
          ))}
        </motion.div>

        {selectedLoan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-8 border border-green-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Apply for {selectedLoan.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Start your loan application process. We'll guide you through every step.
              </p>
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Applying...' : 'Apply Now - ' + selectedLoan.amount}
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
            <MdTimeline className="text-3xl text-green-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Application Process</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Apply Online</h4>
              <p className="text-gray-300 text-sm">Complete the online application form</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Submit Documents</h4>
              <p className="text-gray-300 text-sm">Upload required documents and verification</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Approved</h4>
              <p className="text-gray-300 text-sm">Receive approval within 2-3 business days</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Receive Funds</h4>
              <p className="text-gray-300 text-sm">Funds disbursed to your bank account</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default Loans;
