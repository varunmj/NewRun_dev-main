# Comprehensive Dashboard API Documentation

## Overview
The enhanced `/dashboard/overview` endpoint provides comprehensive user data including properties, marketplace items, community interactions, solve threads, searches, likes, and roommate requests.

## Endpoint
```
GET /dashboard/overview
```

## Authentication
Requires valid JWT token in Authorization header.

## Response Structure

### User Summary
```json
{
  "userSummary": {
    "firstName": "string",
    "university": "string", 
    "digest": "string" // Summary of user activity
  }
}
```

### Properties Data
```json
{
  "myProperties": {
    "items": [
      {
        "_id": "string",
        "title": "string",
        "price": "number",
        "bedrooms": "number",
        "bathrooms": "number",
        "availabilityStatus": "string",
        "images": ["string"],
        "createdAt": "date"
      }
    ],
    "statistics": {
      "totalProperties": "number",
      "totalViews": "number", 
      "averagePrice": "number",
      "availableProperties": "number",
      "rentedProperties": "number",
      "occupancyRate": "number" // Percentage of rented properties
    }
  }
}
```

### Marketplace Data
```json
{
  "myMarketplace": {
    "items": [
      {
        "_id": "string",
        "title": "string",
        "price": "number",
        "status": "string",
        "views": "number",
        "favorites": "number",
        "createdAt": "date"
      }
    ],
    "statistics": {
      "totalItems": "number",
      "totalViews": "number",
      "totalFavorites": "number", 
      "averagePrice": "number",
      "activeItems": "number",
      "soldItems": "number",
      "reservedItems": "number",
      "salesRate": "number" // Percentage of sold items
    }
  }
}
```

### Community Interactions
```json
{
  "communityInteractions": {
    "recent": [
      {
        "id": "string",
        "type": "string", // community_post, community_comment, community_like
        "content": "object",
        "timestamp": "date",
        "targetUser": {
          "name": "string",
          "avatar": "string"
        }
      }
    ],
    "totalEngagement": "number"
  }
}
```

### Solve Threads
```json
{
  "solveThreads": {
    "recent": [
      {
        "id": "string",
        "kind": "string", // housing, marketplace, task
        "prompt": "string",
        "status": "string", // active, completed, archived
        "createdAt": "date",
        "candidatesCount": "number"
      }
    ],
    "totalThreads": "number"
  }
}
```

### Recent Searches
```json
{
  "recentSearches": {
    "searches": [
      {
        "id": "string",
        "query": "string",
        "targetType": "string", // property, marketplace_item
        "timestamp": "date",
        "results": "number"
      }
    ],
    "totalSearches": "number"
  }
}
```

### Likes Data
```json
{
  "likes": {
    "given": {
      "count": "number",
      "recent": [
        {
          "id": "string",
          "targetType": "string",
          "timestamp": "date"
        }
      ]
    },
    "received": {
      "count": "number", 
      "recent": [
        {
          "id": "string",
          "targetType": "string",
          "timestamp": "date"
        }
      ]
    },
    "ratio": "number" // received/given ratio
  }
}
```

### Roommate Requests
```json
{
  "roommateRequests": {
    "sent": {
      "requests": [
        {
          "id": "string",
          "title": "string",
          "requestType": "string",
          "status": "string",
          "createdAt": "date",
          "targetUser": {
            "name": "string",
            "university": "string",
            "avatar": "string"
          }
        }
      ],
      "count": "number"
    },
    "received": {
      "requests": [
        {
          "id": "string", 
          "title": "string",
          "requestType": "string",
          "status": "string",
          "createdAt": "date",
          "requester": {
            "name": "string",
            "university": "string", 
            "avatar": "string"
          }
        }
      ],
      "count": "number"
    }
  }
}
```

### Additional Data
```json
{
  "needsAttention": [
    {
      "type": "string", // missingImages, missingDescription, missingAddress
      "targetType": "string", // property, marketplace_item
      "targetId": "string",
      "label": "string"
    }
  ],
  "messagesPreview": [
    {
      "id": "string",
      "lastUpdated": "date",
      "lastMessage": {
        "content": "string",
        "timestamp": "date", 
        "sender": "string"
      },
      "participants": ["string"]
    }
  ],
  "campusPulse": [
    {
      "_id": "string",
      "title": "string",
      "price": "number",
      "images": ["string"],
      "createdAt": "date"
    }
  ],
  "tasks": [],
  "profileProgress": {
    "percent": "number",
    "steps": [
      {
        "key": "string",
        "done": "boolean"
      }
    ]
  }
}
```

## Data Sources

### Properties Statistics
- Total properties owned by user
- Total views (likes count)
- Average price
- Available vs rented properties
- Occupancy rate calculation

### Marketplace Statistics  
- Total items listed
- Total views and favorites
- Average price
- Active vs sold vs reserved items
- Sales rate calculation

### Community Interactions
- Recent community posts, comments, and likes (last 7 days)
- Total engagement count

### Solve Threads
- Recent solve threads created by user
- Thread status and candidate counts

### Recent Searches
- User's search activity (last 7 days)
- Search queries and result counts

### Likes Data
- Likes given by user (last 30 days)
- Likes received on user's properties/items (last 30 days)
- Like ratio calculation

### Roommate Requests
- Requests sent by user
- Requests received by user
- Request status and participant information

## Performance Considerations

- Uses Promise.all for parallel data fetching
- Limits results to prevent large responses
- Uses lean() queries for better performance
- Implements proper indexing on database queries

## Error Handling

- Comprehensive try-catch blocks
- Graceful fallbacks for missing data
- Proper HTTP status codes
- Detailed error logging

## Usage Example

```javascript
// Frontend usage
const response = await fetch('/dashboard/overview', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const dashboardData = await response.json();

// Access user's property statistics
console.log(dashboardData.myProperties.statistics);

// Access recent community interactions
console.log(dashboardData.communityInteractions.recent);

// Access roommate requests
console.log(dashboardData.roommateRequests.sent.requests);
```
