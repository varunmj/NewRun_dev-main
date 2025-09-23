import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdClose, MdAdd, MdDelete, MdLocationOn, MdHome, MdAttachMoney, MdPhone, MdEmail, MdPerson } from 'react-icons/md';
import NewRunDrawer from '../ui/NewRunDrawer';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const PropertyDrawer = ({ isOpen, onClose, propertyData, onPropertyCreated, onPropertyUpdated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const { user } = useAuth();
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
    const autoFillUserInfo = () => {
      // Try to get user info from API first
      const fetchUserInfo = async () => {
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
            
            // Auto-fill contact info
            setFormData(prev => ({
              ...prev,
              contactInfo: {
                name: fullName,
                phone: phone,
                email: email
              }
            }));
            return true;
          }
        } catch (error) {
          console.error('Error fetching user info from API:', error);
        }
        return false;
      };

      // Fallback to AuthContext user
      const useAuthUser = () => {
        if (user) {
          console.log('Using AuthContext user for auto-fill:', user);
          setUserInfo(user);
          
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          const phone = user.phone || '';
          const email = user.email || '';
          
          console.log('Auto-filling contact info from AuthContext:', { fullName, phone, email });
          
          setFormData(prev => ({
            ...prev,
            contactInfo: {
              name: fullName,
              phone: phone,
              email: email
            }
          }));
        }
      };

      if (isOpen) {
        fetchUserInfo().then(success => {
          if (!success) {
            useAuthUser();
          }
        });
      }
    };

    autoFillUserInfo();
  }, [isOpen, user]);

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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: 'image/*',
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

    try {
      const response = await axiosInstance.post('/upload-images', formData, {
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

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Property title is required';
        if (!formData.content.trim()) newErrors.content = 'Property description is required';
        if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
        break;
      case 2:
        if (!formData.bedrooms || formData.bedrooms < 1) newErrors.bedrooms = 'Number of bedrooms is required';
        if (!formData.bathrooms || formData.bathrooms < 1) newErrors.bathrooms = 'Number of bathrooms is required';
        if (!formData.distanceFromUniversity) newErrors.distanceFromUniversity = 'Distance from university is required';
        break;
      case 3:
        if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.address.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.state.trim()) newErrors.state = 'State is required';
        break;
      case 4:
        if (!formData.contactInfo.name.trim()) newErrors.contactName = 'Contact name is required';
        if (!formData.contactInfo.phone.trim()) newErrors.contactPhone = 'Phone number is required';
        if (!formData.contactInfo.email.trim()) newErrors.contactEmail = 'Email is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (validateStep(currentStep)) {
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
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload images if any
      const imageUrls = await uploadImages();
      
      // Prepare payload
      const payload = {
        ...formData,
        images: imageUrls,
        price: Number(formData.price)
      };
      
      let response;
      if (isEdit) {
        response = await axiosInstance.put(`/properties/${propertyData._id}`, payload);
        onPropertyUpdated?.(response.data.property);
      } else {
        response = await axiosInstance.post('/properties', payload);
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
      setErrors({ submit: 'Failed to save property. Please try again.' });
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Property Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="e.g., Beautiful 2BR Apartment near Campus"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Description *</label>
              <textarea
                value={formData.content}
                onChange={(e) => updateFormData('content', e.target.value)}
                placeholder="Describe your property..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
              {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Monthly Rent *</label>
              <div className="relative">
                <MdAttachMoney className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  placeholder="1200"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bedrooms *</label>
                <select
                  value={formData.bedrooms}
                  onChange={(e) => updateFormData('bedrooms', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num} className="bg-gray-800">{num}</option>
                  ))}
                </select>
                {errors.bedrooms && <p className="text-red-400 text-sm mt-1">{errors.bedrooms}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bathrooms *</label>
                <select
                  value={formData.bathrooms}
                  onChange={(e) => updateFormData('bathrooms', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {[1,1.5,2,2.5,3,3.5,4].map(num => (
                    <option key={num} value={num} className="bg-gray-800">{num}</option>
                  ))}
                </select>
                {errors.bathrooms && <p className="text-red-400 text-sm mt-1">{errors.bathrooms}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Distance from University (miles) *</label>
              <input
                type="number"
                step="0.1"
                value={formData.distanceFromUniversity}
                onChange={(e) => updateFormData('distanceFromUniversity', e.target.value)}
                placeholder="2.5"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
              {errors.distanceFromUniversity && <p className="text-red-400 text-sm mt-1">{errors.distanceFromUniversity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Availability</label>
              <select
                value={formData.availabilityStatus}
                onChange={(e) => updateFormData('availabilityStatus', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="available" className="bg-gray-800">Available</option>
                <option value="rented" className="bg-gray-800">Rented</option>
                <option value="unavailable" className="bg-gray-800">Unavailable</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Street Address *</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => updateFormData('address.street', e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
              {errors.street && <p className="text-red-400 text-sm mt-1">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => updateFormData('address.city', e.target.value)}
                  placeholder="Chicago"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
                {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">State *</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => updateFormData('address.state', e.target.value)}
                  placeholder="IL"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
                {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">ZIP Code</label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => updateFormData('address.zipCode', e.target.value)}
                placeholder="60601"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-green-300 font-medium">
                  {userInfo ? 'Auto-filled with your profile' : 'Loading your profile...'}
                </span>
              </div>
              <p className="text-xs text-blue-300">
                {userInfo 
                  ? 'Contact information is pre-filled for your convenience' 
                  : 'We\'re fetching your contact information to save you time'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Contact Name *</label>
              <div className="relative">
                <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={formData.contactInfo.name}
                  onChange={(e) => updateFormData('contactInfo.name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.contactName && <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Phone Number *</label>
              <div className="relative">
                <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => updateFormData('contactInfo.phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.contactPhone && <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email Address *</label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => updateFormData('contactInfo.email', e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Property Images</label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
              >
                <input {...getInputProps()} />
                <MdAdd className="mx-auto text-4xl text-white/50 mb-2" />
                <p className="text-white/70">Drag & drop images here, or click to select</p>
                <p className="text-white/50 text-sm mt-1">PNG, JPG up to 10MB each</p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <MdDelete className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Additional Details</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Any additional information about the property..."
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => updateFormData('isFeatured', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="isFeatured" className="text-white/80 text-sm">
                Feature this property (recommended for better visibility)
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Basic Information',
    'Property Details',
    'Location',
    'Contact Information',
    'Images & Final Details'
  ];

  return (
    <NewRunDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Property' : 'List Your Property'}
      subtitle={isEdit ? 'Update your property listing' : 'Share your property with students'}
    >
      <div className="h-full flex flex-col">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep > index + 1 
                  ? 'bg-green-500 text-white' 
                  : currentStep === index + 1 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/50'
              }`}>
                {currentStep > index + 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep === index + 1 ? 'text-white' : 'text-white/50'
              }`}>
                {title}
              </span>
              {index < stepTitles.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  currentStep > index + 1 ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {renderStep()}
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm">
              Step {currentStep} of {stepTitles.length}
            </span>
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Property' : 'List Property')}
              </button>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}
      </div>
    </NewRunDrawer>
  );
};

export default PropertyDrawer;
