import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropertyCard from './PropertyCard';
import PropertyGrid from './PropertyGrid';

/**
 * AI Property Demo Component
 * Showcases the transformation from paragraph text to beautiful property cards
 * CEO-level demonstration of the new UX
 */
const AIPropertyDemo = () => {
  const [showOldFormat, setShowOldFormat] = useState(false);

  // Demo property data (matching your screenshot examples)
  const demoProperties = [
    {
      id: '1',
      title: 'Sathya Keshav\'s Apt',
      price: 300,
      bedrooms: 4,
      bathrooms: 2.5,
      address: '123 Campus Drive, DeKalb, IL 60115',
      distanceFromUniversity: 1.0,
      furnished: true,
      contactName: 'Sathya Keshav',
      contactPhone: '+1 779 276-2477',
      contactEmail: 'sathya@example.com',
      recommendation: 'At just $300, this 4-bedroom, 2.5-bath apartment is a steal. It\'s only 1 mile from campus, making it super convenient.',
      availability: 'available',
      rating: 4.8,
      amenities: ['Furnished', 'Parking', 'Laundry', 'A/C', 'Internet']
    },
    {
      id: '2',
      title: 'Stadium View II Apartment',
      price: 300,
      bedrooms: 2,
      bathrooms: 1,
      address: '1315 W Lincoln Hwy, DeKalb, IL 60115',
      distanceFromUniversity: 1.5,
      furnished: false,
      contactName: 'Dheeban Kumar',
      contactPhone: '123456789',
      contactEmail: 'dheebankumar@gmail.com',
      recommendation: 'Also priced at $300, it\'s slightly farther at 1.5 miles, but still a great option.',
      availability: 'available',
      rating: 4.5,
      amenities: ['Parking', 'Laundry', 'A/C']
    },
    {
      id: '3',
      title: 'LincolnShire West',
      price: 350,
      bedrooms: 2,
      bathrooms: 1,
      address: '456 University Ave, DeKalb, IL 60115',
      distanceFromUniversity: 0.2,
      furnished: true,
      contactName: 'Deepak Mohankumar Jayasree',
      contactPhone: '7799020982',
      contactEmail: 'deepak@example.com',
      recommendation: 'For $350, this 2-bedroom apartment is right on campus! It offers excellent proximity.',
      availability: 'available',
      rating: 4.9,
      amenities: ['Furnished', 'Parking', 'Gym', 'Pool', 'Internet']
    }
  ];

  const oldFormatText = `1. **Sathya Keshav's Apt**: At just $300, this 4-bedroom, 2.5-bath apartment is a steal. It's only 1 mile from campus, making it super convenient. You can reach out to Sathya Keshav at +1 779 276-2477 for more details.

2. **Stadium View II Apartment**: Also priced at $300, it's slightly farther at 1.5 miles, but still a great option. Contact Dheeban Kumar at 123456789 for inquiries.

3. **LincolnShire West**: For $350, this 2-bedroom apartment is right on campus! It offers excellent proximity, and you can check it out through the provided images or contact Deepak Mohankumar Jayasree at 7799020982.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            🚀 AI Property Cards Transformation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/70 mb-8"
          >
            From paragraph text to beautiful, interactive property cards
          </motion.p>
          
          {/* Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOldFormat(!showOldFormat)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
          >
            {showOldFormat ? '🎨 Show New Format' : '📝 Show Old Format'}
          </motion.button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Old Format */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              📝 Old Format (Paragraph Text)
            </h2>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
              <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {oldFormatText}
              </pre>
            </div>
            <div className="mt-4 text-sm text-white/60">
              ❌ Poor UX: Hard to scan, no visual hierarchy, no interactive elements
            </div>
          </motion.div>

          {/* New Format */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🎨 New Format (Property Cards)
            </h2>
            <PropertyGrid
              properties={demoProperties}
              title="🏠 AI-Recommended Properties"
              subtitle="Beautiful, interactive property cards with premium UX"
              onPropertyClick={(property) => {
                console.log('Property clicked:', property);
                alert(`Clicked on ${property.title}! This could open property details, contact form, or booking flow.`);
              }}
              maxDisplay={3}
              showRecommendations={true}
            />
            <div className="mt-4 text-sm text-green-400">
              ✅ Excellent UX: Visual hierarchy, interactive elements, contact actions, beautiful design
            </div>
          </motion.div>
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-white/5 rounded-2xl border border-white/10 p-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            🎯 CEO-Level UX Transformation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h4 className="text-lg font-semibold text-white mb-2">Visual Design</h4>
              <p className="text-white/70 text-sm">Beautiful cards with gradients, icons, and smooth animations</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">📱</div>
              <h4 className="text-lg font-semibold text-white mb-2">Interactive Elements</h4>
              <p className="text-white/70 text-sm">Click to call, email, and detailed property interactions</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h4 className="text-lg font-semibold text-white mb-2">Performance</h4>
              <p className="text-white/70 text-sm">Optimized rendering with Framer Motion animations</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="text-lg font-semibold text-white mb-2">Smart Recommendations</h4>
              <p className="text-white/70 text-sm">AI-powered property scoring and personalized suggestions</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="text-lg font-semibold text-white mb-2">Rich Data</h4>
              <p className="text-white/70 text-sm">Distance, amenities, ratings, and contact information</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h4 className="text-lg font-semibold text-white mb-2">CEO Vision</h4>
              <p className="text-white/70 text-sm">Premium UX that matches your high expectations</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIPropertyDemo;
