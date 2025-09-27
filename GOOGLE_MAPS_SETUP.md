# Google Maps API Setup Guide

## Issue: "This page can't load Google Maps correctly"

This error occurs when the Google Maps API key is missing, invalid, or doesn't have the required permissions.

## Solution Steps

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Directions API**
   - **Geocoding API**

### 2. Create API Key

1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 3. Configure Environment Variables

Update your `.env` file in the frontend directory:

```bash
# Add this line to your frontend/.env file
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 4. Set API Key Restrictions (Recommended)

For security, restrict your API key:

1. In Google Cloud Console, go to "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `localhost:3000/*`
     - `localhost:3001/*`
     - `yourdomain.com/*`
4. Under "API restrictions":
   - Select "Restrict key"
   - Enable only:
     - Maps JavaScript API
     - Places API
     - Directions API
     - Geocoding API

### 5. Test the Configuration

1. Restart your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to the Transportation page
3. The Google Maps error should be resolved

## Troubleshooting

### If you still see the error:

1. **Check API Key**: Ensure the API key is correct and active
2. **Check APIs**: Verify all required APIs are enabled
3. **Check Restrictions**: Make sure your domain is allowed
4. **Check Billing**: Google Maps requires a billing account (free tier available)

### Common Issues:

- **"RefererNotAllowedMapError"**: Add your domain to HTTP referrers
- **"ApiNotActivatedMapError"**: Enable the required APIs
- **"BillingNotEnabledMapError"**: Set up billing in Google Cloud Console

## Fallback Behavior

The application now includes graceful fallbacks:

- **Loading State**: Shows spinner while Google Maps loads
- **Error State**: Shows helpful error message with setup instructions
- **Manual Input**: Users can still enter locations manually if Google Maps fails
- **Notifications**: User-friendly error messages guide users

## Development vs Production

### Development:
- Use `localhost:3000/*` and `localhost:3001/*` in referrer restrictions
- API key can be less restricted for development

### Production:
- Use your actual domain in referrer restrictions
- Enable all security restrictions
- Monitor API usage in Google Cloud Console

## Cost Considerations

- **Free Tier**: $200/month credit (covers most small applications)
- **Maps JavaScript API**: $7 per 1,000 loads
- **Places API**: $17 per 1,000 requests
- **Directions API**: $5 per 1,000 requests

For a student application, the free tier should be sufficient.
