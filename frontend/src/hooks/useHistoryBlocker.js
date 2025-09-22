import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useHistoryBlocker = (shouldBlock = false) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!shouldBlock) return;

    // Block back button navigation
    const handlePopState = (event) => {
      console.log('🚫 History blocked - preventing back navigation');
      
      // Push current state back to prevent going back
      window.history.pushState(null, '', window.location.href);
      
      // Force redirect to login
      navigate('/login', { replace: true });
    };

    // Add the event listener
    window.addEventListener('popstate', handlePopState);

    // Push a state to the history stack to enable blocking
    window.history.pushState(null, '', window.location.href);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock, navigate, location]);
};

export default useHistoryBlocker;
