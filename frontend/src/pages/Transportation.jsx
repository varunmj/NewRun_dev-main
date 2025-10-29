import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, Marker, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "../utils/googleMapsLoader";

/* ---------------------------- Google Maps Configuration ---------------------------- */
const MAP_STYLE = { width: "100%", height: "400px" };
const INITIAL_CENTER = { lat: 41.8781, lng: -87.6298 };
const MAP_OPTIONS = { 
  streetViewControl: false, 
  mapTypeControl: false, 
  fullscreenControl: false,
  zoomControl: true
};

import { 
  MdDirectionsBus, 
  MdDirectionsBike, 
  MdDirectionsCar, 
  MdDirectionsWalk, 
  MdLocationOn,
  MdSchedule,
  MdAttachMoney,
  MdGroup,
  MdNotifications,
  MdRoute,
  MdAdd,
  MdSearch,
  MdStar,
  MdPhone,
  MdMessage,
  MdCheckCircle,
  MdCancel,
  MdPerson,
  MdAccessTime,
  MdLightbulb,
  MdTrendingUp
} from 'react-icons/md';
import Navbar from '../components/Navbar/Navbar';
import NewRunDrawer from '../components/ui/NewRunDrawer';
import axiosInstance from '../utils/axiosInstance';
import '../styles/newrun-hero.css';

/**
 * Transportation Hub
 * AI-powered transportation planning and optimization
 * CEO-level UX with comprehensive transport insights
 */
