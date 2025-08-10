import React, { useEffect, useState } from 'react';
import PropertyCard from '../components/Cards/PropertyCard';
import { MdAdd } from 'react-icons/md';
import AddEditProperty from './AddEditProperty';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import Toast from '../components/ToastMessage/Toast';
import EmptyCard from '../components/EmptyCard/EmptyCard';
import AddPropertyImg from '../assets/Images/add-proprty.svg';
import NoDataImg from '../assets/Images/no-data.svg';
import Navbar from '../components/Navbar/Navbar';

const Property_Home = () => {
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: 'add',
    data: null,
  });

  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    type: 'add',
    message: '',
  });

  const [allProperties, setAllProperties] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [isSearch, setIsSearch] = useState(false);

  const navigate = useNavigate();

  const handleEdit = (propertyDetails) => {
    setOpenAddEditModal({ isShown: true, data: propertyDetails, type: 'edit' });
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
      const response = await axiosInstance.get('/get-all-property');
      if (response.data && response.data.properties) {
        setAllProperties(response.data.properties);
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
      if (error.response && error.response.data && error.response.data.message) {
        console.error('An unexpected error occurred. Please try again.');
      }
    }
  };

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

  const updateIsPinned = async (propertyData) => {
    const propertyId = propertyData._id;
    try {
      const response = await axiosInstance.put(`/update-property-pinned/${propertyId}`, {
        isPinned: !propertyData.isPinned,
      });
      if (response.data && response.data.property) {
        showToastMessage('Property Pinned Successfully');
        getAllProperties();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllProperties();
  };

  useEffect(() => {
    getAllProperties();
    getUserInfo();
  }, []);

  return (
    <div>
    <Navbar />
    <div className="container mx-auto">
      {allProperties.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 mt-8">
          {allProperties.map((items) => (
            <PropertyCard
              key={items._id}
              title={items.title}
              date={items.createdOn}
              content={items.content}
              tags={items.tags}
              isPinned={items.isPinned}
              onEdit={() => handleEdit(items)}
              onDelete={() => deleteProperty(items)}
              onPinProperty={() => updateIsPinned(items)}
            />
          ))}
        </div>
      ) : (
        <EmptyCard
          imgSrc={isSearch ? NoDataImg : AddPropertyImg}
          message={isSearch ? `Oops! No Properties found matching your search!` : "Start creating your first property! Click the 'Add (+)' button to list your rental property with all the requested details. Let's get started!"}
        />
      )}

      <button
        className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10"
        onClick={() => {
          setOpenAddEditModal({ isShown: true, type: 'add', data: null });
        }}
      >
        <MdAdd className="text-[32px] text-white" />
      </button>

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: 'rgba(0,0,0,0.2)',
          },
        }}
        contentLabel=""
        className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5"
      >
        <AddEditProperty
          type={openAddEditModal.type}
          propertyData={openAddEditModal.data}
          onClose={() => {
            setOpenAddEditModal({ isShown: false, type: 'add', data: null });
          }}
          getAllProperties={getAllProperties}
          showToastMessage={showToastMessage}
        />
      </Modal>

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

export default Property_Home;

