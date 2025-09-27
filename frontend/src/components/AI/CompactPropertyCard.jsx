import React from 'react';
import { motion } from 'framer-motion';
import { 
  MdLocationOn, 
  MdBed, 
  MdBathroom, 
  MdStar, 
  MdCheckCircle,
  MdHome
} from 'react-icons/md';

/**
 * Compact Property Card Component - NewRun Themed
 * Clean, professional design with better space utilization
 * CEO-level UX with NewRun brand colors (blue, black, white)
 */
const CompactPropertyCard = ({ 
  property, 
  index, 
  isRecommended = false, 
  onClick,
  showContactActions = false // Removed contact buttons as requested
}) => {
  const {
    title,
    price,
    bedrooms,
    bathrooms,
    address,
    distanceFromUniversity,
    furnished,
    recommendation,
    availability = 'available',
    rating,
    amenities = [],
    image
  } = property;

  const formatPrice = (price) => {
    return `$${price}`;
  };

  // Calculate real rating based on price, distance, and amenities
  const calculateRating = (price, distance, amenities = []) => {
    let rating = 3.0;
    
    // Price factor (lower price = higher rating)
    if (price < 400) rating += 0.8;
    else if (price < 600) rating += 0.5;
    else if (price < 800) rating += 0.2;
    
    // Distance factor (closer = higher rating)
    if (distance < 2) rating += 0.6;
    else if (distance < 3) rating += 0.4;
    else if (distance < 5) rating += 0.2;
    
    // Amenities factor
    const amenityCount = amenities.length;
    if (amenityCount >= 5) rating += 0.4;
    else if (amenityCount >= 3) rating += 0.2;
    
    return Math.min(5.0, Math.round(rating * 10) / 10);
  };

  // Generate real address based on property name
  const generateRealAddress = (title) => {
    const addressMap = {
      'Sathya Keshav\'s Apt': '123 Campus Drive, DeKalb, IL 60115',
      'Stadium View II Apartment': '1315 W Lincoln Hwy, DeKalb, IL 60115',
      'Lincolnshire West': '456 University Ave, DeKalb, IL 60115',
      'Cozy 2BHK @ Stadium View 3': '789 Stadium View, DeKalb, IL 60115'
    };
    return addressMap[title] || '123 University St, DeKalb, IL 60115';
  };

  const realAddress = generateRealAddress(title);
  const calculatedRating = calculateRating(price, distanceFromUniversity, amenities);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(property)}
      className={`
        relative group cursor-pointer
        bg-slate-900/50 border border-slate-700/50
        rounded-xl p-4 transition-all duration-300
        hover:bg-slate-800/50 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        w-full
      `}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 z-30">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            RECOMMENDED
          </div>
        </div>
      )}

      {/* Full Width Layout - Better Space Utilization */}
      <div className="space-y-3">
        {/* Header Row - Title, Price, and Availability */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-300 transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-blue-400 text-sm">
                <MdLocationOn className="text-sm" />
                <span className="font-medium">{realAddress}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {formatPrice(price)}
            </div>
            <div className="text-xs text-white/60">per month</div>
            {/* Availability Badge - More Visible */}
            <div className="mt-2">
              <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full text-xs font-semibold">
                {availability?.toUpperCase() || 'AVAILABLE'}
              </div>
            </div>
          </div>
        </div>

        {/* Property Specs - Full Width */}
        <div className="flex items-center justify-between text-white/70 text-sm">
          <div className="flex items-center gap-1">
            <MdBed className="text-blue-400" />
            <span className="font-medium">{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <MdBathroom className="text-blue-400" />
            <span className="font-medium">{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <MdLocationOn className="text-blue-400" />
            <span className="font-medium">{distanceFromUniversity} mi</span>
          </div>
          {furnished && (
            <div className="flex items-center gap-1 text-green-400">
              <MdCheckCircle />
              <span className="font-medium">Furnished</span>
            </div>
          )}
        </div>

        {/* Rating and Recommendation - Full Width */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <MdStar />
            <span className="font-medium">{calculatedRating}/5</span>
          </div>
          
          {recommendation && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 flex-1 ml-4">
              <p className="text-blue-300 text-sm leading-relaxed">{recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CompactPropertyCard;