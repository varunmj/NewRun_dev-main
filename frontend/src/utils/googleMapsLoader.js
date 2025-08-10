// googleMapsLoader.js
import { useJsApiLoader } from '@react-google-maps/api';

// Google Maps API Loader Config
const googleMapsConfig = {
  googleMapsApiKey: 'AIzaSyBvfh13gslAxdnCUBlTjXEaMfzXSIKWCIk',
  libraries: ['places'], // Ensure you are using a consistent set of libraries
};

// Custom Hook to Load Google Maps API
export const useGoogleMapsLoader = () => {
  return useJsApiLoader(googleMapsConfig);
};
