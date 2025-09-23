import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';  // Import for navigation

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    location: '',
    university: '',
    course: '',
    graduation: '',
    description: '',
    passion: ''
  });

  const navigate = useNavigate();

  // Handle Step transitions
  const handleNext = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    // Set profile completed flag in localStorage
    localStorage.setItem('profileCompleted', 'true');
    // Redirect to the landing page or dashboard
    navigate('/home');  // or navigate('/home') for the landing page
  };

  // Get Title based on the current step
  const getTitle = () => {
    switch (currentStep) {
      case 1:
        return "Who's listening?";
      case 2:
        return 'Where are you located?';
      case 3:
        return 'What are you studying?';
      case 4:
        return 'Tell us about yourself!';
      default:
        return 'Welcome to Onboarding!';
    }
  };

  // Function to render the current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <NameStep onNext={handleNext} data={formData} />;
      case 2:
        return <LocationStep onNext={handleNext} onBack={handlePrevious} data={formData} />;
      case 3:
        return <CourseGraduationStep onNext={handleNext} onBack={handlePrevious} data={formData} />;
      case 4:
        return <DescriptionStep onNext={handleFinish} onBack={handlePrevious} data={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <motion.div className="w-full h-1 bg-blue-500 fixed top-0" style={{ scaleX: currentStep / 4 }} />
      <div className="container mx-auto px-4">
        <motion.div
          className="bg-gray-800 shadow-lg rounded-xl p-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">{getTitle()}</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.5 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// NameStep Component
const NameStep = ({ onNext, data }) => {
  const [name, setName] = useState(data.name || '');
  const [birthday, setBirthday] = useState(data.birthday || '');

  const handleSubmit = () => {
    if (name && birthday) {
      onNext({ name, birthday });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>
      <div className="mb-4">
        <input
          type="date"
          className="w-full px-3 py-2 rounded-lg"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
      </div>
      <motion.button
        className="bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
      >
        Next
      </motion.button>
    </div>
  );
};

// LocationStep Component
const LocationStep = ({ onNext, onBack, data }) => {
  const [location, setLocation] = useState(data.location || '');
  const [university, setUniversity] = useState(data.university || '');

  const handleSubmit = () => {
    if (location && university) {
      onNext({ location, university });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your location"
        />
      </div>
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          placeholder="Enter your university"
        />
      </div>
      <div className="flex justify-between">
        <motion.button
          className="bg-gray-600 text-white py-2 px-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
        >
          Back
        </motion.button>
        <motion.button
          className="bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
        >
          Next
        </motion.button>
      </div>
    </div>
  );
};

// CourseGraduationStep Component
const CourseGraduationStep = ({ onNext, onBack, data }) => {
  const [course, setCourse] = useState(data.course || '');
  const [graduation, setGraduation] = useState(data.graduation || '');

  const handleSubmit = () => {
    if (course && graduation) {
      onNext({ course, graduation });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          placeholder="Course of Study"
        />
      </div>
      <div className="mb-4">
        <input
          type="date"
          className="w-full px-3 py-2 rounded-lg"
          value={graduation}
          onChange={(e) => setGraduation(e.target.value)}
          placeholder="Expected Graduation"
        />
      </div>
      <div className="flex justify-between mt-4">
        <motion.button
          className="bg-gray-600 text-white py-2 px-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
        >
          Back
        </motion.button>
        <motion.button
          className="bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
        >
          Next
        </motion.button>
      </div>
    </div>
  );
};

// DescriptionStep Component
const DescriptionStep = ({ onNext, onBack, data }) => {
  const [description, setDescription] = useState(data.description || '');
  const [passion, setPassion] = useState(data.passion || '');

  const handleSubmit = () => {
    if (description && passion) {
      onNext({ description, passion });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <textarea
          className="w-full px-3 py-2 rounded-lg"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us about yourself"
        />
      </div>
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg"
          value={passion}
          onChange={(e) => setPassion(e.target.value)}
          placeholder="What are you passionate about?"
        />
      </div>
      <div className="flex justify-between mt-4">
        <motion.button
          className="bg-gray-600 text-white py-2 px-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
        >
          Back
        </motion.button>
        <motion.button
          className="bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
        >
          Finish
        </motion.button>
      </div>
    </div>
  );
};

export default Onboarding;