const Transportation = () => {
  // Google Maps setup
  const { isLoaded: isGoogleMapsLoaded, loadError } = useGoogleMapsLoader();
  
  // Handle Google Maps loading errors
  useEffect(() => {
    console.log('Google Maps status:', { isGoogleMapsLoaded, loadError });
    if (loadError) {
      console.error('Google Maps failed to load:', loadError);
      addNotification('error', 'Google Maps failed to load. Please check your API key configuration.');
    }
    if (isGoogleMapsLoaded) {
      console.log('Google Maps loaded successfully');
      console.log('Google Maps API available:', !!window.google?.maps);
      console.log('Places API available:', !!window.google?.maps?.places);
      
      // Test if autocomplete is working
      if (window.google?.maps?.places) {
        console.log('Places API is available, autocomplete should work');
      } else {
        console.error('Places API not available');
        addNotification('error', 'Google Places API not loaded. Autocomplete will not work.');
      }
    }
  }, [isGoogleMapsLoaded, loadError]);
  
  const [routes, setRoutes] = useState([]);
  const [carpools, setCarpools] = useState([]);
  const [transit, setTransit] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [focusedElement, setFocusedElement] = useState(null);
  const [filters, setFilters] = useState({
    method: 'all',
    cost: 'all',
    duration: 'all',
    sortBy: 'duration'
  });
  
  // Google Maps state
  const [directions, setDirections] = useState(null);
  const [originLL, setOriginLL] = useState(null);
  const [destinationLL, setDestinationLL] = useState(null);
  const [mapCenter, setMapCenter] = useState(INITIAL_CENTER);
  
  // Autocomplete refs
  const fromAutocompleteRef = useRef(null);
  const toAutocompleteRef = useRef(null);
  
  // Google Maps helper functions
  const geocode = useCallback((query) =>
    new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) {
        reject('Google Maps not loaded');
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(status);
        }
      });
    }), []
  );

  const calculateRoute = useCallback(async (origin, destination, travelMode = 'DRIVING') => {
    if (!window.google?.maps?.DirectionsService) {
      throw new Error('Google Maps not loaded');
    }

    try {
      const originLL = await geocode(origin);
      const destinationLL = await geocode(destination);
      
      const directionsService = new window.google.maps.DirectionsService();
      
      return new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: originLL,
            destination: destinationLL,
            travelMode: window.google.maps.TravelMode[travelMode],
            unitSystem: window.google.maps.UnitSystem.IMPERIAL,
            avoidHighways: false,
            avoidTolls: false,
          },
          (result, status) => {
            if (status === 'OK') {
              const route = result.routes[0];
              const leg = route.legs[0];
              
              resolve({
                distance: leg.distance.text,
                duration: leg.duration.text,
                distanceValue: leg.distance.value,
                durationValue: leg.duration.value,
                directions: result,
                origin: originLL,
                destination: destinationLL
              });
            } else {
              reject(status);
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Route calculation failed: ${error.message}`);
    }
  }, [geocode]);

  // Autocomplete handlers
  const onFromPlaceChanged = useCallback(() => {
    console.log('From place changed triggered');
    if (!fromAutocompleteRef.current) {
      console.log('From autocomplete ref not available');
      return;
    }
    const place = fromAutocompleteRef.current.getPlace();
    console.log('From place:', place);
    if (!place) {
      console.log('No place data received');
      return;
    }
    
    const name = place.name || place.formatted_address || 
      (place.address_components && place.address_components.map((c) => c.long_name).join(", ")) || "";
    
    console.log('Setting from location to:', name);
    setFromLocation(name);
    
    // Update map center if we have coordinates
    if (place.geometry && place.geometry.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setOriginLL(location);
      setMapCenter(location);
    }
  }, []);

  const onToPlaceChanged = useCallback(() => {
    console.log('To place changed triggered');
    if (!toAutocompleteRef.current) {
      console.log('To autocomplete ref not available');
      return;
    }
    const place = toAutocompleteRef.current.getPlace();
    console.log('To place:', place);
    if (!place) {
      console.log('No place data received for To');
      return;
    }
    
    const name = place.name || place.formatted_address || 
      (place.address_components && place.address_components.map((c) => c.long_name).join(", ")) || "";
    
    setToLocation(name);
    
    // Update map center if we have coordinates
    if (place.geometry && place.geometry.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setDestinationLL(location);
    }
  }, []);
  
  // Ride Share State
  const [rideShares, setRideShares] = useState([]);
  const [showRideShareForm, setShowRideShareForm] = useState(false);
  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'rides', 'requests'
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  // Form states
  const [routeForm, setRouteForm] = useState({
    name: '',
    from: '',
    to: '',
    method: 'bus',
    duration: '',
    distance: '',
    cost: '',
    frequency: 'As needed',
    notes: ''
  });
  
  const [carpoolForm, setCarpoolForm] = useState({
    type: 'offer',
    route: { from: '', to: '' },
    schedule: { departure: '', return: '', days: [] },
    vehicle: { make: '', model: '', year: '', color: '' },
    capacity: 4,
    cost: '',
    preferences: { smoking: false, music: true, conversation: 'optional' },
    notes: ''
  });

  // Sample transportation data
  const sampleRoutes = [
    {
      id: 1,
      from: 'Home',
      to: 'Campus',
      method: 'Bus',
      duration: '25 min',
      cost: '$2.50',
      frequency: 'Every 15 min',
      status: 'active',
      icon: MdDirectionsBus,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      from: 'Home',
      to: 'Campus',
      method: 'Bike',
      duration: '15 min',
      cost: 'Free',
      frequency: 'Always available',
      status: 'active',
      icon: MdDirectionsBike,
      color: 'bg-green-500'
    },
    {
      id: 3,
      from: 'Home',
      to: 'Campus',
      method: 'Carpool',
      duration: '20 min',
      cost: '$5.00',
      frequency: 'Daily 8:00 AM',
      status: 'active',
      icon: MdGroup,
      color: 'bg-purple-500'
    }
  ];

  const sampleCarpools = [
    {
      id: 1,
      driver: 'Sarah Johnson',
      route: 'Downtown → Campus',
      time: '8:00 AM',
      seats: 3,
      cost: '$5.00',
      rating: 4.8,
      nextTrip: 'Tomorrow'
    },
    {
      id: 2,
      driver: 'Mike Chen',
      route: 'Suburbs → Campus',
      time: '7:30 AM',
      seats: 2,
      cost: '$4.50',
      rating: 4.9,
      nextTrip: 'Today'
    }
  ];

  const sampleTransit = [
    {
      id: 1,
      line: 'Bus Route 15',
      destination: 'Campus',
      nextArrival: '8:15 AM',
      frequency: 'Every 15 min',
      status: 'on-time',
      delay: 0
    },
    {
      id: 2,
      line: 'Bus Route 22',
      destination: 'Downtown',
      nextArrival: '8:22 AM',
      frequency: 'Every 20 min',
      status: 'delayed',
      delay: 5
    }
  ];

  const sampleInsights = [
    {
      type: 'urgent',
      title: 'Route Alert',
      message: 'Bus Route 15 is delayed by 10 minutes. Consider taking the bike route instead.',
      action: 'View Alternatives',
      icon: MdNotifications
    },
    {
      type: 'success',
      title: 'Cost Savings',
      message: 'You\'ve saved $45 this month by using the bike route. Great job!',
      action: 'View Savings',
      icon: MdAttachMoney
    },
    {
      type: 'info',
      title: 'New Carpool Available',
      message: 'A new carpool from your area is starting tomorrow. Join to save money and meet new people.',
      action: 'Join Carpool',
      icon: MdGroup
    }
  ];

  // Sample Ride Share Data
  const sampleRideShares = [
    {
      id: 1,
      driver: {
        name: 'Sarah Chen',
        rating: 4.9,
        trips: 127,
        phone: '+1 (555) 123-4567'
      },
      route: {
        from: 'Lincolnshire West',
        to: 'NIU Campus',
        distance: '2.3 miles',
        duration: '8 minutes'
      },
      schedule: {
        departure: '8:15 AM',
        return: '5:30 PM',
        days: ['Mon', 'Wed', 'Fri']
      },
      cost: '$3.50',
      seats: 3,
      available: 2,
      vehicle: 'Honda Civic',
      status: 'active',
      type: 'offer' // 'offer' or 'request'
    },
    {
      id: 2,
      driver: {
        name: 'Mike Rodriguez',
        rating: 4.7,
        trips: 89,
        phone: '+1 (555) 987-6543'
      },
      route: {
        from: 'Stadium View Apartments',
        to: 'NIU Campus',
        distance: '1.8 miles',
        duration: '6 minutes'
      },
      schedule: {
        departure: '7:45 AM',
        return: '6:00 PM',
        days: ['Tue', 'Thu']
      },
      cost: '$2.50',
      seats: 4,
      available: 1,
      vehicle: 'Toyota Camry',
      status: 'active',
      type: 'offer'
    },
    {
      id: 3,
      rider: {
        name: 'Alex Johnson',
        rating: 4.8,
        trips: 45
      },
      route: {
        from: 'Campus',
        to: 'DeKalb Mall',
        distance: '3.1 miles',
        duration: '12 minutes'
      },
      schedule: {
        departure: '2:00 PM',
        return: '4:00 PM',
        days: ['Today']
      },
      cost: '$4.00',
      seats: 1,
      status: 'pending',
      type: 'request'
    }
  ];

  const getTypeStyles = (type) => {
    const styles = {
      urgent: 'border-red-500/30 bg-red-500/5 text-red-300',
      success: 'border-green-500/30 bg-green-500/5 text-green-300',
      warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
      info: 'border-blue-500/30 bg-blue-500/5 text-blue-300'
    };
    return styles[type] || styles.info;
  };

  const getStatusColor = (status) => {
    const colors = {
      'on-time': 'text-green-400',
      'delayed': 'text-red-400',
      'cancelled': 'text-gray-400'
    };
    return colors[status] || 'text-blue-400';
  };

  // API Functions
  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/api/transportation/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        addNotification('error', 'Please log in to access transportation features');
      } else {
        addNotification('error', 'Failed to load dashboard data');
      }
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axiosInstance.get('/api/transportation/routes');
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      if (error.response?.status === 401) {
        addNotification('error', 'Please log in to access your saved routes');
      } else {
        addNotification('error', 'Failed to load routes, using sample data');
      }
      // Fallback to sample data
      setRoutes(sampleRoutes);
    }
  };

  const fetchCarpools = async () => {
    try {
      const response = await axiosInstance.get('/api/transportation/carpools');
      if (response.data.success) {
        setCarpools(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching carpools:', error);
      // Fallback to sample data
      setCarpools(sampleCarpools);
    }
  };

  const fetchTransit = async () => {
    try {
      const response = await axiosInstance.get('/api/transportation/transit');
      if (response.data.success) {
        setTransit(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transit data:', error);
      // Fallback to sample data
      setTransit(sampleTransit);
    }
  };

  const planRoute = async (from, to, preferences = {}) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/transportation/plan', {
        from,
        to,
        preferences
      });
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error planning route:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createRoute = async (routeData) => {
    try {
      console.log('Creating route with data:', routeData);
      
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.post('/api/transportation/routes', routeData);
      console.log('Route creation response:', response.data);
      if (response.data.success) {
        await fetchRoutes(); // Refresh routes
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Route creation failed');
      }
    } catch (error) {
      console.error('Error creating route:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save route';
      
      if (error.message === 'User not authenticated') {
        errorMessage = 'Please log in to save routes';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to save routes';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid route data: ' + (error.response.data?.message || 'Unknown error');
      } else if (error.response?.data?.message) {
        errorMessage = 'Failed to save route: ' + error.response.data.message;
      } else if (error.message) {
        errorMessage = 'Failed to save route: ' + error.message;
      }
      
      addNotification('error', errorMessage);
      throw error;
    }
  };

  const createCarpool = async (carpoolData) => {
    try {
      const response = await axiosInstance.post('/api/transportation/carpools', carpoolData);
      if (response.data.success) {
        await fetchCarpools(); // Refresh carpools
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating carpool:', error);
      throw error;
    }
  };

  const joinCarpool = async (carpoolId, passengerData) => {
    try {
      const response = await axiosInstance.post(`/api/transportation/carpools/${carpoolId}/join`, passengerData);
      if (response.data.success) {
        await fetchCarpools(); // Refresh carpools
        return response.data.data;
      }
    } catch (error) {
      console.error('Error joining carpool:', error);
      throw error;
    }
  };

  // Initialize data
  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    console.log('Transportation page - Auth token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      addNotification('error', 'Please log in to use transportation features');
      return;
    }
    
    fetchDashboardData();
    fetchRoutes();
    fetchCarpools();
    fetchTransit();
    setAiInsights(sampleInsights);
    setRideShares(sampleRideShares);
    
    // Apply custom styles to Google Places autocomplete
    const applyCustomStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        .pac-container {
          background-color: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
          backdrop-filter: blur(10px) !important;
          margin-top: 4px !important;
          max-height: 300px !important;
          overflow-y: auto !important;
          z-index: 9999 !important;
          min-width: 400px !important;
          width: 100% !important;
          max-width: 500px !important;
        }
        
        .pac-item {
          background-color: transparent !important;
          border: none !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          color: white !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          transition: all 0.2s ease !important;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: unset !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        
        .pac-item:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
          color: #3b82f6 !important;
        }
        
        .pac-item-selected {
          background-color: rgba(59, 130, 246, 0.2) !important;
          color: #3b82f6 !important;
        }
        
        .pac-item-query {
          color: white !important;
          font-weight: 500 !important;
          font-size: 15px !important;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: unset !important;
          max-width: none !important;
        }
        
        .pac-matched {
          color: #3b82f6 !important;
          font-weight: 600 !important;
        }
        
        .pac-icon {
          margin-right: 8px !important;
          opacity: 0.7 !important;
        }
        
        .pac-item:last-child {
          border-bottom: none !important;
        }
        
        .pac-logo:after {
          content: "" !important;
        }
        
        .pac-container::-webkit-scrollbar {
          width: 6px !important;
        }
        
        .pac-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 3px !important;
        }
        
        .pac-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3) !important;
          border-radius: 3px !important;
        }
        
        .pac-container::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5) !important;
        }
        
        /* Force the dropdown to be wider and prevent text truncation */
        .pac-container {
          position: absolute !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          min-width: 400px !important;
          max-width: 600px !important;
          top: 100% !important;
          margin-top: 4px !important;
          z-index: 10000 !important;
        }
        
        .pac-item * {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: unset !important;
          max-width: none !important;
        }
        
        /* Ensure dropdown appears relative to input field */
        .relative .pac-container {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 10000 !important;
          margin-top: 4px !important;
        }
        
        /* Ensure the dropdown can extend beyond the input container */
        .pac-container {
          position: absolute !important;
          z-index: 10000 !important;
        }
      `;
      document.head.appendChild(style);
    };
    
    // Apply styles immediately and also after a delay to ensure Google Places is loaded
    applyCustomStyles();
    setTimeout(applyCustomStyles, 1000);
    
    // Additional approach: Monitor for Google Places dropdown and force positioning
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const pacContainers = document.querySelectorAll('.pac-container');
          pacContainers.forEach((container) => {
            // Find the closest input field to position the dropdown correctly
            const inputFields = document.querySelectorAll('input[type="text"]');
            let closestInput = null;
            let minDistance = Infinity;
            
            inputFields.forEach((input) => {
              const inputRect = input.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const distance = Math.abs(inputRect.top - containerRect.top);
              
              if (distance < minDistance) {
                minDistance = distance;
                closestInput = input;
              }
            });
            
            if (closestInput) {
              const inputRect = closestInput.getBoundingClientRect();
              container.style.position = 'absolute';
              container.style.top = (inputRect.bottom + window.scrollY + 4) + 'px';
              container.style.left = inputRect.left + 'px';
              container.style.width = inputRect.width + 'px';
              container.style.zIndex = '10000';
            }
            
            container.style.minWidth = '400px';
            container.style.maxWidth = '600px';
            
            const items = container.querySelectorAll('.pac-item');
            items.forEach((item) => {
              item.style.whiteSpace = 'nowrap';
              item.style.overflow = 'visible';
              item.style.textOverflow = 'unset';
              item.style.maxWidth = 'none';
              item.style.width = '100%';
              
              const query = item.querySelector('.pac-item-query');
              if (query) {
                query.style.whiteSpace = 'nowrap';
                query.style.overflow = 'visible';
                query.style.textOverflow = 'unset';
                query.style.maxWidth = 'none';
              }
            });
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Cleanup function
    return () => {
      observer.disconnect();
    };
    
    // Check if user is new to transportation page
    const hasUsedTransportation = localStorage.getItem('hasUsedTransportation');
    if (!hasUsedTransportation) {
      setShowOnboarding(true);
    }
    
    // Request notification permission
    requestNotificationPermission();
    
    // Add keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResults(false);
        setShowMap(false);
        setShowOnboarding(false);
        setNotifications([]);
      }
      if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
        e.target.click();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notification functions
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const showNotification = (title, body, icon) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const addNotification = (type, message, action) => {
    const notification = {
      id: Date.now(),
      type,
      message,
      action,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Show browser notification
    showNotification(
      type === 'transit' ? 'Transit Update' : 'Transportation Alert',
      message,
      type === 'transit' ? '🚌' : '🚗'
    );
  };

  // Filtering and sorting functions
  const filterAndSortRoutes = (routes) => {
    if (!routes) return [];
    
    let filtered = routes.filter(route => {
      if (filters.method !== 'all' && route.method !== filters.method) return false;
      if (filters.cost !== 'all') {
        if (filters.cost === 'free' && route.cost > 0) return false;
        if (filters.cost === 'paid' && route.cost === 0) return false;
      }
      if (filters.duration !== 'all') {
        const duration = parseInt(route.duration);
        if (filters.duration === 'short' && duration > 15) return false;
        if (filters.duration === 'medium' && (duration <= 15 || duration > 30)) return false;
        if (filters.duration === 'long' && duration <= 30) return false;
      }
      return true;
    });

    // Sort routes
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        case 'cost':
          return a.cost - b.cost;
        case 'method':
          return a.method.localeCompare(b.method);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Performance optimizations
  const memoizedRoutes = useMemo(() => {
    return filterAndSortRoutes(searchResults?.suggestions || []);
  }, [searchResults, filters]);

  const memoizedCarpools = useMemo(() => {
    return carpools.slice(0, 3);
  }, [carpools]);

  const memoizedTransit = useMemo(() => {
    return transit.slice(0, 3);
  }, [transit]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (from, to) => {
      if (!from || !to) return;
      try {
        const routeData = await planRoute(from, to);
        if (routeData) {
          setSearchResults(routeData);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error planning route:', error);
      }
    }, 500),
    []
  );

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Search and Route Planning with Google Maps
  const handleSearchRoutes = async (e) => {
    e.preventDefault();
    if (!fromLocation || !toLocation) return;
    
    if (!isGoogleMapsLoaded && !loadError) {
      addNotification('error', 'Google Maps is still loading. Please wait a moment and try again.');
      return;
    }
    
    if (loadError) {
      addNotification('error', 'Google Maps is unavailable. Please enter locations manually and try again.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate routes for different transportation methods
      const travelModes = [
        { mode: 'DRIVING', method: 'carpool', cost: 2 },
        { mode: 'WALKING', method: 'walk', cost: 0 },
        { mode: 'BICYCLING', method: 'bike', cost: 0 },
        { mode: 'TRANSIT', method: 'bus', cost: 1.5 }
      ];
      
      const routePromises = travelModes.map(async (travelMode) => {
        try {
          const routeData = await calculateRoute(fromLocation, toLocation, travelMode.mode);
          return {
            method: travelMode.method,
            duration: routeData.duration,
            distance: routeData.distance,
            cost: travelMode.cost,
            frequency: travelMode.method === 'bus' ? 'Every 15 min' : 'As needed',
            directions: routeData.directions,
            origin: routeData.origin,
            destination: routeData.destination
          };
        } catch (error) {
          console.warn(`Failed to calculate ${travelMode.method} route:`, error);
          return null;
        }
      });
      
      const routes = (await Promise.all(routePromises)).filter(Boolean);
      
      if (routes.length > 0) {
        setSearchResults({ suggestions: routes });
        setShowResults(true);
        setShowMap(true);
        
        // Set map center to first route
        if (routes[0].origin && routes[0].destination) {
          setOriginLL(routes[0].origin);
          setDestinationLL(routes[0].destination);
          setDirections(routes[0].directions);
          setMapCenter(routes[0].origin);
        }
        
        addNotification('success', `Found ${routes.length} route options from ${fromLocation} to ${toLocation}`);
      } else {
        addNotification('error', 'No routes found. Please check your locations and try again.');
      }
    } catch (error) {
      console.error('Error planning routes:', error);
      addNotification('error', 'Failed to calculate routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Route Management
  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await createRoute(routeForm);
      setRouteForm({
        name: '',
        from: '',
        to: '',
        method: 'bus',
        duration: '',
        distance: '',
        cost: '',
        frequency: 'As needed',
        notes: ''
      });
      alert('Route created successfully!');
    } catch (error) {
      alert('Error creating route: ' + error.message);
    }
  };

  // Carpool Management
  const handleCreateCarpool = async (e) => {
    e.preventDefault();
    try {
      await createCarpool(carpoolForm);
      setCarpoolForm({
        type: 'offer',
        route: { from: '', to: '' },
        schedule: { departure: '', return: '', days: [] },
        vehicle: { make: '', model: '', year: '', color: '' },
        capacity: 4,
        cost: '',
        preferences: { smoking: false, music: true, conversation: 'optional' },
        notes: ''
      });
      alert('Carpool created successfully!');
    } catch (error) {
      alert('Error creating carpool: ' + error.message);
    }
  };

  const handleJoinCarpool = async (carpoolId) => {
    try {
      const name = prompt('Enter your name:');
      const phone = prompt('Enter your phone number (optional):');
      
      if (name) {
        await joinCarpool(carpoolId, { name, phone });
        alert('Successfully joined carpool!');
      }
    } catch (error) {
      alert('Error joining carpool: ' + error.message);
    }
  };

  // Ride Share Functions
  const handleJoinRide = (rideId) => {
    console.log('Joining ride:', rideId);
    // In a real app, this would make an API call
  };

  const handleRequestRide = (rideId) => {
    console.log('Requesting ride:', rideId);
    // In a real app, this would make an API call
  };

  const handleContactDriver = (driver) => {
    console.log('Contacting driver:', driver);
    // In a real app, this would open a chat or call
  };

  return (
    <div className="nr-dots-page min-h-screen text-white relative">
      {/* Simple CSS for Google Places Autocomplete */}
      <style jsx>{`
        .pac-container {
          background-color: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          margin-top: 4px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
          z-index: 1000 !important;
        }
        
        .pac-item {
          padding: 8px 12px !important;
          font-size: 14px !important;
          color: white !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .pac-item:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        
        .pac-item-selected {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
      `}</style>
      
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-full blur-2xl" />
      </div>

      {/* Navbar - fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-20 pt-4">
        <Navbar />
      </div>

      {/* Hero Section - starts from top */}
      <section className="nr-hero-bg nr-hero-starry relative flex min-h-screen items-center overflow-hidden pt-0">
      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Live Updates</h3>
              <button
                onClick={() => setNotifications([])}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'transit' ? 'bg-blue-400' : 'bg-green-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{notification.message}</p>
                    <p className="text-white/60 text-xs">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500/90 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 max-w-md mx-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
              <MdDirectionsBus className="text-blue-400 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">Welcome to Transportation!</h3>
              <p className="text-white/80 text-sm mb-4">
                Plan routes, find carpools, and track live transit. Start by entering your destination above!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem('hasUsedTransportation', 'true');
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Got it!
                </button>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="text-white/60 hover:text-white/80 text-sm transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowOnboarding(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

        <div className="relative z-10 w-full">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
          <div className="hero-orb absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-full blur-3xl" />
        </div>

          <div className="mx-auto w-full max-w-[110rem] px-4 py-14 pt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 items-start relative">
            {/* Portrait Ride Share Section - Left */}
            <div className="lg:col-span-1 order-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300 backdrop-blur-md h-fit"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MdGroup className="text-blue-400" />
                    </div>
                    Ride Share
                  </h2>
                  <button 
                    onClick={() => setShowRideShareForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <MdAdd className="text-sm" />
                    Offer/Request
                  </button>
                </div>
                
                {/* Vertical Tab Navigation */}
                <div className="space-y-2 mb-6">
                  {[
                    { id: 'routes', label: 'Routes', icon: MdRoute },
                    { id: 'rides', label: 'Available Rides', icon: MdDirectionsCar },
                    { id: 'requests', label: 'Ride Requests', icon: MdSearch }
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <IconComponent className="text-lg" />
                        <span className="font-medium text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content - Enhanced for wider space */}
                {activeTab === 'rides' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Available Rides</h3>
                    {rideShares.filter(ride => ride.type === 'offer').slice(0, 3).map((ride, index) => (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <MdPerson className="text-blue-400 text-sm" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{ride.driver.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <MdStar className="text-yellow-400 text-xs" />
                              <span>{ride.driver.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-white/80 text-xs font-medium">{ride.route.from} → {ride.route.to}</p>
                          <p className="text-white/60 text-xs">{ride.schedule.departure} • {ride.available}/{ride.seats} seats</p>
                          <p className="text-white/50 text-xs">{ride.route.distance} • {ride.vehicle}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 font-semibold text-sm">{ride.cost}</span>
                          <button
                            onClick={() => handleJoinRide(ride.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Join
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Ride Requests</h3>
                    {rideShares.filter(ride => ride.type === 'request').slice(0, 3).map((ride, index) => (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <MdPerson className="text-green-400 text-sm" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{ride.rider.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <MdStar className="text-yellow-400 text-xs" />
                              <span>{ride.rider.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-white/80 text-xs font-medium">{ride.route.from} → {ride.route.to}</p>
                          <p className="text-white/60 text-xs">{ride.schedule.departure} • {ride.seats} seat needed</p>
                          <p className="text-white/50 text-xs">{ride.route.distance} • {ride.status}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 font-semibold text-sm">{ride.cost}</span>
                          <button
                            onClick={() => handleRequestRide(ride.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Accept
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'routes' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white mb-3">Route Planning</h3>
                    <p className="text-white/60 text-xs">Use the route planning tools above to find the best transportation options.</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Main Hero Content */}
            <div className="lg:col-span-2 order-2 lg:order-2">
              {/* Single focused badge */}
              <div className="text-left transition-all duration-1000 opacity-100 translate-y-0">
                <div className="flex items-center justify-start mb-6">
                  <span className="inline-flex items-center gap-2 text-sm text-white/80 rounded-full bg-blue-500/10 px-4 py-2 border border-blue-500/20">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    Smart Transportation Hub
                  </span>
                </div>
              </div>

              {/* Enhanced headline with better typography and animations */}
              <div className="text-left transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  Get from{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                    A to B
                  </span>{" "}
                  the smart way
                </h1>
              </div>

              {/* Enhanced dual input search bar for Transportation */}
              <div className="mt-8 max-w-4xl transition-all duration-1000 delay-400 opacity-100 translate-y-0">
                <form onSubmit={handleSearchRoutes} role="search" aria-label="Route planning">
                  <div className="rounded-2xl border border-white/10 bg-white/5/50 p-4 backdrop-blur-md hover:bg-white/8/50 transition-all duration-300">
                    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#101215] px-4 py-5 hover:border-white/20 focus-within:border-amber-400/50 transition-all duration-200 relative">
                      {/* From Input with Autocomplete */}
                      <div className="flex items-center gap-3 flex-1 relative">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-white/60 text-sm font-medium">From</span>
                        </div>
                        {isGoogleMapsLoaded && !loadError ? (
                          <Autocomplete
                            onLoad={(ac) => {
                              console.log('From Autocomplete loaded:', ac);
                              fromAutocompleteRef.current = ac;
                            }}
                            onPlaceChanged={onFromPlaceChanged}
                            options={{
                              fields: ["place_id", "name", "formatted_address", "geometry"],
                              componentRestrictions: { country: "us" },
                              types: ["establishment", "geocode"]
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Campus, University"
                              value={fromLocation}
                              onChange={(e) => setFromLocation(e.target.value)}
                              className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none transition-all duration-500"
                              aria-label="Starting location"
                              autoComplete="off"
                            />
                          </Autocomplete>
                        ) : loadError ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter location manually (Google Maps unavailable)"
                              value={fromLocation}
                              onChange={(e) => setFromLocation(e.target.value)}
                              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none transition-all duration-500"
                              aria-label="Starting location"
                              autoComplete="off"
                            />
                            <div className="w-4 h-4 rounded-full bg-red-400" title="Google Maps unavailable"></div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Loading Google Maps..."
                              disabled
                              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none transition-all duration-500 cursor-not-allowed"
                              aria-label="Starting location"
                            />
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow Icon */}
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                      
                      {/* To Input with Autocomplete */}
                      <div className="flex items-center gap-3 flex-1 relative">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                          <span className="text-white/60 text-sm font-medium">To</span>
                        </div>
                        {isGoogleMapsLoaded && !loadError ? (
                          <Autocomplete
                            onLoad={(ac) => {
                              console.log('To Autocomplete loaded:', ac);
                              toAutocompleteRef.current = ac;
                            }}
                            onPlaceChanged={onToPlaceChanged}
                            options={{
                              fields: ["place_id", "name", "formatted_address", "geometry"],
                              componentRestrictions: { country: "us" },
                              types: ["establishment", "geocode"]
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Downtown, Mall"
                              value={toLocation}
                              onChange={(e) => setToLocation(e.target.value)}
                              className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none transition-all duration-500"
                              aria-label="Destination location"
                              autoComplete="off"
                            />
                          </Autocomplete>
                        ) : loadError ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter destination manually (Google Maps unavailable)"
                              value={toLocation}
                              onChange={(e) => setToLocation(e.target.value)}
                              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none transition-all duration-500"
                              aria-label="Destination location"
                              autoComplete="off"
                            />
                            <div className="w-4 h-4 rounded-full bg-red-400" title="Google Maps unavailable"></div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Loading Google Maps..."
                              disabled
                              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none transition-all duration-500 cursor-not-allowed"
                              aria-label="Destination location"
                            />
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Search Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-semibold text-black hover:from-amber-400 hover:to-orange-400 transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>Search</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Single Primary CTA */}
              <div className="mt-6 text-left transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                <button 
                  className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-[0_8px_24px_rgba(59,130,246,.4)] hover:shadow-[0_12px_32px_rgba(59,130,246,.5)] hover:scale-105 transition-all duration-300 hover:from-blue-400 hover:to-blue-500" 
                  type="button"
                >
                  <span>Plan Your Route</span>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </button>
              </div>

              {/* Active Routes Capsule */}
              <div className="mt-8 flex justify-start transition-all duration-1000 delay-800 opacity-100 translate-y-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/80">
                    <span className="font-bold text-amber-400">50+</span>
                    <span className="ml-1">Active Routes</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical Separator Line - Overlay */}
            <div className="hidden lg:block absolute left-1/3 top-1/2 transform -translate-y-1/2 z-20">
              <div className="w-px h-96 bg-gradient-to-b from-transparent via-white/20 to-transparent relative">
                {/* Animated dots along the line */}
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>

          </div>
        </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results */}
        {showResults && searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Route Options</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Real Google Maps Integration */}
              {showMap && isGoogleMapsLoaded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-white font-bold flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Interactive Route Map
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Live Directions</span>
                    </div>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden border border-white/10">
                    <GoogleMap
                      mapContainerStyle={MAP_STYLE}
                      center={mapCenter}
                      zoom={originLL && destinationLL ? 12 : 10}
                      options={MAP_OPTIONS}
                    >
                      {directions && (
                        <DirectionsRenderer
                          directions={directions}
                          options={{ 
                            suppressMarkers: false, 
                            polylineOptions: { 
                              strokeColor: "#3b82f6", 
                              strokeWeight: 4,
                              strokeOpacity: 0.8
                            }
                          }}
                        />
                      )}
                      
                      {originLL && (
                        <Marker
                          position={originLL}
                          title="Starting Point"
                          icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="8" fill="#10b981" stroke="white" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" fill="white"/>
                              </svg>
                            `),
                            scaledSize: new window.google.maps.Size(24, 24),
                            anchor: new window.google.maps.Point(12, 12)
                          }}
                        />
                      )}
                      
                      {destinationLL && (
                        <Marker
                          position={destinationLL}
                          title="Destination"
                          icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="white" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" fill="white"/>
                              </svg>
                            `),
                            scaledSize: new window.google.maps.Size(24, 24),
                            anchor: new window.google.maps.Point(12, 12)
                          }}
                        />
                      )}
                    </GoogleMap>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-white/60">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Start: {fromLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span>End: {toLocation}</span>
                      </div>
                    </div>
                    <div className="text-blue-400 font-medium">
                      {directions && `${directions.routes[0].legs[0].distance.text} • ${directions.routes[0].legs[0].duration.text}`}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Loading state for Google Maps */}
              {showMap && !isGoogleMapsLoaded && !loadError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="h-64 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3 animate-spin">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <h4 className="text-white font-bold mb-1">Loading Google Maps</h4>
                      <p className="text-white/60 text-sm">Preparing interactive route visualization...</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Error state for Google Maps */}
              {showMap && loadError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                >
                  <div className="h-64 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h4 className="text-white font-bold mb-1">Google Maps Error</h4>
                      <p className="text-white/60 text-sm mb-3">Unable to load Google Maps. Please check your API key configuration.</p>
                      <div className="text-xs text-white/40">
                        <p>• Ensure VITE_GOOGLE_MAPS_API_KEY is set in your .env file</p>
                        <p>• Verify the API key has Maps JavaScript API enabled</p>
                        <p>• Check that Places API and Directions API are enabled</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Filter and Sort Controls */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-white/80 text-sm font-medium">Method:</label>
                  <select
                    value={filters.method}
                    onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="all">All</option>
                    <option value="bus">Bus</option>
                    <option value="bike">Bike</option>
                    <option value="carpool">Carpool</option>
                    <option value="walk">Walk</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-white/80 text-sm font-medium">Cost:</label>
                  <select
                    value={filters.cost}
                    onChange={(e) => setFilters(prev => ({ ...prev, cost: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="all">All</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-white/80 text-sm font-medium">Sort by:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="duration">Duration</option>
                    <option value="cost">Cost</option>
                    <option value="method">Method</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memoizedRoutes?.map((route, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        route.method === 'bus' ? 'bg-blue-500/20' :
                        route.method === 'bike' ? 'bg-green-500/20' :
                        route.method === 'carpool' ? 'bg-orange-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        {route.method === 'bus' && <MdDirectionsBus className="text-xl text-blue-400" />}
                        {route.method === 'bike' && <MdDirectionsBike className="text-xl text-green-400" />}
                        {route.method === 'carpool' && <MdGroup className="text-xl text-orange-400" />}
                        {route.method === 'walk' && <MdDirectionsWalk className="text-xl text-gray-400" />}
                      </div>
                      <h4 className="font-bold text-white capitalize">{route.method}</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Duration:</span>
                        <span className="text-white font-medium">{route.duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Distance:</span>
                        <span className="text-white font-medium">{route.distance} mi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Cost:</span>
                        <span className="text-white font-medium">
                          {route.cost === 0 ? 'Free' : `$${route.cost}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Frequency:</span>
                        <span className="text-white font-medium">{route.frequency}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          try {
                            // Show this route on the map
                            if (route.directions) {
                              setDirections(route.directions);
                              setOriginLL(route.origin);
                              setDestinationLL(route.destination);
                              setMapCenter(route.origin);
                              setSelectedRoute(route);
                              setShowMap(true);
                              addNotification('success', 'Route displayed on map');
                            } else {
                              addNotification('error', 'Route directions not available');
                            }
                          } catch (error) {
                            console.error('Error displaying route:', error);
                            addNotification('error', 'Failed to display route on map');
                          }
                        }}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View on Map
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Save route to user's routes
                            const routeData = {
                              name: `${fromLocation} to ${toLocation}`,
                              from: fromLocation,
                              to: toLocation,
                              method: route.method || 'driving',
                              duration: route.duration || 'Unknown',
                              distance: route.distance || 'Unknown',
                              cost: route.cost || 0,
                              frequency: route.frequency || 'As needed'
                            };
                            await createRoute(routeData);
                            addNotification('success', 'Route saved successfully');
                            setShowResults(false);
                          } catch (error) {
                            console.error('Error saving route:', error);
                            addNotification('error', 'Failed to save route');
                          }
                        }}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Save Route
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Transportation Overview - Clean 3-Color Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MdDirectionsBus className="text-xl text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {dashboardData?.routes?.active || 0}
            </h3>
            <p className="text-white/60 text-sm">Active Routes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <MdGroup className="text-xl text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {dashboardData?.carpools?.driving || 0}
            </h3>
            <p className="text-white/60 text-sm">Carpools Available</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <MdSchedule className="text-xl text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {dashboardData?.transit?.active || 0}
            </h3>
            <p className="text-white/60 text-sm">Transit Routes</p>
          </motion.div>
        </div>

        {/* Cost Comparison - Help Students Save Money */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Save Money on Transportation</h2>
            <p className="text-white/60">Compare costs and find the best deals</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <MdDirectionsBike className="text-xl text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bike/Walk</h3>
              <div className="text-2xl font-bold text-green-400 mb-1">$0</div>
              <p className="text-white/60 text-sm">Free & healthy</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <MdGroup className="text-xl text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Carpool</h3>
              <div className="text-2xl font-bold text-blue-400 mb-1">$2-5</div>
              <p className="text-white/60 text-sm">Split gas costs</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <MdDirectionsBus className="text-xl text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Transit</h3>
              <div className="text-2xl font-bold text-orange-400 mb-1">$1-3</div>
              <p className="text-white/60 text-sm">Student discounts</p>
            </motion.div>
          </div>
        </div>

        {/* Transportation Features - NewRun Dashboard Style */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-2">How it works</h2>
            <p className="text-white/60">Simple, smart, student-focused</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <MdDirectionsBus className="text-xl text-blue-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Smart Route Planning</h4>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                AI-powered route optimization that considers traffic, weather, and your preferences to get you there fastest.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <MdGroup className="text-xl text-green-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Carpool Matching</h4>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Connect with fellow students for shared rides. Save money, reduce emissions, and make new friends.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <MdSchedule className="text-xl text-orange-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Real-time Updates</h4>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Live transit updates, traffic alerts, and instant notifications keep you informed and on time.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <MdLightbulb className="text-xl text-green-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">AI Transportation Insights</h2>
                    </div>
              <div className="space-y-4">
                {sampleInsights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                    >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-green-500/20 rounded-lg">
                                <MdTrendingUp className="text-xl text-green-400" />
                              </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                          <p className="text-white/70 text-sm mb-3">{insight.message}</p>
                          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                            {insight.action} →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>


            {/* Route Options */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <MdLocationOn className="text-purple-400" />
                  </div>
                  Route Options
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Recommended</span>
                </div>
              </div>
              <div className="space-y-3">
                {sampleRoutes.map((route, index) => {
                  const IconComponent = route.icon;
                  return (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${route.color} shadow-lg`}>
                            <IconComponent className="text-2xl text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">{route.method}</h3>
                            <p className="text-white/80 text-sm font-medium">{route.from} → {route.to}</p>
                            <div className="flex items-center gap-4 text-sm text-white/70 mt-2">
                              <div className="flex items-center gap-1">
                                <MdAccessTime className="text-sm" />
                                <span>{route.duration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MdAttachMoney className="text-sm" />
                                <span>{route.cost}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MdSchedule className="text-sm" />
                                <span>{route.frequency}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg shadow-blue-500/25"
                          >
                            Select Route
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Transit - Enhanced */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <MdDirectionsBus className="text-blue-400" />
                  </div>
                  Live Transit
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{transit.length} Routes</span>
                </div>
              </div>
              
              {transit.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <MdDirectionsBus className="text-2xl text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No transit data available</h3>
                  <p className="text-white/60 text-sm">Check back later for live updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoizedTransit.map((transitItem, index) => (
                    <motion.div
                      key={transitItem._id || transitItem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full animate-pulse ${
                            transitItem.status === 'delayed' ? 'bg-red-400' : 'bg-green-400'
                          }`}></div>
                          <h3 className="font-bold text-white text-lg">{transitItem.line}</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transitItem.status === 'delayed' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {transitItem.status === 'delayed' ? `+${transitItem.delay}min` : transitItem.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <MdLocationOn className="text-white/60 text-sm" />
                        <p className="text-white/80 text-sm font-medium">{transitItem.destination}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-white/70">
                            <MdAccessTime className="text-sm" />
                            <span>Next: {transitItem.nextArrival}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/70">
                            <MdSchedule className="text-sm" />
                            <span>{transitItem.frequency}</span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200">
                          Track
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {transit.length > 3 && (
                    <div className="text-center pt-4">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                        View {transit.length - 3} more routes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available Carpools - Enhanced */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <MdGroup className="text-green-400" />
                  </div>
                  Available Carpools
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{carpools.length} Available</span>
                </div>
              </div>
              
              {carpools.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <MdGroup className="text-2xl text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No carpools available</h3>
                  <p className="text-white/60 text-sm mb-4">Be the first to offer a ride!</p>
                  <button
                    onClick={() => setShowRideShareForm(true)}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Offer a Ride
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoizedCarpools.map((carpool, index) => (
                    <motion.div
                      key={carpool._id || carpool.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                            <MdPerson className="text-white text-lg" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">
                              {carpool.driver?.name || 'Driver'}
                            </h3>
                            <div className="flex items-center gap-1">
                              <MdStar className="text-yellow-400 text-sm" />
                              <span className="text-white/80 text-sm font-medium">
                                {carpool.driver?.rating || '5.0'}
                              </span>
                              <span className="text-white/60 text-xs">• Verified</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold text-lg">
                            ${carpool.cost}
                          </div>
                          <div className="text-white/60 text-xs">per person</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <MdLocationOn className="text-white/60 text-sm" />
                        <p className="text-white/80 text-sm font-medium">
                          {carpool.route?.from} → {carpool.route?.to}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-white/70">
                            <MdAccessTime className="text-sm" />
                            <span>{carpool.schedule?.departure}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/70">
                            <MdGroup className="text-sm" />
                            <span>{carpool.capacity?.available} seats</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleJoinCarpool(carpool._id || carpool.id)}
                          className="opacity-0 group-hover:opacity-100 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                        >
                          Join
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/60">
                          {carpool.schedule?.days?.join(', ') || 'Daily'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Available</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {carpools.length > 3 && (
                    <div className="text-center pt-4">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                        View {carpools.length - 3} more carpools
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Ride Share Form Drawer */}
      <NewRunDrawer
        isOpen={showRideShareForm}
        onClose={() => setShowRideShareForm(false)}
        title="Offer/Request Ride"
        width="w-full sm:w-96"
        maxWidth="max-w-md"
      >
        <form className="h-full flex flex-col">
          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Type</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 transition-colors">
                  <option value="offer">Offer Ride</option>
                  <option value="request">Request Ride</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">From</label>
                <input
                  type="text"
                  placeholder="Starting location"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">To</label>
                <input
                  type="text"
                  placeholder="Destination"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Cost per person</label>
                <input
                  type="text"
                  placeholder="$5.00"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Seats available</label>
                <input
                  type="number"
                  placeholder="3"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Notes</label>
                <textarea
                  placeholder="Any additional information..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 h-20 resize-none focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
          </div>
          
          {/* Footer with Navigation */}
          <div className="p-6 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRideShareForm(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreateCarpool}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-2 px-4 rounded-lg transition-colors font-semibold"
              >
                Submit Ride
              </button>
            </div>
          </div>
        </form>
      </NewRunDrawer>

      {/* Floating Quick Actions Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 left-8 z-50"
      >
        {!isQuickActionsOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsQuickActionsOpen(true)}
            className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-full shadow-2xl shadow-orange-500/25 flex items-center justify-center group transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: isQuickActionsOpen ? 45 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <MdSchedule className="text-white text-xl" />
            </motion.div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </motion.button>
        )}

        {/* Expanded State - Quick Actions Menu */}
        <AnimatePresence>
          {isQuickActionsOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
              className="w-80 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <MdSchedule className="text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <button
                    onClick={() => setIsQuickActionsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Actions List */}
              <div className="p-2">
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-blue-500/30 hover:border-blue-400/50 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                      <MdRoute className="text-blue-400 text-sm" />
                    </div>
                    <span className="text-sm">Plan New Route</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                      <MdGroup className="text-green-400 text-sm" />
                    </div>
                    <span className="text-sm">Join Carpool</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                      <MdLocationOn className="text-purple-400 text-sm" />
                    </div>
                    <span className="text-sm">View Transit Map</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-between group border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                      <MdLightbulb className="text-orange-400 text-sm" />
                    </div>
                    <span className="text-sm">AI Route Optimization</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Transportation;