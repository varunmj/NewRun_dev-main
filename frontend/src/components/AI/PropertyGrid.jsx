import React from 'react';
import { motion } from 'framer-motion';
import PropertyCard from '../Cards/PropertyCard';

/**
 * Property Grid Component for AI Drawer
 * Displays multiple property cards in a beautiful grid layout
 * CEO-level UX with smooth animations and responsive design
 */
const PropertyGrid = ({ 
  properties = [], 
  title = "🏠 Recommended Properties",
  subtitle = "AI-curated properties matching your preferences",
  onPropertyClick,
  maxDisplay = 6,
  showRecommendations = true
}) => {
  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/50 text-sm">No properties found</div>
      </div>
    );
  }

  const displayProperties = properties.slice(0, maxDisplay);
  const hasMore = properties.length > maxDisplay;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm">{subtitle}</p>
        <div className="mt-2 text-xs text-white/50">
          {properties.length} property{properties.length !== 1 ? 'ies' : ''} found
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayProperties.map((property, index) => (
          <PropertyCard
            key={property.id || index}
            property={property}
            index={index}
            isRecommended={showRecommendations && index === 0}
            onClick={onPropertyClick}
            showContactActions={true}
          />
        ))}
      </div>

      {/* Show More Indicator */}
      {hasMore && (
        <div className="text-center pt-4 border-t border-white/10">
          <div className="text-white/50 text-sm">
            +{properties.length - maxDisplay} more properties available
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            ${Math.round(properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length)}
          </div>
          <div className="text-xs text-white/60">Avg. Price</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">
            {Math.round(properties.reduce((sum, p) => sum + (p.distanceFromUniversity || 0), 0) / properties.length * 10) / 10}
          </div>
          <div className="text-xs text-white/60">Avg. Distance</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">
            {properties.filter(p => p.availability === 'available').length}
          </div>
          <div className="text-xs text-white/60">Available</div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyGrid;

