import React, { useState } from 'react';
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Card } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const RoommateProfile = () => {
    const [formData, setFormData] = useState({
        country: '',
        language: '',
        education: 'Select Education Level',
        gender: 'Select Gender',
        location: '',
        hometown: '',
        ethnicity: 'Select Ethnicity',
        exercise: 'Select Exercise Level',
        drinking: 'Select Drinking Habit',
        smoking: 'Select Smoking Habit',
        starSign: 'Select Star Sign',
        religion: 'Select Religion',
        familyPlans: 'Select Family Plans',
        cleanliness: 'Select Cleanliness Level',
        petPreference: 'Select Pet Preference',
        introversion: 'Select Introversion Level',
        partyPreference: 'Select Partying Preference',
        musicTaste: 'Select Music Taste',
        hobbies: '',
    });

    const navigate = useNavigate();

    const handleSelectionChange = (key, value) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleSubmit = async () => {
        try {
            const response = await axiosInstance.post('/api/user/roommatePreferences', { preferences: formData });
            alert('Preferences saved successfully!');
            navigate('/all-properties');
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] p-8 grid grid-cols-4 gap-8">
            
            {/* Country and Language */}
            <Card className="bg-[#1c1c1e] p-4 rounded-lg shadow-md style={{ height: 'auto' }}">
                <h3 className="text-lg text-purple-400 font-semibold mb-3">Basic Info</h3>
                <div className="space-y-2">
                    <Input
                        clearable
                        bordered
                        fullWidth
                        label="Country"
                        placeholder="Enter Country"
                        value={formData.country}
                        onChange={(e) => handleSelectionChange('country', e.target.value)}
                    />
                    <Input
                        clearable
                        bordered
                        fullWidth
                        label="Language"
                        placeholder="Enter Language"
                        value={formData.language}
                        onChange={(e) => handleSelectionChange('language', e.target.value)}
                    />
                </div>
            </Card>

            {/* Education and Gender */}
            <Card className="bg-[#1c1c1e] p-4 rounded-lg shadow-md">
                <h3 className="text-lg text-purple-400 font-semibold mb-3">Personal Details</h3>
                <div className="space-y-2">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="solid" className="capitalize w-full bg-black text-white">{formData.education}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Education Level"
                            selectionMode="single"
                            onSelectionChange={(keys) => handleSelectionChange('education', Array.from(keys).join(", "))}
                        >
                            <DropdownItem key="undergraduate">Undergraduate</DropdownItem>
                            <DropdownItem key="graduate">Graduate</DropdownItem>
                            <DropdownItem key="postgraduate">Postgraduate</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="solid" className="capitalize w-full bg-black text-white">{formData.gender}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Gender"
                            selectionMode="single"
                            onSelectionChange={(keys) => handleSelectionChange('gender', Array.from(keys).join(", "))}
                        >
                            <DropdownItem key="male">Male</DropdownItem>
                            <DropdownItem key="female">Female</DropdownItem>
                            <DropdownItem key="other">Other</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </Card>

            {/* Location and Hometown */}
            <Card className="bg-[#1c1c1e] p-4 rounded-lg shadow-md">
                <h3 className="text-lg text-purple-400 font-semibold mb-3">Location</h3>
                <div className="space-y-2">
                    <Input
                        clearable
                        bordered
                        fullWidth
                        label="Current Location"
                        placeholder="Enter Current Location"
                        value={formData.location}
                        onChange={(e) => handleSelectionChange('location', e.target.value)}
                    />
                    <Input
                        clearable
                        bordered
                        fullWidth
                        label="Hometown"
                        placeholder="Enter Hometown"
                        value={formData.hometown}
                        onChange={(e) => handleSelectionChange('hometown', e.target.value)}
                    />
                </div>
            </Card>

            {/* Ethnicity and Exercise */}
            <Card className="bg-[#1c1c1e] p-4 rounded-lg shadow-md">
                <h3 className="text-lg text-purple-400 font-semibold mb-3">Preferences</h3>
                <div className="space-y-2">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="solid" className="capitalize w-full bg-black text-white">{formData.ethnicity}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Ethnicity"
                            selectionMode="single"
                            onSelectionChange={(keys) => handleSelectionChange('ethnicity', Array.from(keys).join(", "))}
                        >
                            <DropdownItem key="asian">Asian</DropdownItem>
                            <DropdownItem key="black">Black</DropdownItem>
                            <DropdownItem key="caucasian">Caucasian</DropdownItem>
                            <DropdownItem key="hispanic">Hispanic</DropdownItem>
                            <DropdownItem key="other">Other</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="solid" className="capitalize w-full bg-black text-white">{formData.exercise}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Exercise Level"
                            selectionMode="single"
                            onSelectionChange={(keys) => handleSelectionChange('exercise', Array.from(keys).join(", "))}
                        >
                            <DropdownItem key="sedentary">Sedentary</DropdownItem>
                            <DropdownItem key="moderately active">Moderately Active</DropdownItem>
                            <DropdownItem key="very active">Very Active</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </Card>

            {/* Save Button */}
            <div className="col-span-4 flex justify-center mt-8">
                <Button color="primary" className="w-full max-w-md bg-black text-white" onClick={handleSubmit}>
                    Save Preferences
                </Button>
            </div>
        </div>
    );
};

export default RoommateProfile;
