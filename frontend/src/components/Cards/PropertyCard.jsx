import React from 'react';
import moment from 'moment';
import { MdOutlinePushPin, MdCreate, MdDelete } from 'react-icons/md';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'; // Import heart icons
import { useLocation, useNavigate } from 'react-router-dom';

const PropertyCard = ({
  _id,
  title,
  date,
  content,
  tags,
  isPinned,
  price,
  bedrooms,
  bathrooms,
  distanceFromUniversity,
  address = {},
  availabilityStatus,
  description,
  isFeatured,
  likesCount,
  likedByUser,
  readOnly,
  onEdit,
  onDelete,
  onPinProperty,
  onToggleLike,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAllPropertyPage = location.pathname !== '/all-properties';

  const handleCardClick = () => {
    navigate(`/properties/${_id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`border rounded p-4 cursor-pointer ${isFeatured ? 'bg-gradient-to-r from-black to-green-600' : 'bg-gradient-to-r from-black to-blue-600'} hover:shadow-2xl transition-all ease-in-out`}
    >
      <div className="flex items-center justify-between p-3">
        <div>
          <h6 className="text-xl font-medium text-white">{title}</h6>
          <span className="text-xs text-slate-300">{moment(date).format('Do MMM YYYY')}</span>
        </div>
        {isAllPropertyPage && (
          <MdOutlinePushPin
            className={`icon-btn ${isPinned ? 'text-red-600' : 'text-white'}`}
            onClick={(e) => { e.stopPropagation(); onPinProperty(); }}
          />
        )}
      </div>

      <p className="text-sm text-white mt-2">Price: ${price}</p>
      <p className="text-sm text-white">Bedrooms: {bedrooms}</p>
      <p className="text-sm text-white">Bathrooms: {bathrooms}</p>
      <p className="text-sm text-white">Distance from University: {distanceFromUniversity} miles</p>

      <p className="text-sm text-white">
        Address: {address.street}, {address.city}, {address.state}, {address.zipCode}
      </p>

      <p className={`text-sm ${availabilityStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
        {availabilityStatus === 'available' ? 'Available' : 'Rented'}
      </p>

      <p className="text-xs text-slate-400 mt-2">
        {description ? description.slice(0, 60) + '...' : content.slice(0, 60)}
      </p>

      <div className="flex items-center gap-2 text-xs mt-2">
        {tags.map((item, index) => (
          <span key={index} className="px-3 py-1 text-white bg-red-600 rounded-md">
            #{item}
          </span>
        ))}
      </div>

      {/* Like Button */}
      <div className="flex items-center mt-3">
        <button
          className="flex items-center text-white"
          onClick={(e) => {
            e.stopPropagation();
            if (readOnly) {
              navigate(`/properties/${_id}`); // Navigate to details page if readOnly
            } else {
              onToggleLike();
            }
          }}
        >
          {likesCount > 0 ? (
            <AiFillHeart className="text-red-500 h-6 w-6 mr-1" />
          ) : (
            <AiOutlineHeart className="text-gray-500 h-6 w-6 mr-1" />
          )}
          <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
        </button>
      </div>

      {isAllPropertyPage && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <MdCreate className="icon-btn hover:text-green-600" onClick={(e) => { e.stopPropagation(); onEdit(); }} />
            <MdDelete className="icon-btn hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
