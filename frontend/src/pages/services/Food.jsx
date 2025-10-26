import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdRestaurant, MdCheckCircle, MdStar, MdDeliveryDining, MdSupport, MdLocalPizza, MdTimeline } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/Navbar/Navbar';

const Food = () => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userCampus, setUserCampus] = useState('');

  useEffect(() => {
    if (user?.onboardingData?.university) {
      setUserCampus(user.onboardingData.university);
    }
  }, [user]);

  const services = [
    {
      id: 'meal-plan-basic',
      name: 'Basic Meal Plan',
      price: 200,
      duration: 'Monthly',
      features: ['10 meals per week', 'Campus dining halls', 'Mobile ordering', 'Basic support'],
      requirements: 'Student ID, Campus address',
      popular: true,
      description: 'Essential meal plan for budget-conscious students'
    },
    {
      id: 'meal-plan-premium',
      name: 'Premium Meal Plan',
      price: 350,
      duration: 'Monthly',
      features: ['Unlimited meals', 'Campus dining halls', 'Mobile ordering', 'Delivery options', 'Priority support', 'Special dietary options'],
      requirements: 'Student ID, Campus address',
      popular: false,
      description: 'Complete meal solution with delivery options'
    },
    {
      id: 'food-delivery',
      name: 'Food Delivery Service',
      price: 150,
      duration: 'Monthly',
      features: ['Local restaurant delivery', 'Campus pickup points', 'Mobile app', 'Multiple cuisines', 'Student discounts'],
      requirements: 'Student ID, Campus address, Payment method',
      popular: false,
      description: 'Flexible food delivery from local restaurants'
    }
  ];

  const handleSelectService = async (service) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedService(service);
    } catch (error) {
      console.error('Error selecting service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedService) return;
    
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/services/food/subscribe', {
        serviceId: selectedService.id,
        userId: user?.id,
        campus: userCampus
      });
      
      if (response.data.success) {
        alert('Food service subscription activated! You will receive your meal plan details via email.');
      }
    } catch (error) {
      console.error('Error subscribing to food service:', error);
      alert('Error subscribing to food service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Navbar />
      <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <MdRestaurant className="text-4xl text-orange-500 mr-3" />
            <h1 className="text-4xl font-bold text-white">Food Services</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Convenient meal plans and food delivery services designed for campus life.
            {userCampus && (
              <span className="block mt-2 text-orange-400">
                Available at {userCampus}
              </span>
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdDeliveryDining className="text-3xl text-orange-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Campus Delivery</h3>
            <p className="text-gray-300">Food delivered directly to your dorm or campus location</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdLocalPizza className="text-3xl text-red-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Diverse Cuisines</h3>
            <p className="text-gray-300">Access to multiple cuisines and dietary options</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <MdSupport className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Student Support</h3>
            <p className="text-gray-300">Dedicated support team for all your food needs</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 ${
                selectedService?.id === service.id
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-white/10 hover:border-white/20'
              } ${service.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <MdStar className="mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 mb-4">{service.description}</p>
                <div className="text-4xl font-bold text-white mb-2">
                  ${service.price}
                  <span className="text-lg text-gray-400">/{service.duration.toLowerCase()}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <MdCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-white mb-2">Requirements:</h4>
                <p className="text-gray-300 text-sm">{service.requirements}</p>
              </div>

              <button
                onClick={() => handleSelectService(service)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  selectedService?.id === service.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : selectedService?.id === service.id ? 'Selected' : 'Select Service'}
              </button>
            </div>
          ))}
        </motion.div>

        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl p-8 border border-orange-500/30"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Subscribe to {selectedService.name}?
              </h3>
              <p className="text-gray-300 mb-6">
                Start enjoying convenient meals and food delivery on campus.
                {userCampus && ` Available at ${userCampus}.`}
              </p>
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe Now - $' + selectedService.price + '/' + selectedService.duration.toLowerCase()}
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center mb-6">
            <MdTimeline className="text-3xl text-orange-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">How It Works</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Choose Plan</h4>
              <p className="text-gray-300 text-sm">Select the meal plan that fits your needs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Order Food</h4>
              <p className="text-gray-300 text-sm">Use our app to order meals or schedule deliveries</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Delivery</h4>
              <p className="text-gray-300 text-sm">Food delivered to your dorm or campus location</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Enjoy Meals</h4>
              <p className="text-gray-300 text-sm">Enjoy delicious meals without leaving campus</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default Food;
