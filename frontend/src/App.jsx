import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react'; // ⬅️ moved from @heroui/react

// pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AllProperties from './pages/AllProperties';
import UserDashboard from './pages/UserDashboard';
import SignUp from './pages/SignUp';
import UniversityPage from './pages/University';
import StudentPage from './pages/Student';
import ChatbotPage from './pages/Chatbot';
import Blogs from './pages/Blogs';
import Community from './pages/Community';
import Marketplace from './pages/Marketplace';
import MarketplaceItemDetails from './pages/MarketplaceItemDetails';
import AddEditItem from './pages/AddEditItem';
import PropertyDetails from './pages/PropertyDetails';
import UserProfile from './pages/UserProfile';
import ChatbotUI from './components/ChatBotUI/ChatbotUI';
import Welcome from './pages/welcomepage';
import MessagingPage from './pages/MessagingPage';
import Roommate from './pages/Roommate';
import OnboardingFlow from "./onboarding/OnboardingFlow";
// guards
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

const App = () => {
  return (
    <HeroUIProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/community" element={<Community />} />
          <Route path="/university" element={<UniversityPage />} />
          <Route path="/students" element={<StudentPage />} />
          <Route path="/welcome" element={<ChatbotPage />} />
          <Route path="/experiment" element={<Welcome />} />
          <Route path="/all-properties" element={<AllProperties />} />

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
            path="/chatbot"
            element={
              <ProtectedRoute>
                <ChatbotUI />
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
            path="/roommate"
            element={
              <ProtectedRoute>
                <Roommate />
              </ProtectedRoute>
            }
          />

          <Route path="/onboarding" element={<OnboardingFlow />} />

          {/* Catch-all → home (prevents blank screens) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </HeroUIProvider>
  );
};

export default App;
