import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const usePreventBackNavigation = (shouldPrevent = false) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!shouldPrevent) return;

    // Prevent back button navigation
    const handlePopState = (event) => {
      // Push the current state back to prevent going back
      window.history.pushState(null, '', window.location.href);
      
      // Optionally redirect to home
      navigate('/', { replace: true });
    };

    // Add the event listener
    window.addEventListener('popstate', handlePopState);

    // Push a state to the history stack
    window.history.pushState(null, '', window.location.href);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldPrevent, navigate]);
};

export default usePreventBackNavigation;
