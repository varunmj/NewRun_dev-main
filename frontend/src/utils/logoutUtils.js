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
    console.log('🚫 BACK BUTTON BLOCKED: Redirecting to login');
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
    // Force redirect
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
