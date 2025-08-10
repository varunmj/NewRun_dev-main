import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import Navbar from '../components/Navbar/Navbar';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import default_item_image from '../assets/Images/default-item-image.jpg';
import { useGoogleMapsLoader } from '../utils/googleMapsLoader';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const initialCenter = {
  lat: 41.8781, // Default Latitude (Chicago)
  lng: -87.6298, // Default Longitude (Chicago)
};

const MarketplaceItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [userId, setUserId] = useState(null);
  const [center, setCenter] = useState(initialCenter);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isLoaded } = useGoogleMapsLoader();

  // Fetch current user info
  const fetchUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserId(response.data.user._id);
      }
    } catch (error) {
      console.error('Unexpected error fetching user info:', error);
    }
  };

  // Fetch item details and geocode address
  const fetchItemDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/marketplace/item/${id}`);
      if (response.data && response.data.item) {
        setItem(response.data.item);

        // Geocode the item's address for map if address is available
        const address = response.data.item.address;
        if (address) {
          geocodeAddress(`${address.street}, ${address.city}, ${address.state}, ${address.zipCode}`);
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  }, [id]);

  // Geocode address to get coordinates
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

  // Initiate a conversation with the item's owner
  const initiateConversation = async () => {
    try {
      const response = await axiosInstance.post('/conversations/initiate', {
        receiverId: item.userId._id, // Owner of the item
      });
      if (response.data.success) {
        navigate(`/messaging/${response.data.conversationId}`);
      }
    } catch (error) {
      console.error('Error initiating conversation:', error);
    }
  };

  useEffect(() => {
    fetchItemDetails();
    fetchUserInfo(); // Fetch user info on component mount
  }, [fetchItemDetails]);

  if (!item) return <p>Loading...</p>;

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
      prevIndex === 0 ? item.images.length - 1 : prevIndex - 1
    );
  };

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === item.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="flex flex-col space-y-4">
            {item.images && item.images.length > 0 ? (
              <>
                <div className="bg-gray-100 bg-opacity-50 p-4 rounded-lg shadow-lg">
                  <img
                    src={item.images[0]}
                    alt="Main Image"
                    className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                    onClick={() => openModal(0)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {item.images.slice(1).map((img, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 bg-opacity-50 p-2 rounded-lg shadow-lg"
                    >
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
                <img
                  src={default_item_image}
                  alt="Default"
                  className="rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{item.title}</h1>
            <p className="text-2xl font-semibold text-gray-800">
              {item.price === 0 ? 'Free' : `USD ${item.price}`}
            </p>
            <p className="text-lg text-gray-500">{item.description}</p>

            <button
              className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition"
              onClick={initiateConversation}
            >
              Contact - {item.userId?.firstName || 'Seller'}
            </button>

            <div className="text-lg text-gray-500 mt-4">
              <p><strong>Condition:</strong> {item.condition}</p>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Available:</strong> {item.isAvailable ? 'Yes' : 'No'}</p>
            </div>

            <div className="flex justify-between items-center space-x-8 mt-8">
              <div className="flex-1">
                <p className="font-bold text-gray-800">Seller Name</p>
                <p className="text-gray-600">{item.userId?.firstName} {item.userId?.lastName}</p>
              </div>

              <div className="flex-1">
                <p className="font-bold text-gray-800">Contact Phone</p>
                <div className="flex items-center">
                  <FaWhatsapp className="text-green-500 mr-2" size={20} />
                  <p className="text-gray-600">{item.contactInfo?.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex-1 ml-4">
                <p className="font-bold text-gray-800">Contact Email</p>
                <div className="flex items-center">
                  <FaEnvelope className="text-blue-500 mr-2" size={20} />
                  <p className="text-gray-600">{item.contactInfo?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Map Section */}
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={15}
              >
                <Marker position={center} />
              </GoogleMap>
            )}
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
            <img src={item.images[currentImageIndex]} alt={`Image ${currentImageIndex + 1}`} className="w-full h-auto rounded-lg shadow-lg" />
            <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full" onClick={showPreviousImage}>
              <MdChevronLeft size={35} />
            </button>
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full" onClick={showNextImage}>
              <MdChevronRight size={35} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceItemDetails;
