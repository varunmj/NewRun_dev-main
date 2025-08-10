import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import Navbar from '../components/Navbar/Navbar';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'; // Heart icons for like feature
import default_property_image from '../assets/Images/default-property-image.jpg';
import { useGoogleMapsLoader } from '../utils/googleMapsLoader';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const initialCenter = {
  lat: 41.8781,
  lng: -87.6298,
};

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState(initialCenter);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const { isLoaded } = useGoogleMapsLoader();

  // Fetch current user info
  const fetchUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserId(response.data.user._id);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Fetch property details and geocode address to find coordinates
  const fetchPropertyDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/properties/${id}`);
      if (response.data && response.data.property) {
        setProperty(response.data.property);
        setLikesCount(response.data.property.likes?.length || 0); // Set initial likes count
        setLikedByUser(response.data.property.likes?.includes(userId)); // Check if the user has liked this property
        const address = response.data.property.address;
        if (address) {
          geocodeAddress(
            `${address.street}, ${address.city}, ${address.state}, ${address.zipCode}`
          );
        }
        setLoading(false);
      } else {
        setError('Property not found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError('An error occurred while fetching property details.');
      setLoading(false);
    }
  }, [id, userId]);

  // Initiate a conversation with the property owner
  const initiateConversation = async () => {
    try {
      const response = await axiosInstance.post('/conversations/initiate', {
        receiverId: property.userId._id, // Owner of the property
      });
      if (response.data.success) {
        navigate(`/messaging/${response.data.conversationId}`);
      }
    } catch (error) {
      console.error('Error initiating conversation:', error);
    }
  };

  // Toggle like for the property
  const toggleLike = async () => {
    try {
      const response = await axiosInstance.put(`/property/${id}/like`);
      setLikesCount(response.data.likes); // Update likes count from the server response
      setLikedByUser(!likedByUser); // Toggle liked status
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Geocode the address to get coordinates
  const geocodeAddress = (address) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        setCenter({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        console.error('Geocode was not successful:', status);
      }
    });
  };

  useEffect(() => {
    fetchPropertyDetails();
    fetchUserInfo(); // Fetch user info on component mount
  }, [fetchPropertyDetails]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const address = property.address || {};
  const contactInfo = property.contactInfo || {};

  // Modal handling for image viewer
  const openModal = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const showPreviousImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
    );
  };

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col space-y-4">
            {property.images && property.images.length > 0 ? (
              <>
                <div className="bg-gray-100 bg-opacity-50 p-4 rounded-lg shadow-lg">
                  <img
                    src={property.images[0]}
                    alt="Main Image"
                    className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                    onClick={() => openModal(0)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {property.images.slice(1).map((img, index) => (
                    <div key={index} className="bg-gray-100 bg-opacity-50 p-2 rounded-lg shadow-lg">
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 2}`}
                        className="w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => openModal(index + 1)}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-100 bg-opacity-50 p-4 rounded-lg shadow-lg">
                <img src={default_property_image} alt="Default" className="rounded-lg shadow-sm" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{property.title}</h1>
            <p className="text-2xl font-semibold text-gray-800">{`USD $${property.price}`}</p>
            <p className="text-lg text-gray-500">{property.description}</p>

            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <button
                className={`p-2 rounded-full ${likedByUser ? 'bg-red-500' : 'bg-gray-300'} transition`}
                onClick={toggleLike}
              >
                {likedByUser ? <AiFillHeart className="text-white" /> : <AiOutlineHeart className="text-red-500" />}
              </button>
              <span className="text-gray-600">{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>

              {/* Contact Button */}
              <button
                className="flex-grow bg-black text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition"
                onClick={initiateConversation}
              >
                Contact - {contactInfo.name}
              </button>
            </div>

            <div className="text-lg text-gray-500 mt-4">
              <div className="space-y-2">
                <p>
                  <strong className="text-gray-800">Available:</strong> <span className="text-green-600 text-xl">{property.availabilityStatus === 'available' ? 'Yes' : 'No'}</span>
                </p>
                <p>
                  <strong className="text-gray-800">Location:</strong> <span className="text-gray-600">{`${address.street || 'N/A'}, ${address.city || 'N/A'}, ${address.state || 'N/A'}, ${address.zipCode || 'N/A'}`}</span>
                </p>
                <p>
                  <strong className="text-gray-800">Distance from University:</strong> <span className="text-gray-600">{property.distanceFromUniversity || 'N/A'} miles</span>
                </p>
                <p>
                  <strong className="text-gray-800">Bedrooms:</strong> <span className="text-gray-600">{property.bedrooms || 'N/A'}</span>
                </p>
                <p>
                  <strong className="text-gray-800">Bathrooms:</strong> <span className="text-gray-600">{property.bathrooms || 'N/A'}</span>
                </p>
              </div>

              {/* Contact Information */}
              <div className="flex justify-between items-center space-x-8 mt-8">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">Contact Name</p>
                  <p className="text-gray-600">{contactInfo.name || 'N/A'}</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">Contact Phone</p>
                  <div className="flex items-center">
                    <FaWhatsapp className="text-green-500 mr-2" size={20} />
                    <p className="text-gray-600 whitespace-nowrap">{contactInfo.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-bold text-gray-800">Contact Email</p>
                  <div className="flex items-center">
                    <FaEnvelope className="text-blue-500 mr-2" size={20} />
                    <p className="text-gray-600 whitespace-nowrap">{contactInfo.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Map Component */}
              <div className="mt-8">
                {isLoaded ? (
                  <GoogleMap
                    key={center.lat + center.lng}
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={15}
                  >
                    <Marker position={center} />
                  </GoogleMap>
                ) : (
                  <p>Loading map...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for image viewer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <button className="absolute top-5 right-5 text-white" onClick={closeModal}>
            <MdClose size={35} />
          </button>
          <div className="relative w-2/3 max-w-5xl">
            <img src={property.images[currentImageIndex]} alt={`Image ${currentImageIndex + 1}`} className="w-full h-auto rounded-lg shadow-lg" />
            {/* Left Arrow */}
            <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full" onClick={showPreviousImage}>
              <MdChevronLeft size={35} />
            </button>
            {/* Right Arrow */}
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full" onClick={showNextImage}>
              <MdChevronRight size={35} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
