import { useState, useCallback } from 'react';
import NewRunAI from '../services/NewRunAI';

/**
 * Custom hook for NewRun AI functionality
 * Provides easy access to AI-powered features with loading states and error handling
 */
export const useNewRunAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate AI-powered insights
  const generateInsights = useCallback(async (userData, dashboardData) => {
    setLoading(true);
    setError(null);
    
    try {
      const insights = await NewRunAI.generatePersonalizedInsights(userData, dashboardData);
      return insights;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate AI-powered actions
  const generateActions = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const actions = await NewRunAI.generatePersonalizedActions(userData);
      return actions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate arrival timeline
  const generateTimeline = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const timeline = await NewRunAI.generateArrivalTimeline(userData);
      return timeline;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate market analysis
  const generateMarketAnalysis = useCallback(async (dashboardData, userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await NewRunAI.generateMarketAnalysis(dashboardData, userData);
      return analysis;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate conversational response
  const generateResponse = useCallback(async (message, userData, context) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await NewRunAI.generateConversationalResponse(message, userData, context);
      return response;
    } catch (err) {
      setError(err.message);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate success predictions
  const generatePredictions = useCallback(async (userData, dashboardData) => {
    setLoading(true);
    setError(null);
    
    try {
      const predictions = await NewRunAI.generateSuccessPredictions(userData, dashboardData);
      return predictions;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateInsights,
    generateActions,
    generateTimeline,
    generateMarketAnalysis,
    generateResponse,
    generatePredictions
  };
};

