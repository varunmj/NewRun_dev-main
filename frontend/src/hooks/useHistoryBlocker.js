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

    // Block forward button navigation to protected routes
    const handleNavigation = (event) => {
      // Never block hash navigation on public legal/help pages
      const publicAlwaysAccessible = [
        '/',
        '/login',
        '/signup',
        '/help',
        '/terms',
        '/privacy',
        '/cookies',
        '/cookies/settings'
      ];
      if (publicAlwaysAccessible.some(p => window.location.pathname.startsWith(p))) {
        return;
      }
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/messaging',
        '/Synapse',
        '/marketplace/item',
        '/marketplace/create',
        '/marketplace/edit',
        '/properties',
        '/requests',
        '/Synapsematches'
      ];

      const isProtectedRoute = protectedRoutes.some(route => 
        window.location.pathname.startsWith(route)
      );

      if (isProtectedRoute) {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
        if (!token) {
          console.log('🚫 Unauthorized access to protected route via navigation');
          navigate('/login', { replace: true });
        }
      }
    };

    // Block all navigation attempts to protected routes
    const handleBeforeUnload = (event) => {
      const publicAlwaysAccessible = [
        '/help',
        '/terms',
        '/privacy',
        '/cookies',
        '/cookies/settings'
      ];
      if (publicAlwaysAccessible.some(p => window.location.pathname.startsWith(p))) {
        return;
      }
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/messaging',
        '/Synapse',
        '/marketplace/item',
        '/marketplace/create',
        '/marketplace/edit',
        '/properties',
        '/requests',
        '/Synapsematches'
      ];

      const isProtectedRoute = protectedRoutes.some(route => 
        window.location.pathname.startsWith(route)
      );

      if (isProtectedRoute) {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
        if (!token) {
          console.log('🚫 Unauthorized access attempt blocked');
          event.preventDefault();
          navigate('/login', { replace: true });
          return false;
        }
      }
    };

    // Add the event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('hashchange', handleNavigation);

    // Push a state to the history stack to enable blocking
    window.history.pushState(null, '', window.location.href);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, [shouldBlock, navigate, location]);
};

export default useHistoryBlocker;
