// src/components/WelcomePage.jsx

import React, { useState, useEffect } from 'react';
import { Input, Button, DateInput } from '@heroui/react';
import { motion } from 'framer-motion';
import { CalendarDate } from "@internationalized/date";
import axios from 'axios';
import Navbar from '../components/Navbar/Navbar';

const WelcomePage = () => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: '',
    birthday: null,
    location: '',
    studentStatus: '',
    university: '',
    graduationMonth: '',
    graduationYear: '',
    interests: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isBirthdayValid, setIsBirthdayValid] = useState(true); // New state for birthday validation

  const handleInputChange = (key, value) => {
    setUserData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleNextStep = () => setStep(step + 1);

  // Validate birthday
  const validateBirthday = (birthday) => {
    const birthdayDate = new Date(birthday);
    const age = new Date().getFullYear() - birthdayDate.getFullYear();
    return age >= 17;
  };

  // Fetch universities for autocomplete
  const fetchUniversitySuggestions = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(
        `http://universities.hipolabs.com/search?name=${query}&country=United%20States`
      );
      const uniNames = response.data.map((uni) => uni.name);
      setSuggestions(uniNames);
    } catch (error) {
      console.error("Error fetching university data:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
        {/* Background Image covering the entire container */}
        <div className="absolute inset-0">
          <img
            src="https://framerusercontent.com/images/OjzVW6EQhQSWqC2hfscPJ7HAEgs.png"
            alt="Background"
            className="object-cover w-full h-full opacity-50"
          />
        </div>

        {/* Main Container with Questions and Options */}
        <div className="relative z-10 flex flex-col md:flex-row bg-transparent max-w-5xl w-full mx-auto rounded-lg shadow-lg">
          
          {/* Left Side - Translucent Container with Question */}
          <div className="md:w-1/2 p-20 bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-l-lg">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white"
            >
              {step === 1 && <h2 className="text-4xl font-bold">What’s your full name?</h2>}
              {step === 2 && <h2 className="text-4xl font-bold">When's your birthday?</h2>}
              {step === 3 && <h2 className="text-4xl font-bold">Where are you currently located?</h2>}
              {step === 4 && <h2 className="text-4xl font-bold">Are you an incoming, existing student, or an alumnus?</h2>}
              {step === 5 && <h2 className="text-4xl font-bold">Which university are you attending?</h2>}
              {step === 6 && <h2 className="text-4xl font-bold">When do you expect to graduate?</h2>}
              {step === 7 && <h2 className="text-4xl font-bold">Tell me a bit about yourself. What are your interests and passions?</h2>}
            </motion.div>
          </div>

          {/* Right Side - Options and Input Fields */}
          <div className="md:w-1/2 p-20 flex flex-col justify-center text-white rounded-r-lg">
            {step === 1 && (
              <>
                <Input
                  placeholder="First and Last Name"
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mb-4"
                />
                <Button onClick={handleNextStep} className="bg-blue-500 mt-4" disabled={!userData.name}>
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <DateInput
                  label="Select your birthday"
                  placeholderValue={new CalendarDate(2000, 1, 1)}
                  onChange={(value) => handleInputChange('birthday', value ? value.toString() : '')} // Checks for value
                  className="max-w-xs mb-4"
                  errorMessage="Please enter a valid date."
                  isInvalid={
                    userData.birthday &&
                    new Date(userData.birthday).getFullYear() > new Date().getFullYear() - 17
                  }
                />
                <Button 
                  onClick={handleNextStep} 
                  className="bg-blue-500 mt-4" 
                  disabled={!userData.birthday || new Date(userData.birthday).getFullYear() > new Date().getFullYear() - 17}
                >
                  Next
                </Button>
              </>
            )}


            {step === 3 && (
              <>
                <Input
                  placeholder="City"
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mb-4"
                />
                <Button onClick={handleNextStep} className="bg-blue-500 mt-4" disabled={!userData.location}>
                  Next
                </Button>
              </>
            )}

            {step === 4 && (
              <div className="flex space-x-4 mt-2">
                {['Incoming', 'Existing', 'Alumni'].map((status) => (
                  <Button
                    key={status}
                    onClick={() => {
                      handleInputChange('studentStatus', status);
                      handleNextStep();
                    }}
                    radius="full"
                    className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            )}

            {step === 5 && (
              <>
                <Input
                  placeholder="Search for your university"
                  onChange={(e) => {
                    handleInputChange('university', e.target.value);
                    fetchUniversitySuggestions(e.target.value);
                  }}
                  className="mb-2"
                />
                {suggestions.length > 0 && (
                  <ul className="bg-gray-700 text-white rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                    {suggestions.map((uni, index) => (
                      <li
                        key={index}
                        className="p-2 cursor-pointer hover:bg-gray-600"
                        onClick={() => {
                          handleInputChange('university', uni);
                          setSuggestions([]);
                          handleNextStep();
                        }}
                      >
                        {uni}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {step === 6 && (
              <>
                <select
                  onChange={(e) => handleInputChange('graduationMonth', e.target.value)}
                  className="bg-gray-700 text-white p-2 rounded mb-4"
                >
                  <option value="">Select Month</option>
                  <option value="May">May</option>
                  <option value="August">August</option>
                  <option value="December">December</option>
                </select>

                <select
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  className="bg-gray-700 text-white p-2 rounded mb-4"
                >
                  <option value="">Select Year</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>

                <Button
                  onClick={handleNextStep}
                  className="bg-blue-500 mt-4"
                  disabled={!userData.graduationMonth || !userData.graduationYear}
                >
                  Next
                </Button>
              </>
            )}

            {step === 7 && (
              <>
                <Input
                  placeholder="Type here"
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  className="mb-4"
                />
                <Button onClick={() => console.log('User data collected:', userData)} className="bg-blue-500 mt-4" disabled={!userData.interests}>
                  Submit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
