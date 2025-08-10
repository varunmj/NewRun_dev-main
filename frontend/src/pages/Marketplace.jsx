import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import ItemCard from '../components/Cards/ItemCard';
import axiosInstance from '../utils/axiosInstance';
import Navbar from '../components/Navbar/Navbar';
import SearchOverlay from '../components/SearchBar/SearchOverlay';
import docsLeft from '../assets/Images/docs-left.png';
import docsRight from '../assets/Images/docs-right.png';
import './marketplace.css';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch user info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setUserInfo(null);
        console.log('User not logged in, allowing access to Marketplace');
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  // Fetch marketplace items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/marketplace/items');
      setItems(response.data.items);
      setFilteredItems(response.data.items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to fetch marketplace items. Please try again later.');
      setLoading(false);
    }
  };

  // Handle item search
  const handleSearchProperty = (query) => {
    if (query) {
      const filtered = items.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  };

  // Filter by category
  const filterItemsByCategory = (category) => {
    if (category === 'All') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => item.category === category);
      setFilteredItems(filtered);
    }
  };

  // Open search overlay
  const openSearchOverlay = () => {
    setIsSearchOpen(true);
  };

  // Close search overlay
  const closeSearchOverlay = () => {
    setIsSearchOpen(false);
  };

  useEffect(() => {
    getUserInfo(); // Fetch user info
    fetchItems();  // Fetch marketplace items
  }, []);

  return (
    <div>
      <Navbar userInfo={userInfo} />
      <div className="relative min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#2c2c2c] flex flex-col items-center py-12">
        
        {/* Background Gradients */}
        <div aria-hidden="true" className="fixed hidden dark:md:block dark:opacity-70 -bottom-[40%] -left-[20%] z-0">
          <img src={docsLeft} alt="Left Gradient Background" className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none !duration-300 rounded-large" />
        </div>
        <div aria-hidden="true" className="fixed hidden dark:md:block dark:opacity-70 -top-[80%] -right-[60%] 2xl:-top-[60%] 2xl:-right-[45%] z-0 rotate-12">
          <img src={docsRight} alt="Right Gradient Background" className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none !duration-300 rounded-large" />
        </div>

        {/* Search Overlay */}
        {isSearchOpen && (
          <SearchOverlay 
            onClose={closeSearchOverlay} 
            onSearch={handleSearchProperty} 
          />
        )}

        {/* Marketplace Header */}
        <div className="text-center mb-12 z-10">
          <h1 className="text-5xl font-bold text-white mb-4">Marketplace</h1>
          <p className="text-lg text-gray-400">
            Explore our collection of student-friendly items available for sale or free.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-4 mb-8 z-10">
          <Button color="primary" variant="ghost" onClick={() => filterItemsByCategory('All')}>
            All
          </Button>
          <Button color="primary" variant="ghost" onClick={() => filterItemsByCategory('Electronics')}>
            Electronics
          </Button>
          <Button color="primary" variant="ghost" onClick={() => filterItemsByCategory('Furniture')}>
            Furniture
          </Button>
          <Button color="primary" variant="ghost" onClick={() => filterItemsByCategory('Books')}>
            Books
          </Button>
          <Button color="primary" variant="ghost" onClick={() => filterItemsByCategory('Clothing')}>
            Clothing
          </Button>
        </div>

        {/* Marketplace Container */}
        <div className="max-w-screen-xl w-full z-10">
          {loading ? (
            <p className="text-center text-white text-xl">Loading items...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={item._id}
                  title={item.title}
                  price={item.price}
                  description={item.description}
                  imageUrl={item.images && item.images.length > 0 ? item.images[0] : docsRight} // Use first image or fallback
                  id={item._id}
                  // onClick={() => navigate(`/marketplace/item/${item._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
