import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdClose, MdAdd, MdDelete, MdLocationOn, MdHome, MdAttachMoney, MdPhone, MdEmail, MdPerson } from 'react-icons/md';
import NewRunDrawer from '../ui/NewRunDrawer';
import axiosInstance from '../../utils/axiosInstance';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const PropertyDrawer = ({ isOpen, onClose, propertyData, onPropertyCreated, onPropertyUpdated }) => {
  console.log('PropertyDrawer rendering, isOpen:', isOpen);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  // const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    distanceFromUniversity: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    availabilityStatus: 'available',
    contactInfo: {
      name: '',
      phone: '',
      email: ''
    },
    description: '',
    isFeatured: false,
    tags: []
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  const isEdit = !!propertyData;

  // Auto-fill user info on component mount
  useEffect(() => {
    if (!isOpen) return;
    
    const autoFillUserInfo = async () => {
      try {
        console.log('Fetching user info for auto-fill...');
        const response = await axiosInstance.get('/get-user');
        console.log('User API response:', response.data);
        
        if (response.data && response.data.user) {
          const apiUser = response.data.user;
          setUserInfo(apiUser);
          
          const fullName = `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim();
          const phone = apiUser.phone || '';
          const email = apiUser.email || '';
          
          console.log('Auto-filling contact info from API:', { fullName, phone, email });
          
          setFormData(prev => ({
            ...prev,
            contactInfo: {
              name: fullName,
              phone: phone,
              email: email
            }
          }));
          return;
        }
      } catch (error) {
        console.error('Error fetching user info from API:', error);
      }

      // Fallback to AuthContext user
      // if (user) {
      //   console.log('Using AuthContext user for auto-fill:', user);
      //   setUserInfo(user);
      //   
      //   const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      //   const phone = user.phone || '';
      //   const email = user.email || '';
      //   
      //   console.log('Auto-filling contact info from AuthContext:', { fullName, phone, email });
      //   
      //   setFormData(prev => ({
      //     ...prev,
      //     contactInfo: {
      //       name: fullName,
      //       phone: phone,
      //       email: email
      //     }
      //   }));
      // }
    };

    autoFillUserInfo();
  }, [isOpen]);

  // Load property data for editing
  useEffect(() => {
    if (isEdit && propertyData) {
      setFormData({
        title: propertyData.title || '',
        content: propertyData.content || '',
        price: propertyData.price || '',
        bedrooms: propertyData.bedrooms || 1,
        bathrooms: propertyData.bathrooms || 1,
        distanceFromUniversity: propertyData.distanceFromUniversity || '',
        address: propertyData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        availabilityStatus: propertyData.availabilityStatus || 'available',
        contactInfo: propertyData.contactInfo || {
          name: '',
          phone: '',
          email: ''
        },
        description: propertyData.description || '',
        isFeatured: propertyData.isFeatured || false,
        tags: propertyData.tags || []
      });
    }
  }, [isEdit, propertyData]);

  // Clear step errors when navigating between steps
  useEffect(() => {
    setErrors({});
  }, [currentStep]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (files.length === 0) return [];
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    console.log('Uploading images:', files.length, 'files');
    console.log('FormData entries:', Array.from(formData.entries()));

    try {
      // Use a separate axios instance for file uploads to avoid header conflicts
      const response = await axios.post('http://localhost:8000/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  // PURE validation (no setState here)
  const getStepErrors = (step, data) => {
    const e = {};
    switch (step) {
      case 1:
        if (!data.title.trim()) e.title = 'Property title is required';
        if (!data.content.trim()) e.content = 'Property description is required';
        if (!data.price || Number(data.price) <= 0) e.price = 'Valid price is required';
        break;
      case 2:
        if (!data.bedrooms || data.bedrooms < 1) e.bedrooms = 'Number of bedrooms is required';
        if (!data.bathrooms || Number(data.bathrooms) < 1) e.bathrooms = 'Number of bathrooms is required';
        if (!data.distanceFromUniversity) e.distanceFromUniversity = 'Distance from university is required';
        break;
      case 3:
        if (!data.address.street.trim()) e.street = 'Street address is required';
        if (!data.address.city.trim()) e.city = 'City is required';
        if (!data.address.state.trim()) e.state = 'State is required';
        break;
      case 4:
        if (!data.contactInfo.name.trim()) e.contactName = 'Contact name is required';
        if (!data.contactInfo.phone.trim()) e.contactPhone = 'Phone number is required';
        if (!data.contactInfo.email.trim()) e.contactEmail = 'Email is required';
        break;
      default:
        break;
    }
    return e;
  };

  // Memoized validity for the current render
  const stepErrors = React.useMemo(() => {
    console.log('Recalculating stepErrors for step:', currentStep);
    return getStepErrors(currentStep, formData);
  }, [currentStep, formData]);
  const isStepValid = Object.keys(stepErrors).length === 0;

  // Stateful validator only for buttons/actions
  const validateStep = (step, data = formData) => {
    const e = getStepErrors(step, data);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (validateStep(currentStep, formData)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateStep(currentStep, formData)) return;
    
    // Additional validation for required fields
    if (!formData.title || !formData.price || !formData.address.street || 
        !formData.address.city || !formData.address.state || 
        !formData.contactInfo.name || !formData.contactInfo.phone || !formData.contactInfo.email) {
      setErrors({ submit: 'Please fill in all required fields before submitting.' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images if any
      const imageUrls = await uploadImages();
      
      // Prepare payload with all required fields
      const payload = {
        title: formData.title,
        content: formData.content || formData.title, // Use title as content if content is empty
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        distanceFromUniversity: Number(formData.distanceFromUniversity) || 0,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode || '00000' // Default zipCode if empty
        },
        availabilityStatus: formData.availabilityStatus,
        images: imageUrls,
        contactInfo: {
          name: formData.contactInfo.name,
          phone: formData.contactInfo.phone,
          email: formData.contactInfo.email
        },
        description: formData.description,
        isFeatured: formData.isFeatured,
        tags: formData.tags || []
      };
      
      console.log('Sending payload:', payload);
      console.log('Auth token:', localStorage.getItem('accessToken'));
      
      let response;
      if (isEdit) {
        response = await axiosInstance.put(`/properties/${propertyData._id}`, payload);
        onPropertyUpdated?.(response.data.property);
      } else {
        response = await axiosInstance.post('/add-property', payload);
        onPropertyCreated?.(response.data.property);
      }
      
      // Reset form and close drawer
      setFormData({
        title: '',
        content: '',
        price: '',
        bedrooms: 1,
        bathrooms: 1,
        distanceFromUniversity: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        availabilityStatus: 'available',
        contactInfo: { name: '', phone: '', email: '' },
        description: '',
        isFeatured: false,
        tags: []
      });
      setFiles([]);
      setCurrentStep(1);
      onClose();
      
    } catch (error) {
      console.error('Error saving property:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setErrors({ submit: `Failed to save property: ${error.response?.data?.message || error.message || 'Please try again.'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-medium">Step 1:</span> Fill in the basic information about your property. All fields marked with * are required.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Property Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="e.g., Cozy 2BR Apartment near Campus"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Property Description *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => updateFormData('content', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors resize-none"
                placeholder="Describe your property, amenities, and what makes it special..."
              />
              {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Monthly Rent *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                  placeholder="1200"
                />
              </div>
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-medium">Step 2:</span> Provide the property details and specifications.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Bedrooms *
                </label>
                <select
                  value={formData.bedrooms}
                  onChange={(e) => updateFormData('bedrooms', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num} className="bg-gray-800">{num} {num === 1 ? 'Bedroom' : 'Bedrooms'}</option>
                  ))}
                </select>
                {errors.bedrooms && <p className="text-red-400 text-sm mt-1">{errors.bedrooms}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Bathrooms *
                </label>
                <select
                  value={formData.bathrooms}
                  onChange={(e) => updateFormData('bathrooms', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                >
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                    <option key={num} value={num} className="bg-gray-800">{num} {num === 1 ? 'Bathroom' : 'Bathrooms'}</option>
                  ))}
                </select>
                {errors.bathrooms && <p className="text-red-400 text-sm mt-1">{errors.bathrooms}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Distance from University *
              </label>
              <input
                type="text"
                value={formData.distanceFromUniversity}
                onChange={(e) => updateFormData('distanceFromUniversity', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="e.g., 0.5 miles, 10 minutes walk"
              />
              {errors.distanceFromUniversity && <p className="text-red-400 text-sm mt-1">{errors.distanceFromUniversity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Availability Status
              </label>
              <select
                value={formData.availabilityStatus}
                onChange={(e) => updateFormData('availabilityStatus', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              >
                <option value="available" className="bg-gray-800">Available Now</option>
                <option value="coming_soon" className="bg-gray-800">Coming Soon</option>
                <option value="rented" className="bg-gray-800">Rented</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-medium">Step 3:</span> Provide the property location details.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => updateFormData('address.street', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="123 Main Street"
              />
              {errors.street && <p className="text-red-400 text-sm mt-1">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => updateFormData('address.city', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                  placeholder="Chicago"
                />
                {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => updateFormData('address.state', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                  placeholder="IL"
                />
                {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => updateFormData('address.zipCode', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="60601"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-medium">Step 4:</span> Provide your contact information for potential tenants.
              </p>
              {userInfo && (
                <div className="mt-2 flex items-center text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Auto-filled with your profile
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.contactInfo.name}
                onChange={(e) => updateFormData('contactInfo.name', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="Your full name"
              />
              {errors.contactName && <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.contactInfo.phone}
                onChange={(e) => updateFormData('contactInfo.phone', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="(555) 123-4567"
              />
              {errors.contactPhone && <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => updateFormData('contactInfo.email', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="your.email@example.com"
              />
              {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-medium">Step 5:</span> Add property images and additional details.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Property Images
              </label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500/50 transition-colors"
              >
                <input {...getInputProps()} />
                <MdAdd className="mx-auto text-4xl text-white/50 mb-2" />
                <p className="text-white/70">Drag & drop images here, or click to select</p>
                <p className="text-white/50 text-sm mt-1">PNG, JPG, GIF up to 10MB each</p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <span className="text-white/80 text-sm">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Additional Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors resize-none"
                placeholder="Any additional details about the property, neighborhood, or special features..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.isFeatured}
                onChange={(e) => updateFormData('isFeatured', e.target.checked)}
                className="w-4 h-4 text-orange-500 bg-white/5 border-white/20 rounded focus:ring-orange-500/50"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-white/80">
                Feature this property (recommended for better visibility)
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <NewRunDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Property' : 'List Your Property'}
      width="w-full sm:w-96"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/10 text-white/50'
                }`}>
                  {step}
                </div>
                {step < 5 && (
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
            <span>Location</span>
            <span>Contact</span>
            <span>Images</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
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

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid}
                className={`px-6 py-3 rounded-xl transition-colors duration-200 font-medium ${
                  isStepValid
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
                {isSubmitting ? 'Creating...' : (isEdit ? 'Update Property' : 'List Property')}
              </button>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}
      </form>
    </NewRunDrawer>
  );
};

export default PropertyDrawer;