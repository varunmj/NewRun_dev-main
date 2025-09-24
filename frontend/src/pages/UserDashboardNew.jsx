import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdHome, MdShoppingBag, MdGroups, MdChat, MdSearch, MdFavorite,
  MdTrendingUp, MdVisibility, MdMessage, MdAdd, MdArrowForward,
  MdPerson, MdSettings, MdNotifications, MdHistory, MdStar
} from "react-icons/md";

import Navbar from "../components/Navbar/Navbar";
import axiosInstance from "../utils/axiosInstance";
import "../styles/newrun-hero.css";

/* -------------------------- Dashboard Components -------------------------- */

// Quick Stats Card Component
function StatCard({ title, value, icon: Icon, trend, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-500/10 border-blue-400/20 text-blue-300",
    green: "bg-green-500/10 border-green-400/20 text-green-300", 
    purple: "bg-purple-500/10 border-purple-400/20 text-purple-300",
    orange: "bg-orange-500/10 border-orange-400/20 text-orange-300"
  };

  return (
    <div className={`rounded-xl border ${colorClasses[color]} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-xs text-white/60 mt-1">{trend}</p>
          )}
        </div>
        <Icon className="text-2xl opacity-60" />
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ type, title, description, timestamp, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-300",
    green: "bg-green-500/10 text-green-300",
    purple: "bg-purple-500/10 text-purple-300",
    orange: "bg-orange-500/10 text-orange-300"
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-white/70">{description}</p>
        <p className="text-xs text-white/50 mt-1">{timestamp}</p>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ title, description, icon: Icon, onClick, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    purple: "bg-purple-500 hover:bg-purple-600",
    orange: "bg-orange-500 hover:bg-orange-600"
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl ${colorClasses[color]} text-white transition-colors text-left`}
    >
      <div className="flex items-center gap-3">
        <Icon className="text-xl" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
        <MdArrowForward className="ml-auto" />
      </div>
    </button>
  );
}

