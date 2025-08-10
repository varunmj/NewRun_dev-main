import React, { useEffect, useState } from 'react';
import PropertyCard from '../components/Cards/PropertyCard';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import EmptyCard from '../components/EmptyCard/EmptyCard';
import AddPropertyImg from '../assets/Images/add-proprty.svg';
import NoDataImg from '../assets/Images/no-data.svg';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

const AllProperties = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isSearch, setIsSearch] = useState(false);
  const navigate = useNavigate();

  // Fetch user information
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setUserInfo(null);
        console.log('User not logged in, allowing access to properties');
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  // Fetch all properties
  const getAllProperties = async () => {
    try {
      const response = await axiosInstance.get('/get-all-property');
      console.log(response.data);  // Log retrieved data for debugging
      if (response.data && response.data.properties) {
        setAllProperties(response.data.properties);
      }
    } catch (error) {
      console.error('An unexpected error occurred. Please try again.');
    }
  };

  // Search properties based on a query
  const onSearchProperty = async (query) => {
    try {
      const response = await axiosInstance.get('/search-properties', {
        params: { query },
      });
      if (response.data && response.data.properties) {
        setIsSearch(true);
        setAllProperties(response.data.properties);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Clear search and fetch all properties again
  const handleClearSearch = () => {
    setIsSearch(false);
    getAllProperties();
  };

  // Fetch properties and user info on component mount
  useEffect(() => {
    getAllProperties();
    getUserInfo();
  }, []);

  return (
    <div>
      <Navbar userInfo={userInfo} onSearchProperty={onSearchProperty} handleClearSearch={handleClearSearch} />
      
      <div className="container mx-auto">
        {/* Roommate Finder Button */}
        <div className="text-center my-4">
          <button
            onClick={() => navigate('/roommate')}
            className="btn-primary" // Assuming you have a primary button class in your CSS
          >
            Roommate Finder
          </button>
        </div>

        {allProperties.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {allProperties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                _id={property._id}
                title={property.title}
                date={property.createdOn}
                content={property.content}
                tags={property.tags}
                price={property.price}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                distanceFromUniversity={property.distanceFromUniversity}
                address={property.address}
                availabilityStatus={property.availabilityStatus}
                description={property.description}
                isFeatured={property.isFeatured}
                likesCount={property.likesCount}
                likedByUser={property.likedByUser}
                readOnly={true} // Makes the like button static (view-only)
                onClick={() => navigate(`/properties/${property._id}`)} // Navigate to PropertyDetails page with the property ID
              />
            ))}
          </div>
        ) : (
          <EmptyCard
            imgSrc={isSearch ? NoDataImg : AddPropertyImg}
            message={
              isSearch
                ? `Oops! No Properties found matching your search!`
                : "Start creating your first property! Click the 'Add (+)' button to list your rental property with all the requested details. Let's get started!"
            }
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AllProperties;
