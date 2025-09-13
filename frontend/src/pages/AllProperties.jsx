// src/pages/AllProperties.jsx
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
        // not logged in is fine (public browse)
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  // Fetch all properties
  const getAllProperties = async () => {
    try {
      const response = await axiosInstance.get('/get-all-property');
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

  useEffect(() => {
    getAllProperties();
    getUserInfo();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white flex flex-col">
      <Navbar
        userInfo={userInfo}
        onSearchProperty={onSearchProperty}
        handleClearSearch={handleClearSearch}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-28">{/* pb-28 keeps cards away from footer */}
          {/* Roommate Finder CTA */}
          {/* <div className="flex justify-center">
            <button
              onClick={() => navigate('/roommate')}
              className="rounded-xl bg-[#2f64ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2958e3] transition"
            >
              Roommate Finder
            </button>
          </div> */}

          {allProperties.length > 0 ? (
            <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  readOnly={true}
                  onClick={() => navigate(`/property/${property._id}`)}
                />
              ))}
            </section>
          ) : (
            <div className="mt-10">
              <EmptyCard
                imgSrc={isSearch ? NoDataImg : AddPropertyImg}
                message={
                  isSearch
                    ? `Oops! No Properties found matching your search!`
                    : "Start creating your first property! Click the 'Add (+)' button to list your rental property with all the requested details. Let's get started!"
                }
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AllProperties;
