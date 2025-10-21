# NewRun User Access Flow - Complete Analysis

## Quick Overview
When a user types `newrun.club` in their browser, here's what happens:

1. ✅ Vercel serves React app from CDN
2. ✅ React mounts and initializes providers
3. ✅ AuthProvider checks localStorage for JWT token
4. ✅ If token exists → validates with backend
5. ✅ Routes render based on auth status
6. ✅ Unauthenticated users see LandingPage
7. ✅ Authenticated users see dashboard/protected pages

---

## Detailed Step-by-Step Flow

### 1. Domain & Infrastructure
- **Frontend**: Hosted on Vercel (https://newrun.club, https://www.newrun.club)
- **Backend**: Hosted separately (https://api.newrun.club)
- **Database**: MongoDB Atlas (Cloud)
- **Real-time**: Socket.IO for WebSocket connections

### 2. Browser Request
```
User enters: newrun.club
    ↓
DNS resolves to Vercel CDN
    ↓
Vercel serves index.html
```

### 3. HTML & Initial Load
**File**: `/frontend/index.html`
- Mounts React root element: `<div id="root">`
- Loads entry script: `/src/main.tsx`
- Loads Google fonts (Pacifico)

**File**: `/frontend/src/main.tsx`
```jsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  </React.StrictMode>
);
```

### 4. Provider Stack Initialization
**File**: `/frontend/src/App.jsx`

The app is wrapped in multiple providers (in order):
```
QueryClientProvider (React Query - caching)
  ↓
AuthProvider (JWT token validation) ← KEY COMPONENT
  ↓
UnifiedStateProvider (Global state)
  ↓
UserStatusProvider (User status)
  ↓
EmailServiceProvider (Email handling)
  ↓
HeroUIProvider (UI library)
  ↓
Router (React Router v6)
  ↓
RouteGuard (History prevention)
  ↓
Routes (All route definitions)
```

### 5. CRITICAL: AuthProvider Authentication Check
**File**: `/frontend/src/context/AuthContext.jsx`

When AuthProvider mounts, it executes this flow:

```javascript
useEffect(() => {
  const checkAuthStatus = async () => {
    // Step 1: Check localStorage for token
    const existingToken = localStorage.getItem('accessToken') 
                          || localStorage.getItem('token')
                          || localStorage.getItem('userToken');
    
    if (existingToken) {
      // Step 2: Token exists - set preliminary state
      setToken(existingToken);
      setIsAuthenticated(true);
      
      // Step 3: Validate token with backend
      try {
        const response = await axiosInstance.get('/get-user');
        
        if (response.data && response.data.user) {
          // Step 4a: Token valid - store user data
          setUser(response.data.user);
          setLoading(false);
          // User is now fully authenticated
        } else {
          // Step 4b: Invalid response - logout
          throw new Error('Invalid user data');
        }
      } catch (error) {
        // Token validation failed - clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('userToken');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    } else {
      // Step 5: No token found - clean state
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  };
  
  checkAuthStatus();
}, []); // Runs once on app mount
```

**Result States**:
- **Authenticated**: `{ isAuthenticated: true, user: userData, loading: false }`
- **Not Authenticated**: `{ isAuthenticated: false, user: null, loading: false }`
- **Loading**: `{ loading: true }` (shown to user while checking)

### 6. Router Matches Current Path
**File**: `/frontend/src/App.jsx` - Routes 70-200

**PUBLIC ROUTES** (No authentication needed):
- `/` → LandingPage
- `/login` → Login page
- `/signup` → Sign up page
- `/marketplace` → Browse marketplace
- `/community` → Community threads
- `/all-properties` → Property listings
- `/help`, `/terms`, `/privacy`, `/cookies` → Info pages

**PROTECTED ROUTES** (Authentication required):
- `/dashboard` → User dashboard (wrapped in `<ProtectedRoute>`)
- `/profile` → User profile (wrapped in `<ProtectedRoute>`)
- `/onboarding` → Onboarding flow (wrapped in `<ProtectedRoute>`)
- `/messaging` → Messages (wrapped in `<ProtectedRoute>`)
- `/properties/:id` → Property details (wrapped in `<ProtectedRoute>`)
- `/marketplace/item/:id` → Item details (wrapped in `<ProtectedRoute>`)

### 7. ProtectedRoute Component
**File**: `/frontend/src/components/ProtectedRoute/ProtectedRoute.jsx`

When accessing a protected route:

```javascript
if (loading || isValidating || !validationComplete) {
  // Show loading spinner while checking authentication
  return <LoadingSpinner message="Checking authentication..." />;
}

if (!isAuthenticated) {
  // Not authenticated - redirect to login
  return <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

// Authenticated - render the protected component
return children;
```

**Features**:
- 5-second debounce on validation (prevents race conditions)
- Loading spinner with animation
- Preserves original path for redirect-after-login

### 8. SCENARIO A: New/Unauthenticated User

1. **User visits**: newrun.club
2. **AuthProvider runs**: No token found
3. **State**: `isAuthenticated=false, loading=false`
4. **Route matches**: `/` → LandingPage
5. **LandingPage renders** with:
   - Navbar with Sign Up / Login buttons
   - Hero: "Your Campus. Your People. Your Start in the U.S."
   - Feature showcase
   - Call-to-action buttons
   - Marketplace preview
   - Community threads preview
6. **User can**:
   - Sign Up → `/signup` (create account)
   - Login → `/login` (existing account)
   - Browse public pages (marketplace, community, properties)

### 9. Sign Up Flow
1. User clicks "Sign Up"
2. Navigates to `/signup` → SignUp component
3. Fills form: email, password, name, etc.
4. Submits: Backend creates user in MongoDB
5. Backend sends email verification OTP
6. User verifies email
7. Backend generates JWT token
8. Token stored in localStorage
9. Redirect to `/onboarding`
10. ProtectedRoute now allows access
11. UnifiedOnboarding component loads

### 10. SCENARIO B: Returning Authenticated User

1. **User visits**: newrun.club
2. **AuthProvider runs**:
   - Finds token in localStorage
   - Calls `GET /get-user` API endpoint
   - Backend validates JWT token
   - Returns user data: `{ _id, email, firstName, lastName, ... }`
3. **State**: `isAuthenticated=true, user=userData, loading=false`
4. **Route matches**: `/` → LandingPage OR redirects to `/dashboard`
5. **User sees**:
   - Authenticated navigation bar
   - Personalized content
   - Quick links to dashboard, profile, etc.

### 11. Protected Page Access Flow

When authenticated user visits protected page like `/dashboard`:

```
User navigates to /dashboard
    ↓
ProtectedRoute component checks:
  ├─ loading=false? ✓
  ├─ isAuthenticated=true? ✓
  └─ Render UserDashboard component ✓
    ↓
UserDashboard loads and displays:
  ├─ Saved properties
  ├─ Roommate matches
  ├─ Messages
  ├─ Notifications
  └─ Recent activity
```

---

## API Endpoints Called

### On App Load

**1. GET /get-user** (if token exists)
```
Request:
  Method: GET
  URL: https://api.newrun.club/get-user
  Headers: Authorization: Bearer <JWT_TOKEN>

Response:
  {
    user: {
      _id: "...",
      email: "user@university.edu",
      firstName: "John",
      lastName: "Doe",
      profilePicture: "...",
      universityDomain: "harvard.edu",
      status: "active",
      ...
    }
  }

Purpose: Validate JWT token & fetch current user data
Triggers: During AuthProvider initialization
```

**2. GET /contact-access/inbox?status=pending** (Navbar notification)
```
Request:
  Method: GET
  URL: https://api.newrun.club/contact-access/inbox?status=pending
  Headers: Authorization: Bearer <JWT_TOKEN>

Response:
  {
    items: [
      { _id: "...", fromUser: {...}, message: "..." },
      ...
    ]
  }

Purpose: Load pending contact requests for notification bell
Triggers: After user data loads (in Navbar component)
```

### Backend Server Configuration

**File**: `/backend/index.js`

```javascript
// Express & Server Setup
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

// CORS Configuration (whitelisted domains)
app.use(cors({ 
    origin: ["https://newrun.club", "https://www.newrun.club", "http://localhost:3000"],
    credentials: true
}));

// Socket.IO Setup
const io = require('socket.io')(server, { 
    cors: { 
        origin: ["https://newrun.club", "https://www.newrun.club", "http://localhost:3000"], 
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

### Database Connection

**MongoDB Atlas** (Cloud):
```
Connection String: mongodb+srv://varun-admin:...@newrun-db.uber24x.mongodb.net/
Default Database: newrun-db (or test)
ODM: Mongoose v8.17.1
```

### Socket.IO Real-Time Events

```
Connection URL: https://api.newrun.club (or http://localhost:8000)

Client-side events (Navbar.jsx):
1. registerUser(userId) - Register user for real-time updates
2. Listen: contact_request:new - New contact request
3. Listen: contact_request:updated - Contact request updated
```

---

## Error Handling

### 401 Unauthorized Response

**File**: `/frontend/src/utils/axiosInstance.js` (lines 62-86)

When any API returns 401:
```javascript
if (status === 401 && !isHandling401) {
  isHandling401 = true;
  
  // 1. Clear tokens
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userToken");
  
  // 2. Log error
  console.warn('401 Unauthorized - clearing tokens and redirecting to login');
  
  // 3. Redirect after short delay
  setTimeout(() => {
    navigate("/login?error=session_expired");
  }, 100);
}
```

**User sees**: Login page with error message "Your session has expired"

### Session Expiry Management

- Token stored in localStorage
- On each API call, token automatically included in Authorization header
- If token expires → Next API call returns 401 → User redirected to login
- Debouncing prevents race conditions

### Cross-Tab Logout

**File**: `/frontend/src/context/AuthContext.jsx` (lines 66-80)

```javascript
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === 'accessToken' || e.key === 'token') {
      if (!e.newValue) {
        // Token was removed in another tab
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        // User automatically logged out in this tab too
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

**Behavior**: If user logs out in Tab A, Tab B automatically logs them out

---

## Performance Optimizations

### 1. React Query Caching
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
```
- Prevents duplicate API calls for same data
- Automatic cache invalidation

### 2. Token Validation Debouncing
- ProtectedRoute validates token max every 5 seconds
- Prevents race conditions from rapid validations

### 3. Lazy Loading
- LandingPage globe component (3D) loads only when visible
- Uses Intersection Observer API

### 4. Axios Request Interceptor
- Auto-attaches JWT token to all requests
- Centralized token management

### 5. API Rewriting (Vercel)
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.newrun.club/:path*" },
    { "source": "/((?!.*\\..*).*)", "destination": "/" }
  ]
}
```
- Prevents CORS issues during development
- Single origin for frontend

---

## Environment Configuration

### Frontend Deployment (Vercel)

**File**: `/frontend/vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.newrun.club/:path*" },
    { "source": "/socket.io/:path*", "destination": "https://api.newrun.club/socket.io/:path*" },
    { "source": "/((?!.*\\..*).*)", "destination": "/" }
  ]
}
```

### Frontend Environment Variables

```
VITE_API_BASE_URL=https://api.newrun.club
```

### Backend Environment Variables

```
PORT=8000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
DB_NAME=newrun-db
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BACKEND_URL=https://api.newrun.club
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User types: newrun.club                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ DNS → Vercel CDN             │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ Serve index.html             │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ Load React App (main.tsx)    │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ Initialize Providers         │
        │ Including AuthProvider       │
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ Check localStorage for token │
        └────────────┬─────────────────┘
              ╱───────┴────────╲
             ╱                  ╲
    Token EXISTS          Token NOT FOUND
          │                      │
          ↓                      ↓
   Call /get-user    ┌─────────────────────┐
          │          │ isAuthenticated=FALSE
          ↓          │ user=null
    ┌──────────┐     │ loading=false
    │ VALID ✓  │     └──────────┬──────────┘
    │ or ERROR │                ↓
    └────┬─────┘         Route: /
         │           LandingPage renders
    ┌────┴──────┐      ├─ Sign Up
    │ VALID ✓   │      ├─ Login
    │ or ERROR  │      └─ Browse
    └────┬──────┘
         │
    ┌────┴──────────────┐
    │ isAuthenticated=   │
    │ true or false      │
    │ user=userData      │
    │ loading=false      │
    └────┬──────────────┘
         │
    ┌────┴──────────────┐
    │ Route Resolution  │
    └────┬──────────────┘
         │
    ┌────┴──────────────────────────┐
    │ Protected Route?               │
    │ ├─ NO → Render Public Page    │
    │ └─ YES → Check isAuthenticated│
    │      ├─ YES → Render Protected│
    │      └─ NO → Redirect /login  │
    └───────────────────────────────┘
```

---

## Summary

✅ **Complete Access Flow**:
1. Browser requests newrun.club
2. Vercel serves React app
3. AuthProvider checks localStorage for JWT token
4. If token exists → validates with backend (/get-user)
5. Routes render based on authentication status
6. Unauthenticated users → LandingPage (public)
7. Authenticated users → Dashboard/Protected pages
8. All API calls include JWT automatically
9. Error handling redirects to login on auth failure
10. Real-time updates via Socket.IO

✅ **Key Files**:
- Frontend: `/frontend/src/App.jsx`, `/frontend/src/context/AuthContext.jsx`
- Backend: `/backend/index.js`
- Routes: `/frontend/src/App.jsx` (lines 70-200)
- Protected Route: `/frontend/src/components/ProtectedRoute/ProtectedRoute.jsx`
- Axios: `/frontend/src/utils/axiosInstance.js`
