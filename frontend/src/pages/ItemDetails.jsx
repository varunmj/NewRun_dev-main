import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const ItemDetails = () => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetchItemDetails();
  }, []);

  const fetchItemDetails = async () => {
    try {
      const response = await axiosInstance.get(`/marketplace/item/${itemId}`);
      setItem(response.data.item);
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  if (!item) return <p>Loading...</p>;

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <img src={item.largeImageUrl} alt={item.title} className="w-full h-auto rounded-lg" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{item.title}</h1>
          <p className="text-lg text-gray-600 mt-2">
            {item.price === 0 ? 'Free' : `$${item.price}`}
          </p>
          <p className="mt-4 text-gray-700">{item.description}</p>
          <p className="mt-4 text-sm text-gray-500">Condition: {item.condition}</p>
          <p className="mt-4 text-sm text-gray-500">Contact: {item.contactInfo}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
