import React from 'react';
import { motion } from 'framer-motion';
import { 
  MdHome, 
  MdBathtub, 
  MdAttachMoney, 
  MdLocationOn, 
  MdPhone, 
  MdEmail,
  MdCheckCircle,
  MdStar,
  MdDirections,
  MdBed
} from 'react-icons/md';
import { getPropertyCardColors } from '../../utils/brandColors';

/**
 * Property Card Component for AI Drawer
 * Beautiful, interactive property cards that replace paragraph text
 * CEO-level UX with premium design and smooth animations
 */
const PropertyCard = ({ 
  property, 
  index, 
  isRecommended = false,
  onClick,
  showContactActions = true 
}) => {
  const {
    title = 'Property',
    price = 0,
    bedrooms = 0,
    bathrooms = 0,
    address = '',
    distanceFromUniversity = 0,
    furnished = false,
    contactName = '',
    contactPhone = '',
    contactEmail = '',
    recommendation = '',
    image = null,
    availability = 'available',
    rating = null,
    amenities = []
  } = property;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getAvailabilityColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'rented': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        delay: index * 0.1,
        ease: "easeOut"
      }
    },
    hover: { 
      scale: 1.02, 
      y: -4,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={() => onClick?.(property)}
      className={`
        relative group cursor-pointer
        ${getPropertyCardColors(isRecommended).bg}
        rounded-xl border ${getPropertyCardColors(isRecommended).border}
        p-4 transition-all duration-300
        ${getPropertyCardColors(isRecommended).hover} hover:shadow-lg hover:shadow-slate-500/10
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        w-full h-full
      `}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ⭐ RECOMMENDED
          </div>
        </div>
      )}

      {/* Property Image Placeholder */}
      <div className="relative mb-3">
        <div className="w-full h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center text-white/60">
              <MdHome className="text-3xl mb-2" />
              <span className="text-sm font-medium">{title}</span>
            </div>
          )}
        </div>
        
        {/* Availability Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold border ${getAvailabilityColor(availability)}`}>
          {availability?.toUpperCase() || 'AVAILABLE'}
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-2">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-white text-base leading-tight group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
          <div className="text-right">
            <div className="text-xl font-bold text-green-400">
              {formatPrice(price)}
            </div>
            <div className="text-xs text-white/60">per month</div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <MdLocationOn className="text-blue-400 flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>

        {/* Property Specs */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-white/60">
            <MdBed className="text-blue-400" />
            <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-white/60">
            <MdBathtub className="text-blue-400" />
            <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
          </div>
          {furnished && (
            <div className="flex items-center gap-1 text-green-400">
              <MdCheckCircle className="text-sm" />
              <span className="text-xs">Furnished</span>
            </div>
          )}
        </div>

        {/* Distance from Campus */}
        <div className="flex items-center gap-2 text-sm text-white/60">
          <MdDirections className="text-purple-400" />
          <span>{distanceFromUniversity} miles from campus</span>
        </div>

        {/* Rating (if available) */}
        {rating && (
          <div className="flex items-center gap-1">
            <MdStar className="text-yellow-400 text-sm" />
            <span className="text-sm text-white/70">{rating}/5</span>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 3).map((amenity, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* AI Recommendation */}
        {recommendation && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-blue-300 text-sm leading-relaxed">
                {recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Contact Actions */}
        {showContactActions && (contactPhone || contactEmail) && (
          <div className="flex gap-2 pt-3 border-t border-white/10">
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
              >
                <MdPhone className="text-sm" />
                Call
              </a>
            )}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                <MdEmail className="text-sm" />
                Email
              </a>
            )}
          </div>
        )}

        {/* Contact Info */}
        {contactName && (
          <div className="text-xs text-white/50 pt-2 border-t border-white/5">
            Contact: {contactName}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PropertyCard;
