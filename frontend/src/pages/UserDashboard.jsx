import React, { useEffect, useState } from 'react';
import PropertyCard from '../components/Cards/PropertyCard';
import ItemCard from '../components/Cards/ItemCard'; // For marketplace items
import { MdAdd } from 'react-icons/md';
import AddEditProperty from '../pages/AddEditProperty';
import AddEditItem from '../pages/AddEditItem';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import Toast from '../components/ToastMessage/Toast';
import EmptyCard from '../components/EmptyCard/EmptyCard';
import AddPropertyImg from '../assets/Images/add-proprty.svg';
import NoDataImg from '../assets/Images/no-data.svg';
import Navbar from '../components/Navbar/Navbar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';  // Importing NextUI

const UserDashboard = () => {
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
    modalType: '', // Track whether it's property or item
  });

  const [showSelectionModal, setShowSelectionModal] = useState(false); // New state for the selection modal

  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    type: 'add',
    message: '',
  });

  const [allProperties, setAllProperties] = useState([]);
  const [allItems, setAllItems] = useState([]); // State for marketplace items
  const [userInfo, setUserInfo] = useState(null);
  const [isSearch, setIsSearch] = useState(false);
  const [viewMode, setViewMode] = useState('properties'); // State to toggle between properties and items

  const navigate = useNavigate();

  const handleEdit = (details, modalType) => {
    setOpenAddEditModal({ isShown: true, data: details, type: 'edit', modalType });
  };

  const showToastMessage = (message, type) => {
    setShowToastMsg({
      isShown: true,
      message: message,
      type: type,
    });
  };

  const handleCloseToast = () => {
    setShowToastMsg({
      isShown: false,
      message: '',
    });
  };

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  const getAllProperties = async () => {
    try {
      const response = await axiosInstance.get('/get-all-property-user');
      if (response.data && response.data.properties) {
        setAllProperties(response.data.properties);
      }
    } catch (error) {
      console.error('An unexpected error occurred. Please try again.');
    }
  };

  const getAllItems = async () => {
    try {
      const response = await axiosInstance.get('/marketplace/items-user');
      if (response.data && response.data.items) {
        setAllItems(response.data.items);
      }
    } catch (error) {
      console.error('An unexpected error occurred. Please try again.');
    }
  };

  const deleteProperty = async (data) => {
    const propertyId = data._id;
    try {
      const response = await axiosInstance.delete(`/delete-property/${propertyId}`);
      if (response.data && !response.data.error) {
        showToastMessage('Property Deleted Successfully', 'delete');
        getAllProperties();
      }
    } catch (error) {
      console.error('An unexpected error occurred. Please try again.');
    }
  };

  const deleteItem = async (data) => {
    const itemId = data._id;
    try {
      const response = await axiosInstance.delete(`/marketplace/item/${itemId}`);
      if (response.data && !response.data.error) {
        showToastMessage('Marketplace Item Deleted Successfully', 'delete');
        getAllItems();
      }
    } catch (error) {
      console.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllProperties();
    getAllItems();
  };

  useEffect(() => {
    getAllProperties();
    getAllItems();
    getUserInfo();
  }, []);

  const handleAddNewItem = (type) => {
    if (type === 'property') {
      setOpenAddEditModal({ isShown: true, type: 'add', data: null, modalType: 'property' });
    } else {
      setOpenAddEditModal({ isShown: true, type: 'add', data: null, modalType: 'item' });
    }
  };

  return (
    <div>
      <Navbar userInfo={userInfo} handleClearSearch={handleClearSearch} />

      {/* Toggle Button */}
      <div className="flex justify-center mt-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('properties')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              viewMode === 'properties' ? 'bg-blue-600 text-white' : 'bg-white text-black'
            } hover:bg-blue-600 hover:text-white`}
          >
            View Properties
          </button>
          <button
            onClick={() => setViewMode('items')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
              viewMode === 'items' ? 'bg-blue-600 text-white' : 'bg-white text-black'
            } hover:bg-blue-600 hover:text-white`}
          >
            View Marketplace Items
          </button>
        </div>
      </div>

      <div className="container mx-auto mt-8">
        {viewMode === 'properties' ? (
          // Properties View
          allProperties.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {allProperties.map((items) => (
                <PropertyCard
                  key={items._id}
                  _id={items._id}
                  title={items.title}
                  date={items.createdOn}
                  content={items.content}
                  tags={items.tags}
                  isPinned={items.isPinned}
                  price={items.price}
                  bedrooms={items.bedrooms}
                  bathrooms={items.bathrooms}
                  distanceFromUniversity={items.distanceFromUniversity}
                  address={items.address}
                  availabilityStatus={items.availabilityStatus}
                  description={items.description}
                  isFeatured={items.isFeatured}
                  onEdit={() => handleEdit(items, 'property')}
                  onDelete={() => deleteProperty(items)}
                />
              ))}
            </div>
          ) : (
            <EmptyCard
              imgSrc={isSearch ? NoDataImg : AddPropertyImg}
              message={isSearch ? `No properties found.` : `No properties. Add one to get started.`}
            />
          )
        ) : (
          // Marketplace Items View
          allItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {allItems.map((item) => (
                <ItemCard
                  key={item._id}
                  id = {item._id}
                  title={item.title}
                  price={item.price}
                  description={item.description}
                  images={item.images}
                  onEdit={() => handleEdit(item, 'item')}
                  onDelete={() => deleteItem(item)}
                />
              ))}
            </div>
          ) : (
            <EmptyCard
              imgSrc={isSearch ? NoDataImg : AddPropertyImg}
              message={isSearch ? `No marketplace items found.` : `No items. Add one to get started.`}
            />
          )
        )}

        {/* Add Button */}
        <Dropdown backdrop='blur'>
          <DropdownTrigger>
            <button
            
                className="fixed w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg right-10 bottom-10"
                onClick={() => {
                  setShowSelectionModal(true); // Show selection modal
                }}
              >
                <MdAdd className="text-[32px] text-white" />
            </button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Add new item options" variant="faded">
            <DropdownItem key="property" description="Add a new property" onClick={() => handleAddNewItem('property')}>
              Add Property
            </DropdownItem>
            <DropdownItem key="marketplace" description="Add a new marketplace item" onClick={() => handleAddNewItem('item')}>
              Add Marketplace Item
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* Modal */}
        <Modal
          isOpen={openAddEditModal.isShown}
          onRequestClose={() => setOpenAddEditModal({ isShown: false, type: 'add', data: null })}
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.2)' },
          }}
          contentLabel=""
          className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5"
        >
          {openAddEditModal.modalType === 'property' ? (
            <AddEditProperty
              type={openAddEditModal.type}
              propertyData={openAddEditModal.data}
              onClose={() => setOpenAddEditModal({ isShown: false, type: 'add', data: null })}
              getAllProperties={getAllProperties}
              showToastMessage={showToastMessage}
            />
          ) : (
            <AddEditItem
              type={openAddEditModal.type}
              itemData={openAddEditModal.data}
              onClose={() => setOpenAddEditModal({ isShown: false, type: 'add', data: null })}
              getAllItems={getAllItems}
              showToastMessage={showToastMessage}
            />
          )}
        </Modal>

        {/* Toast Notification */}
        <Toast
          isShown={showToastMsg.isShown}
          message={showToastMsg.message}
          type={showToastMsg.type}
          onClose={handleCloseToast}
        />
      </div>
    </div>
  );
};

export default UserDashboard;
