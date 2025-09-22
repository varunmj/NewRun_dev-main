// Route validation utility for testing
export const ROUTES = {
  // Public routes
  PUBLIC: [
    '/',
    '/home',
    '/login',
    '/signup',
    '/marketplace',
    '/blogs',
    '/community',
    '/university',
    '/students',
    '/welcome',
    '/experiment',
    '/all-properties',
    '/onboarding',
    '/waitlist',
  ],
  
  // Protected routes
  PROTECTED: [
    '/dashboard',
    '/profile',
    '/chatbot',
    '/messaging',
    '/messaging/123', // Example with param
    '/Synapse',
    '/marketplace/item/123', // Example with param
    '/marketplace/create',
    '/marketplace/edit/123', // Example with param
    '/properties/123', // Example with param
  ],
  
  // Additional routes
  ADDITIONAL: [
    '/requests',
    '/Synapsematches',
  ],
  
  // Test invalid routes (should show 404)
  INVALID: [
    '/invalid-route',
    '/nonexistent',
    '/test/404',
  ]
};

export const validateRoute = (path) => {
  const allRoutes = [
    ...ROUTES.PUBLIC,
    ...ROUTES.PROTECTED,
    ...ROUTES.ADDITIONAL
  ];
  
  return allRoutes.includes(path);
};

export const getRouteType = (path) => {
  if (ROUTES.PUBLIC.includes(path)) return 'public';
  if (ROUTES.PROTECTED.includes(path)) return 'protected';
  if (ROUTES.ADDITIONAL.includes(path)) return 'additional';
  return 'invalid';
};
