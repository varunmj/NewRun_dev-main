import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react'; // ⬅️ moved from @heroui/react
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { UnifiedStateProvider } from './context/UnifiedStateContext.jsx';
import { UserStatusProvider } from './context/UserStatusContext.jsx';
import { EmailServiceProvider } from './components/EmailService.jsx';

// pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import ResetPassword from './pages/ResetPassword';
import AllProperties from './pages/AllProperties';
import UserDashboard from './pages/UserDashboard';
import SignUp from './pages/SignUp';
import UniversityPage from './pages/University';
import Blogs from './pages/Blogs';
import Community from './pages/Community';
import Thread from './pages/Thread';
import Marketplace from './pages/Marketplace';
import MarketplaceItemDetails from './pages/MarketplaceItemDetails';
import AddEditItem from './pages/AddEditItem';
import PropertyDetails from './pages/PropertyDetails';
import UserProfile from './pages/UserProfile';
import MessagingPage from './pages/MessagingPage';
import Roommate from './pages/Roommate';
import Waitlist from "./pages/Waitlist";
import UnifiedOnboarding from "./components/Onboarding/UnifiedOnboarding";
import ContactRequestsPage from "./pages/ContactRequests";
import RoommateMatches from "./pages/RoommateMatches";
import SolveThreads from "./pages/SolveThreads";
import NotFound from "./pages/NotFound";
import RouteGuard from "./components/Auth/RouteGuard";

// Service pages
import SimCards from "./pages/services/SimCards";
import Banking from "./pages/services/Banking";
import HealthInsurance from "./pages/services/HealthInsurance";
import Visa from "./pages/services/Visa";
import Tax from "./pages/services/Tax";
import Credit from "./pages/services/Credit";
import Food from "./pages/services/Food";
import Loans from "./pages/services/Loans";
import Courses from "./pages/services/Courses";
// New Platform Entities - Temporarily disabled (moved to Upcoming Features)
// import StudentFinance from "./pages/StudentFinance";
// import AcademicHub from "./pages/AcademicHub";
// import Transportation from "./pages/Transportation";
import HelpCenter from "./pages/HelpCenter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import CookieSettings from "./pages/CookieSettings";
// guards
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
      // Store the token and redirect to dashboard
      localStorage.setItem('accessToken', token);
      // Clean up URL and redirect
      window.history.replaceState({}, document.title, '/dashboard');
      window.location.href = '/dashboard';
    } else if (error) {
      // Handle OAuth error
      console.error('OAuth error:', error);
      window.history.replaceState({}, document.title, '/login?oauth_error=' + error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UnifiedStateProvider>
          <UserStatusProvider>
            <EmailServiceProvider>
              <HeroUIProvider>
            <Router>
              <RouteGuard>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/cookies/settings" element={<CookieSettings />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/thread/:id" element={<Thread />} />
          <Route path="/university" element={<UniversityPage />} />
          <Route path="/all-properties" element={<AllProperties />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <UnifiedOnboarding />
              </ProtectedRoute>
            }
          />
          <Route path="/waitlist" element={<Waitlist />} />

          {/* Protected */}
          <Route
            path="/marketplace/item/:id"
            element={
              <ProtectedRoute>
                <MarketplaceItemDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/create"
            element={
              <ProtectedRoute>
                <AddEditItem isEdit={false} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/edit/:id"
            element={
              <ProtectedRoute>
                <AddEditItem isEdit={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:id"
            element={
              <ProtectedRoute>
                <PropertyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messaging"
            element={
              <ProtectedRoute>
                <MessagingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messaging/:conversationId"
            element={
              <ProtectedRoute>
                <MessagingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Synapse"
            element={
              <ProtectedRoute>
                <Roommate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solve-threads"
            element={
              <ProtectedRoute>
                <SolveThreads />
              </ProtectedRoute>
            }
          />

          {/* Service Routes */}
          <Route
            path="/services/sim-cards"
            element={
              <ProtectedRoute>
                <SimCards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/banking"
            element={
              <ProtectedRoute>
                <Banking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/health-insurance"
            element={
              <ProtectedRoute>
                <HealthInsurance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/visa"
            element={
              <ProtectedRoute>
                <Visa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/tax"
            element={
              <ProtectedRoute>
                <Tax />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/credit"
            element={
              <ProtectedRoute>
                <Credit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/food"
            element={
              <ProtectedRoute>
                <Food />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/loans"
            element={
              <ProtectedRoute>
                <Loans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />

          {/* Additional Routes */}
          <Route path="/requests" element={<ContactRequestsPage />} />
          <Route path="/Synapsematches" element={<RoommateMatches />} />

          {/* New Platform Entities - Temporarily disabled (moved to Upcoming Features) */}
          {/* <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <StudentFinance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic"
            element={
              <ProtectedRoute>
                <AcademicHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transport"
            element={
              <ProtectedRoute>
                <Transportation />
              </ProtectedRoute>
            }
          /> */}

          {/* 404 Page - Catch-all route must be LAST */}
          <Route path="*" element={<NotFound />} />
              </Routes>
              </RouteGuard>
            </Router>
              </HeroUIProvider>
            </EmailServiceProvider>
          </UserStatusProvider>
        </UnifiedStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
