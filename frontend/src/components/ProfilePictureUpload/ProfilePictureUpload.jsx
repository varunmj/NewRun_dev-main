import React, { useState, useRef } from 'react';
import { MdCameraAlt, MdDelete, MdEdit, MdUpload } from 'react-icons/md';
import ImageCropper from '../ImageCropper/ImageCropper';
import axiosInstance from '../../utils/axiosInstance';
import { getInitials, getAvatarBgColor } from '../../utils/avatarUtils';
import imageCompression from 'browser-image-compression';

const ProfilePictureUpload = ({ 
  currentAvatar, 
  onAvatarUpdate, 
  size = 'large',
  showEditButton = true,
  userName = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xlarge: 'w-32 h-32' // 128px hero avatar
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 2, // Compress to 2MB max
      maxWidthOrHeight: 1920, // Max width or height
      useWebWorker: true,
      onProgress: (progress) => {
        setCompressionProgress(Math.round(progress));
      }
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      throw new Error('Failed to compress image');
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (30MB max)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      setError(`File size (${formatFileSize(file.size)}) exceeds the 30MB limit. Please choose a smaller image.`);
      return;
    }

    setError('');
    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      // Compress image if it's larger than 2MB
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file);
      }
      
      setSelectedImage(URL.createObjectURL(processedFile));
      setShowCropper(true);
    } catch (error) {
      setError(error.message || 'Failed to process image');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const handleCropComplete = async (croppedImageBlob) => {
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', croppedImageBlob, 'profile-picture.jpg');

      const response = await axiosInstance.post('/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      // Update the avatar URL
      onAvatarUpdate(response.data.avatarUrl);
      
      // Clean up
      setShowCropper(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.response?.data?.message || error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    setIsUploading(true);
    setError('');

    try {
      // You might want to create a DELETE endpoint for this
      // For now, we'll just update with an empty string
      const response = await axiosInstance.patch('/update-user', { avatar: '' });
      
      if (response.data.error) {
        throw new Error(response.data.message);
      }

      onAvatarUpdate('');
    } catch (error) {
      console.error('Error removing avatar:', error);
      setError(error.response?.data?.message || error.message || 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="relative">
      {/* Profile Picture Display */}
      <div className={`${sizeClasses[size]} relative rounded-2xl overflow-hidden ring-1 ring-white/10`}>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback Avatar */}
        <div 
          className={`w-full h-full flex items-center justify-center text-white font-semibold ${
            currentAvatar ? 'hidden' : 'flex'
          } ${getAvatarBgColor(userName)}`}
        >
          {getInitials(userName)}
        </div>

        {/* Upload Overlay */}
        {showEditButton && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isCompressing}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50 group-hover:scale-110"
              title="Change profile picture"
            >
              {isUploading || isCompressing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MdCameraAlt className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showEditButton && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isCompressing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105"
          >
            <MdUpload className="w-3 h-3" />
            {isCompressing ? 'Compressing...' : currentAvatar ? 'Change Photo' : 'Add Photo'}
          </button>
          
          {currentAvatar && (
            <button
              onClick={handleRemoveAvatar}
              disabled={isUploading || isCompressing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105"
            >
              <MdDelete className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
      )}

      {/* Compression Progress */}
      {isCompressing && (
        <div className="mt-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-400 rounded-full animate-spin" />
            <span>Compressing image... {compressionProgress}%</span>
          </div>
          <div className="mt-1 w-full bg-blue-500/20 rounded-full h-1">
            <div 
              className="bg-blue-400 h-1 rounded-full transition-all duration-300"
              style={{ width: `${compressionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {showCropper && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          aspectRatio={1}
          circularCrop={true}
        />
      )}
    </div>
  );
};

export default ProfilePictureUpload;
