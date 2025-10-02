// BULLETPROOF LOGOUT UTILITIES
// These functions work outside of React Router context

export const forceLogout = () => {
  console.log('🚫 FORCE LOGOUT: Clearing everything and redirecting');
  
  // Clear ALL storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any cookies (if any)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Force redirect to login (absolute URL)
  window.location.href = '/login';
  
  // Backup: if the above doesn't work, try replace
  setTimeout(() => {
    window.location.replace('/login');
  }, 100);
};

export const blockBackNavigation = () => {
  // Push a state to enable popstate detection
  window.history.pushState(null, '', window.location.href);
  
  const handlePopState = (event) => {
    // If on public legal/help pages, do not redirect
    const publicAlwaysAccessible = ['/help','/terms','/privacy','/cookies','/cookies/settings'];
    if (publicAlwaysAccessible.some(p => window.location.pathname.startsWith(p))) {
      return;
    }
    console.log('🚫 BACK BUTTON BLOCKED: Redirecting to login');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };
  
  // Add the event listener
  window.addEventListener('popstate', handlePopState);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return !!token;
};
