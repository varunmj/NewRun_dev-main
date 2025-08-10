import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import TagInput from '../components/Input/TagInput';
import { MdClose } from 'react-icons/md';
import axiosInstance from '../utils/axiosInstance';

const AddEditProperty = ({ propertyData, type, getAllProperties, showToastMessage, onClose }) => {
    // States for existing fields
    const [title, setTitle] = useState(propertyData?.title || "");
    const [content, setContent] = useState(propertyData?.content || "");
    const [tags, setTags] = useState(propertyData?.tags || []);

    // States for new fields
    const [price, setPrice] = useState(propertyData?.price || 0);
    const [bedrooms, setBedrooms] = useState(propertyData?.bedrooms || 1);
    const [bathrooms, setBathrooms] = useState(propertyData?.bathrooms || 1);
    const [distanceFromUniversity, setDistanceFromUniversity] = useState(propertyData?.distanceFromUniversity || 0);
    const [address, setAddress] = useState(propertyData?.address || { street: '', city: '', state: '', zipCode: '' });
    const [availabilityStatus, setAvailabilityStatus] = useState(propertyData?.availabilityStatus || 'available');
    const [contactInfo, setContactInfo] = useState(propertyData?.contactInfo || { name: '', phone: '', email: '' });
    const [description, setDescription] = useState(propertyData?.description || '');
    const [isFeatured, setIsFeatured] = useState(propertyData?.isFeatured || false);
    const [error, setError] = useState(null);
    const [files, setFiles] = useState([]); // Files for upload

    // React Dropzone for handling file uploads
    const onDrop = (acceptedFiles) => {
        setFiles([...files, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: 'image/*',
    });

    // Function to upload images to the server (S3)
    const uploadImages = async () => {
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
            return response.data.imageUrls; // Return the uploaded image URLs from the response
        } catch (error) {
            console.error('Error uploading images:', error);
            throw new Error('Failed to upload images');
        }
    };

    // Add Property
    const addNewProperty = async () => {
        try {
            const uploadedImages = await uploadImages(); // Upload the images first
            const response = await axiosInstance.post('/add-property', {
                title,
                content,
                tags,
                price,
                bedrooms,
                bathrooms,
                distanceFromUniversity,
                address,
                availabilityStatus,
                contactInfo,
                description,
                isFeatured,
                images: uploadedImages, // Attach image URLs
            });
            if (response.data && response.data.property) {
                showToastMessage("Property Added Successfully");
                getAllProperties();
                onClose();
            }
        } catch (error) {
            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                setError(error.response.data.message);
            }
        }
    };

    // Edit Property
    const editProperty = async () => {
        const propertyId = propertyData._id;
        try {
            const uploadedImages = await uploadImages(); // Upload the images first
            const response = await axiosInstance.put('/edit-property/' + propertyId, {
                title,
                content,
                tags,
                price,
                bedrooms,
                bathrooms,
                distanceFromUniversity,
                address,
                availabilityStatus,
                contactInfo,
                description,
                isFeatured,
                images: uploadedImages, // Attach the image URLs to the property data
            });
            if (response.data && response.data.property) {
                showToastMessage("Property Updated Successfully");
                getAllProperties();
                onClose();
            }
        } catch (error) {
            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                setError(error.response.data.message);
            }
        }
    };

    const handleAddProperty = () => {
        if (!title) {
            setError("Please enter the title");
            return;
        }

        if (!content) {
            setError("Please enter the content");
            return;
        }

        setError("");

        if (type === 'edit') {
            editProperty();
        } else {
            addNewProperty();
        }
    };

    return (
        <div className='relative p-4 max-w-4xl mx-auto bg-white rounded-lg shadow-lg'>
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={onClose}>
                <MdClose size={24} />
            </button>

            <div className='grid grid-cols-4 gap-x-6 gap-y-4 p-4'>
                
                <div className='col-span-2'>
                    <label>Title:</label>
                    <input
                        type='text'
                        value={title}
                        onChange={({ target }) => setTitle(target.value)}
                        className='w-full p-2 border rounded'
                        placeholder='Enter the property title'
                    />
                </div>

                <div className='col-span-2'>
                    <label>Content:</label>
                    <textarea
                        value={content}
                        onChange={({ target }) => setContent(target.value)}
                        className='w-full p-2 border rounded'
                        rows='3'
                        placeholder='Describe the property'
                    />
                </div>

                {/* Dropzone Component */}
                <div className='col-span-2'>
                    <label>Upload Images:</label>
                    <div {...getRootProps()} className='border-dashed border-2 p-4 text-center'>
                        <input {...getInputProps()} />
                        <p>Drag & drop images here, or click to select files</p>
                    </div>
                    <div className='mt-4'>
                        {files.map((file, index) => (
                            <div key={index} className='mt-2'>
                                {file.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label>Price ($):</label>
                    <input
                        type='number'
                        value={price}
                        onChange={({ target }) => setPrice(Number(target.value))}
                        className='w-full p-2 border rounded'
                    />
                </div>

                <div>
                    <label>Bedrooms:</label>
                    <input
                        type='number'
                        value={bedrooms}
                        onChange={({ target }) => setBedrooms(Number(target.value))}
                        className='w-full p-2 border rounded'
                    />
                </div>

                <div>
                    <label>Bathrooms:</label>
                    <input
                        type='number'
                        value={bathrooms}
                        onChange={({ target }) => setBathrooms(Number(target.value))}
                        className='w-full p-2 border rounded'
                    />
                </div>

                <div>
                    <label>Distance from University (miles):</label>
                    <input
                        type='number'
                        value={distanceFromUniversity}
                        onChange={({ target }) => setDistanceFromUniversity(Number(target.value))}
                        className='w-full p-2 border rounded'
                    />
                </div>

                <div className='col-span-2'>
                    <label>Address:</label>
                    <div className='grid grid-cols-4 gap-3'>
                        <input
                            type='text'
                            value={address.street}
                            onChange={({ target }) => setAddress({ ...address, street: target.value })}
                            className='col-span-2 p-2 border rounded'
                            placeholder='Street'
                        />
                        <input
                            type='text'
                            value={address.city}
                            onChange={({ target }) => setAddress({ ...address, city: target.value })}
                            className='p-2 border rounded'
                            placeholder='City'
                        />
                        <input
                            type='text'
                            value={address.state}
                            onChange={({ target }) => setAddress({ ...address, state: target.value })}
                            className='p-2 border rounded'
                            placeholder='State'
                        />
                        <input
                            type='text'
                            value={address.zipCode}
                            onChange={({ target }) => setAddress({ ...address, zipCode: target.value })}
                            className='p-2 border rounded'
                            placeholder='Zip Code'
                        />
                    </div>
                </div>

                <div className='col-span-2'>
                    <label>Contact Information:</label>
                    <div className='grid grid-cols-3 gap-3'>
                        <input
                            type='text'
                            value={contactInfo.name}
                            onChange={({ target }) => setContactInfo({ ...contactInfo, name: target.value })}
                            className='p-2 border rounded'
                            placeholder='Contact Name'
                        />
                        <input
                            type='text'
                            value={contactInfo.phone}
                            onChange={({ target }) => setContactInfo({ ...contactInfo, phone: target.value })}
                            className='p-2 border rounded'
                            placeholder='Contact Phone'
                        />
                        <input
                            type='email'
                            value={contactInfo.email}
                            onChange={({ target }) => setContactInfo({ ...contactInfo, email: target.value })}
                            className='p-2 border rounded'
                            placeholder='Contact Email'
                        />
                    </div>
                </div>

                <div className='col-span-2 flex items-center'>
                    <input
                        type='checkbox'
                        checked={isFeatured}
                        onChange={({ target }) => setIsFeatured(target.checked)}
                        className='mr-2'
                    />
                    <label>Feature this property</label>
                </div>

                <div className='col-span-2'>
                    <label>Availability Status:</label>
                    <select
                        value={availabilityStatus}
                        onChange={({ target }) => setAvailabilityStatus(target.value)}
                        className='w-full p-2 border rounded'>
                        <option value='available'>Available</option>
                        <option value='rented'>Rented</option>
                    </select>
                </div>

                <div className='col-span-2'>
                    <label>Tags:</label>
                    <TagInput tags={tags} setTags={setTags} />
                </div>

                {error && <p className='text-red-500'>{error}</p>}

                <button
                    className='col-span-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                    onClick={handleAddProperty}
                >
                    {type === 'edit' ? 'Update' : "Add"}
                </button>
            </div>
        </div>
    );
}

export default AddEditProperty;
