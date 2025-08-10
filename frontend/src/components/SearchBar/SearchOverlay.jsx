import React, { useState } from 'react';


const SearchOverlay = ({ onClose, onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
    onClose(); // Close the overlay once the search is performed
  };

  return (
    <div className="search-overlay">
      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Type in to search..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
        <button onClick={handleSearch} className="search-btn">Search</button>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default SearchOverlay;