# AI Security Setup Guide

## Critical Security Issues Fixed

### 1. Hardcoded API Key Removed
- ✅ Removed hardcoded OpenAI API key from frontend code
- ✅ Moved API key to secure backend environment variables
- ✅ Frontend now uses backend proxy endpoints

### 2. Unified AI Architecture
- ✅ Created centralized AI service in backend (`/backend/services/aiService.js`)
- ✅ Consolidated all AI functionality into single service
- ✅ Added proper error handling and fallback mechanisms

### 3. Secure API Endpoints
- ✅ Added authenticated AI endpoints:
  - `POST /api/ai/insights` - Generate personalized insights
  - `POST /api/ai/actions` - Generate personalized actions
  - `POST /api/ai/extract-criteria` - Extract housing criteria
  - `POST /api/ai/chat` - Generate conversational responses

## Environment Setup Required

Create a `.env` file in the backend directory with:

```bash
# OpenAI API Configuration
NEWRUN_APP_OPENAI_API_KEY=your-openai-api-key-here

# Database Configuration
MONGODB_URI=your-mongodb-connection-string-here

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Frontend Environment Setup

Create a `.env` file in the frontend directory with:

```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

## Security Improvements

1. **API Key Protection**: OpenAI API key is now stored securely in backend environment variables
2. **Authentication**: All AI endpoints require valid JWT authentication
3. **Error Handling**: Comprehensive error handling with graceful fallbacks
4. **Rate Limiting**: Backend can implement rate limiting for AI endpoints
5. **Logging**: All AI requests are logged for monitoring

## Testing the Fix

1. Start the backend server with proper environment variables
2. Start the frontend with REACT_APP_API_URL configured
3. Test AI functionality in the dashboard
4. Verify that API key is not exposed in frontend code

## Migration Notes

- Frontend `NewRunAI.js` now uses backend API endpoints
- All AI functionality is centralized in backend
- Fallback mechanisms ensure UI doesn't break if AI fails
- No more direct OpenAI API calls from frontend
