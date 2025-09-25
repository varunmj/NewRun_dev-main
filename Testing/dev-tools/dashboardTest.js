// Dashboard Test Utility
// This file helps debug dashboard connection issues

import axiosInstance from './axiosInstance';

export const testDashboardConnection = async () => {
  console.log('🧪 Testing Dashboard Connection...');
  
  try {
    // Test 1: Check if backend is reachable
    console.log('1. Testing backend connectivity...');
    const healthCheck = await axiosInstance.get('/');
    console.log('✅ Backend health check:', healthCheck.data);
    
    // Test 2: Check authentication
    console.log('2. Testing authentication...');
    const token = localStorage.getItem('accessToken');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No authentication token found');
      return { success: false, error: 'No authentication token' };
    }
    
    // Test 3: Test dashboard endpoint
    console.log('3. Testing dashboard endpoint...');
    const dashboardResponse = await axiosInstance.get('/dashboard/overview');
    console.log('✅ Dashboard data:', dashboardResponse.data);
    
    return { success: true, data: dashboardResponse.data };
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

export const testAIConnection = async () => {
  console.log('🤖 Testing AI Connection...');
  
  try {
    const aiResponse = await axiosInstance.post('/api/ai/insights', {
      dashboardData: { test: true }
    });
    console.log('✅ AI insights response:', aiResponse.data);
    return { success: true, data: aiResponse.data };
  } catch (error) {
    console.error('❌ AI test failed:', error);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Quick test function for browser console
window.testDashboard = testDashboardConnection;
window.testAI = testAIConnection;
