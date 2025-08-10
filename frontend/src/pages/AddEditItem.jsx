import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useDropzone } from 'react-dropzone'; // For file upload

const AddEditItem = ({ itemData: initialItemData, isEdit, onClose, getAllItems, showToastMessage }) => {
  const [formData, setFormData] = useState({
    title: initialItemData?.title || '',
    description: initialItemData?.description || '',
    price: initialItemData?.price || 0,
    category: initialItemData?.category || '',
    condition: initialItemData?.condition || 'used',
    address: initialItemData?.address || { street: '', city: '', state: '', zipCode: '' },
    contactInfo: initialItemData?.contactInfo || { name: '', phone: '', email: '' },
    files: [], // For image uploads
  });

  const navigate = useNavigate();

  // Dropzone for file uploads
  const onDrop = (acceptedFiles) => {
    setFormData((prev) => ({ ...prev, files: acceptedFiles }));
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressChange = (e) => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleContactInfoChange = (e) => {
    setFormData({
      ...formData,
      contactInfo: {
        ...formData.contactInfo,
        [e.target.name]: e.target.value,
      },
    });
  };

  // Upload Images to S3
  const uploadImages = async () => {
    const formDataUpload = new FormData();
    formData.files.forEach((file) => {
      formDataUpload.append('images', file);
    });

    try {
      const response = await axiosInstance.post('/upload-images', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  };

  // Handle Submit for creating or editing item
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const uploadedImages = await uploadImages(); // Upload images first
      const payload = {
        ...formData,
        images: uploadedImages, // Add the array of uploaded image URLs
      };
  
      if (isEdit) {
        await axiosInstance.put(`/marketplace/item/${initialItemData._id}`, payload);
        showToastMessage('Marketplace Item Updated Successfully', 'edit');
      } else {
        await axiosInstance.post('/marketplace/item', payload);
        showToastMessage('Marketplace Item Created Successfully', 'add');
      }
  
      getAllItems(); // Fetch the updated items
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error creating/editing item:', error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto mt-15 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">{isEdit ? 'Edit Item' : 'Add New Item'}</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-md rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div>
              {/* Title, Price, Category, Condition */}
              <label className="block text-sm font-medium">Item Title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter the item title"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.title}
                onChange={handleChange}
              />

              <label className="block text-sm font-medium mt-4">Price ($)</label>
              <input
                type="number"
                name="price"
                placeholder="0"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.price}
                onChange={handleChange}
              />

              <label className="block text-sm font-medium mt-4">Category</label>
              <input
                type="text"
                name="category"
                placeholder="E.g., Electronics, Furniture, etc."
                className="w-full px-3 py-2 border rounded-md"
                value={formData.category}
                onChange={handleChange}
              />

              <label className="block text-sm font-medium mt-4">Condition</label>
              <select
                name="condition"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>

              {/* Address Fields */}
              <label className="block text-sm font-medium mt-4">Address</label>
              <input
                type="text"
                name="street"
                placeholder="Street"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.address.street}
                onChange={handleAddressChange}
              />
              <div className="flex gap-4 mt-2">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  className="w-1/3 px-3 py-2 border rounded-md"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  className="w-1/3 px-3 py-2 border rounded-md"
                  value={formData.address.state}
                  onChange={handleAddressChange}
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Zip Code"
                  className="w-1/3 px-3 py-2 border rounded-md"
                  value={formData.address.zipCode}
                  onChange={handleAddressChange}
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Description */}
              <label className="block text-sm font-medium">Item Description</label>
              <textarea
                name="description"
                placeholder="Enter a brief description of the item"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.description}
                onChange={handleChange}
              />

              {/* Upload Images */}
              <label className="block text-sm font-medium mt-4">Upload Images</label>
              <div
                {...getRootProps()}
                className="w-full border border-dashed rounded-md p-4 flex justify-center items-center"
              >
                <input {...getInputProps()} />
                Drag & drop images here, or click to select files
              </div>

              {/* Contact Information */}
              <label className="block text-sm font-medium mt-4">Contact Information</label>
              <input
                type="text"
                name="name"
                placeholder="Contact Name"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.contactInfo.name}
                onChange={handleContactInfoChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Contact Phone"
                className="w-full px-3 py-2 border rounded-md mt-2"
                value={formData.contactInfo.phone}
                onChange={handleContactInfoChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Contact Email"
                className="w-full px-3 py-2 border rounded-md mt-2"
                value={formData.contactInfo.email}
                onChange={handleContactInfoChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              type="submit" // Change button type to submit
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {isEdit ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditItem;
