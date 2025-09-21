import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import NewRunDrawer from '../ui/NewRunDrawer';
import axiosInstance from '../../utils/axiosInstance';

const ListingDrawer = ({ isOpen, onClose, onItemCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'used',
    address: { street: '', city: '', state: '', zipCode: '' },
    contactInfo: { name: '', phone: '', email: '' },
    files: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch user info on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoadingUserInfo(true);
      try {
        const response = await axiosInstance.get('/get-user');
        console.log('Fetched user info:', response.data.user); // Debug log
        setUserInfo(response.data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoadingUserInfo(false);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  // Auto-fill contact info when user data is available
  useEffect(() => {
    if (userInfo && isOpen) {
      console.log('Auto-filling with user data:', userInfo); // Debug log
      
      const fullName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
      const userEmail = userInfo.email || '';
      const userCity = userInfo.currentLocation?.city || '';
      const userState = userInfo.currentLocation?.state || '';
      
      console.log('Auto-fill values:', { fullName, userEmail, userCity, userState });
      
      // Add a small delay to ensure form is fully rendered
      const timeoutId = setTimeout(() => {
        setFormData(prev => {
          const newData = {
            ...prev,
            contactInfo: {
              name: fullName || prev.contactInfo.name,
              phone: prev.contactInfo.phone, // Keep existing phone
              email: userEmail || prev.contactInfo.email,
            },
            address: {
              ...prev.address,
              city: userCity || prev.address.city,
              state: userState || prev.address.state,
            }
          };
          console.log('New form data after auto-fill:', newData); // Debug log
          return newData;
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [userInfo, isOpen]);

  // Dropzone for file uploads
  const onDrop = (acceptedFiles) => {
    setFormData((prev) => ({ 
      ...prev, 
      files: [...prev.files, ...acceptedFiles].slice(0, 5) // Max 5 images
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxFiles: 5
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear validation errors when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({
        ...prev,
        [e.target.name]: undefined
      }));
    }
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
    // Clear validation errors when user starts typing
    const errorKey = `contact${e.target.name.charAt(0).toUpperCase() + e.target.name.slice(1)}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async () => {
    if (formData.files.length === 0) return [];
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadedImages = await uploadImages();
      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        condition: formData.condition,
        thumbnailUrl: uploadedImages[0] || '', // Use first image as thumbnail
        contactInfo: {
          name: formData.contactInfo.name,
          phone: formData.contactInfo.phone,
          email: formData.contactInfo.email,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zipCode: formData.address.zipCode,
          }
        },
        images: uploadedImages,
      };

      console.log('Submitting payload:', payload); // Debug log
      const response = await axiosInstance.post('/marketplace/item', payload);
      console.log('API response:', response.data); // Debug log
      
      // Reset form but keep auto-filled contact info
      const resetFormData = {
        title: '',
        description: '',
        price: '',
        category: '',
        condition: 'used',
        address: { street: '', city: '', state: '', zipCode: '' },
        contactInfo: { 
          name: userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : '', 
          phone: '', 
          email: userInfo?.email || '' 
        },
        files: [],
      };
      setFormData(resetFormData);
      setCurrentStep(1);
      
      onItemCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating item:', error);
      console.error('Error response:', error.response?.data);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 'Failed to create item. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title.trim() && 
               formData.price && 
               parseFloat(formData.price) > 0 && 
               formData.category;
      case 2:
        return formData.description.trim();
      case 3:
        return formData.contactInfo.name.trim() && 
               formData.contactInfo.email.trim();
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
        setValidationErrors({}); // Clear any previous errors
      } else {
        // Show validation errors
        const errors = {};
        switch (currentStep) {
          case 1:
            if (!formData.title.trim()) errors.title = 'Title is required';
            if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required';
            if (!formData.category) errors.category = 'Category is required';
            break;
          case 2:
            if (!formData.description.trim()) errors.description = 'Description is required';
            break;
          case 3:
            if (!formData.contactInfo.name.trim()) errors.contactName = 'Contact name is required';
            if (!formData.contactInfo.email.trim()) errors.contactEmail = 'Email is required';
            break;
        }
        setValidationErrors(errors);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const categories = [
    'Electronics', 'Furniture', 'Books', 'Clothing', 'Sports', 
    'Home & Garden', 'Vehicles', 'Other'
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'used', label: 'Used' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  return (
    <NewRunDrawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="List New Item"
      width="w-full sm:w-96"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/10 text-white/50'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-orange-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-white/60 mt-2">
            <span>Basic Info</span>
            <span>Details</span>
            <span>Contact</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <span className="font-medium">Step 1:</span> Fill in the basic information about your item. All fields marked with * are required.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="What are you selling?"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    validationErrors.title 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-white/20 focus:ring-orange-500/50 focus:border-orange-500/50'
                  }`}
                  value={formData.title}
                  onChange={handleChange}
                />
                {validationErrors.title && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    validationErrors.price 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-white/20 focus:ring-orange-500/50 focus:border-orange-500/50'
                  }`}
                  value={formData.price}
                  onChange={handleChange}
                />
                {validationErrors.price && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 ${
                    validationErrors.category 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-white/20 focus:ring-orange-500/50 focus:border-orange-500/50'
                  }`}
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                  value={formData.condition}
                  onChange={handleChange}
                >
                  {conditions.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <span className="font-medium">Step 2:</span> Add a detailed description and upload images to showcase your item.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe your item in detail..."
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none ${
                    validationErrors.description 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-white/20 focus:ring-orange-500/50 focus:border-orange-500/50'
                  }`}
                  value={formData.description}
                  onChange={handleChange}
                />
                {validationErrors.description && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Upload Images (Max 5)
                </label>
                <div
                  {...getRootProps()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                    isDragActive 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-white/20 hover:border-orange-500/50 hover:bg-white/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-white/70">
                    {isDragActive ? (
                      <p>Drop images here...</p>
                    ) : (
                      <div>
                        <p>Drag & drop images here, or click to select</p>
                        <p className="text-sm text-white/50 mt-1">PNG, JPG up to 5MB each</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Previews */}
                {formData.files.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {formData.files.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <span className="font-medium">Step 3:</span> Contact information for buyers. Only name and email are required. Address is optional for privacy.
                </p>
              </div>
              {isLoadingUserInfo && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading your profile...</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Contact Name *
                  {userInfo && (
                    <span className="text-xs text-green-400 ml-2">✓ Auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={userInfo ? "Auto-filled from your profile" : "Your name"}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    validationErrors.contactName 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-white/20 focus:ring-orange-500/50 focus:border-orange-500/50'
                  }`}
                  value={formData.contactInfo.name}
                  onChange={handleContactInfoChange}
                />
                {validationErrors.contactName && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.contactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                  value={formData.contactInfo.phone}
                  onChange={handleContactInfoChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email *
                  {userInfo && (
                    <span className="text-xs text-green-400 ml-2">✓ Auto-filled</span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={userInfo ? "Auto-filled from your profile" : "your@email.com"}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    validationErrors.contactEmail 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-white/20 focus:ring-orange-500/50 focus:border-orange-500/50'
                  }`}
                  value={formData.contactInfo.email}
                  onChange={handleContactInfoChange}
                />
                {validationErrors.contactEmail && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  placeholder="123 Main St"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                  value={formData.address.street}
                  onChange={handleAddressChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    City
                    {userInfo?.currentLocation?.city && (
                      <span className="text-xs text-green-400 ml-2">✓ Auto-filled</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder={userInfo?.currentLocation?.city ? "Auto-filled from your profile" : "City"}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                    value={formData.address.city}
                    onChange={handleAddressChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    State
                    {userInfo?.currentLocation?.state && (
                      <span className="text-xs text-green-400 ml-2">✓ Auto-filled</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder={userInfo?.currentLocation?.state ? "Auto-filled from your profile" : "State"}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                    value={formData.address.state}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-white/70 hover:text-white transition-colors duration-200"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className={`px-6 py-3 rounded-xl transition-colors duration-200 font-medium ${
                  validateStep(currentStep)
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'List Item'}
              </button>
            )}
          </div>
        </div>
      </form>
    </NewRunDrawer>
  );
};

export default ListingDrawer;