// Property/Marketplace Item Card Component
function ItemCard({ item, type, onEdit, onDelete, onView }) {
  const isProperty = type === 'property';
  const coverImage = isProperty 
    ? (item.images?.[0] || '/default-property.jpg')
    : (item.images?.[0] || '/default-item.jpg');

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-colors">
      <div className="aspect-video bg-white/5 relative">
        <img 
          src={coverImage} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
          >
            <MdSettings size={14} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 bg-red-500/50 rounded-lg text-white hover:bg-red-500/70 transition-colors"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{item.title}</h3>
        <p className="text-lg font-bold text-white mt-1">
          {isProperty ? `$${item.price}/month` : `$${item.price}`}
        </p>
        
        {isProperty && (
          <div className="flex items-center gap-4 text-sm text-white/70 mt-2">
            <span>{item.bedrooms} bd</span>
            <span>{item.bathrooms} ba</span>
            <span>{item.distanceFromUniversity} mi</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-white/60">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => onView(item)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Section Component
function DashboardSection({ title, children, action, onActionClick }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {action && (
          <button
            onClick={onActionClick}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
          >
            {action}
            <MdArrowForward size={16} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* -------------------------- Main Dashboard Component -------------------------- */
export default function UserDashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user information
  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      return response?.data?.user || null;
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      return null;
    }
  };

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get("/dashboard/overview");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      return null;
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [user, data] = await Promise.all([
          fetchUser(),
          fetchDashboardData()
        ]);
        setUserInfo(user);
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Quick action handlers
  const handleCreateProperty = () => navigate("/add-property");
  const handleCreateItem = () => navigate("/marketplace/create");
  const handleFindRoommate = () => navigate("/Synapse");
  const handleSolveThreads = () => navigate("/solve-threads");

  // Item action handlers
  const handleEditProperty = (property) => navigate(`/edit-property/${property._id}`);
  const handleEditItem = (item) => navigate(`/marketplace/edit/${item._id}`);
  const handleDeleteProperty = async (property) => {
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        await axiosInstance.delete(`/delete-property/${property._id}`);
        // Refresh dashboard data
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to delete property:", error);
      }
    }
  };
  const handleDeleteItem = async (item) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await axiosInstance.delete(`/marketplace/delete/${item._id}`);
        // Refresh dashboard data
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };
  const handleViewProperty = (property) => navigate(`/properties/${property._id}`);
  const handleViewItem = (item) => navigate(`/marketplace/item/${item._id}`);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Navbar />
      
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userInfo?.firstName || "User"}! 👋
          </h1>
          <p className="text-white/70">
            Here's what's happening with your NewRun account
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Properties Listed"
            value={dashboardData?.myProperties?.statistics?.totalProperties || 0}
            icon={MdHome}
            trend="+2 this month"
            color="blue"
          />
          <StatCard
            title="Marketplace Items"
            value={dashboardData?.myMarketplace?.statistics?.totalItems || 0}
            icon={MdShoppingBag}
            trend="+1 this week"
            color="green"
          />
          <StatCard
            title="Total Views"
            value={((dashboardData?.myProperties?.statistics?.totalViews || 0) + 
                   (dashboardData?.myMarketplace?.statistics?.totalViews || 0)).toLocaleString()}
            icon={MdVisibility}
            trend="+15% this month"
            color="purple"
          />
          <StatCard
            title="Messages"
            value={dashboardData?.messagesPreview?.length || 0}
            icon={MdMessage}
            trend="3 unread"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <DashboardSection title="Quick Actions" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              title="List Property"
              description="Rent out your space"
              icon={MdHome}
              onClick={handleCreateProperty}
              color="blue"
            />
            <QuickActionButton
              title="Sell Item"
              description="List on marketplace"
              icon={MdShoppingBag}
              onClick={handleCreateItem}
              color="green"
            />
            <QuickActionButton
              title="Find Roommate"
              description="Connect with students"
              icon={MdGroups}
              onClick={handleFindRoommate}
              color="purple"
            />
            <QuickActionButton
              title="Solve Threads"
              description="AI-powered housing search"
              icon={MdSearch}
              onClick={handleSolveThreads}
              color="orange"
            />
          </div>
        </DashboardSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Properties */}
          <DashboardSection 
            title="My Properties" 
            action="View All"
            onActionClick={() => navigate("/all-properties")}
          >
            {dashboardData?.myProperties?.items?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.myProperties.items.slice(0, 3).map((property) => (
                  <ItemCard
                    key={property._id}
                    item={property}
                    type="property"
                    onEdit={handleEditProperty}
                    onDelete={handleDeleteProperty}
                    onView={handleViewProperty}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MdHome className="text-4xl text-white/30 mx-auto mb-4" />
                <p className="text-white/70 mb-4">No properties listed yet</p>
                <button
                  onClick={handleCreateProperty}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  List Your First Property
                </button>
              </div>
            )}
          </DashboardSection>

          {/* My Marketplace Items */}
          <DashboardSection 
            title="My Marketplace Items" 
            action="View All"
            onActionClick={() => navigate("/marketplace")}
          >
            {dashboardData?.myMarketplace?.items?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.myMarketplace.items.slice(0, 3).map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    type="marketplace"
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onView={handleViewItem}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MdShoppingBag className="text-4xl text-white/30 mx-auto mb-4" />
                <p className="text-white/70 mb-4">No items listed yet</p>
                <button
                  onClick={handleCreateItem}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  List Your First Item
                </button>
              </div>
            )}
          </DashboardSection>
        </div>

        {/* Recent Activity */}
        <DashboardSection title="Recent Activity" className="mt-8">
          <div className="space-y-2">
            <ActivityItem
              type="search"
              title="Searched for properties"
              description="2-bedroom apartments near campus"
              timestamp="2 hours ago"
              icon={MdSearch}
              color="blue"
            />
            <ActivityItem
              type="like"
              title="Liked a property"
              description="Modern apartment in downtown"
              timestamp="1 day ago"
              icon={MdFavorite}
              color="red"
            />
            <ActivityItem
              type="message"
              title="New message"
              description="From John about your property listing"
              timestamp="2 days ago"
              icon={MdMessage}
              color="green"
            />
            <ActivityItem
              type="view"
              title="Property viewed"
              description="Your listing got 5 new views"
              timestamp="3 days ago"
              icon={MdVisibility}
              color="purple"
            />
          </div>
        </DashboardSection>

        {/* Roommate Requests */}
        {(dashboardData?.roommateRequests?.sent?.requests?.length > 0 || 
          dashboardData?.roommateRequests?.received?.requests?.length > 0) && (
          <DashboardSection title="Roommate Requests" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.roommateRequests.sent.requests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3">Sent Requests</h3>
                  <div className="space-y-2">
                    {dashboardData.roommateRequests.sent.requests.slice(0, 2).map((request) => (
                      <div key={request.id} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white font-medium">{request.title}</p>
                        <p className="text-sm text-white/70">Status: {request.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {dashboardData.roommateRequests.received.requests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3">Received Requests</h3>
                  <div className="space-y-2">
                    {dashboardData.roommateRequests.received.requests.slice(0, 2).map((request) => (
                      <div key={request.id} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white font-medium">{request.title}</p>
                        <p className="text-sm text-white/70">From: {request.requester.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DashboardSection>
        )}
      </div>
    </div>
  );
}
