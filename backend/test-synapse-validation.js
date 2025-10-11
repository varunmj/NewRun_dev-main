/**
 * Test Synapse Completion Validation
 * Verify that the AI correctly detects Synapse completion status
 */

const calculateSynapseCompletion = require('./index.js').calculateSynapseCompletion;

// Test cases
const testCases = [
  {
    name: 'Empty Synapse',
    synapse: {},
    expected: 0
  },
  {
    name: 'Partially Complete Synapse',
    synapse: {
      culture: {
        primaryLanguage: 'English',
        home: { country: 'USA' }
      },
      lifestyle: {
        sleepPattern: 'night_owl'
      }
    },
    expected: 50 // 3 out of 6 fields = 50%
  },
  {
    name: 'Complete Synapse',
    synapse: {
      culture: {
        primaryLanguage: 'English',
        home: { country: 'USA', region: 'California' }
      },
      logistics: {
        moveInMonth: 'August',
        budgetMax: 1000,
        commuteMode: ['walking', 'biking']
      },
      lifestyle: {
        sleepPattern: 'night_owl',
        cleanliness: 8
      },
      habits: {
        diet: 'vegetarian',
        smoking: 'never'
      },
      pets: {
        hasPets: false
      }
    },
    expected: 100 // All fields completed
  }
];

console.log('🧪 Testing Synapse Completion Validation...\n');

testCases.forEach(testCase => {
  const result = calculateSynapseCompletion(testCase.synapse);
  const isCompleted = result >= 80;
  
  console.log(`Test: ${testCase.name}`);
  console.log(`Expected: ${testCase.expected}%`);
  console.log(`Actual: ${result}%`);
  console.log(`Completed: ${isCompleted ? 'YES' : 'NO'}`);
  console.log(`Status: ${result === testCase.expected ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});

console.log('\n🎯 Synapse Completion Validation Test Complete!');

