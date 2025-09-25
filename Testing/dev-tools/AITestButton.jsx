import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdScience, MdCheckCircle, MdError } from 'react-icons/md';
import NewRunAI from '../../services/NewRunAI';

/**
 * AI Test Button Component
 * Simple test to verify AI service is working
 */
const AITestButton = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testAI = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      // Test with simple user data
      const testUserData = {
        firstName: 'Test',
        lastName: 'User',
        onboardingData: {
          focus: 'Housing',
          arrivalDate: '2024-02-01',
          city: 'Test City',
          budgetRange: { max: 1000 }
        }
      };
      
      const testDashboardData = {
        propertiesStats: { averagePrice: 800 },
        propertiesCount: 5
      };
      
      const insights = await NewRunAI.generatePersonalizedInsights(testUserData, testDashboardData);
      
      setResult({
        success: true,
        message: `AI test successful! Generated ${insights.length} insights.`,
        insights: insights
      });
    } catch (error) {
      setResult({
        success: false,
        message: `AI test failed: ${error.message}`,
        error: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={testAI}
        disabled={testing}
        className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
          testing 
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
            : 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
        }`}
      >
        <div className="flex items-center gap-2">
          {testing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
          ) : (
            <MdScience className="text-lg" />
          )}
          <span className="text-sm font-medium">
            {testing ? 'Testing AI...' : 'Test AI'}
          </span>
        </div>
      </motion.button>
      
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-0 w-80 p-4 rounded-lg border bg-white/10 backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <MdCheckCircle className="text-green-400 text-lg flex-shrink-0 mt-0.5" />
            ) : (
              <MdError className="text-red-400 text-lg flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.success ? 'AI Test Successful!' : 'AI Test Failed'}
              </h4>
              <p className="text-white/70 text-xs mt-1">{result.message}</p>
              {result.insights && (
                <div className="mt-2">
                  <p className="text-white/60 text-xs">Generated insights:</p>
                  <ul className="text-white/50 text-xs mt-1 space-y-1">
                    {result.insights.map((insight, index) => (
                      <li key={index}>• {insight.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AITestButton;
