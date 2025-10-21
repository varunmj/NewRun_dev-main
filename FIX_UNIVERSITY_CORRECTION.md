# How to Fix Your University (Change UTD back to NIU)

## Problem
Your university is locked as "University of Texas at Dallas" but you need it to be "Northern Illinois University"

## Solution: Use the New API Endpoint

### Option 1: Using cURL (Terminal)

```bash
curl -X POST http://localhost:8000/update-university \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"university": "Northern Illinois University"}'
```

### Option 2: Using JavaScript/Fetch (Browser Console)

```javascript
// Get your auth token first
const token = localStorage.getItem('token') || localStorage.getItem('authToken');

// Make the request
fetch('http://localhost:8000/update-university', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    university: 'Northern Illinois University'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ University updated:', data);
  // Refresh the page to see changes
  window.location.reload();
})
.catch(err => console.error('❌ Error:', err));
```

### Option 3: Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:8000/update-university`
3. **Headers**:
   ```
   Authorization: Bearer YOUR_TOKEN
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "university": "Northern Illinois University"
   }
   ```
5. **Send** the request

### Option 4: Using axios (from your app)

```javascript
import axiosInstance from "../utils/axiosInstance";

const updateUniversity = async () => {
  try {
    const response = await axiosInstance.post('/update-university', {
      university: 'Northern Illinois University'
    });
    console.log('✅ Updated:', response.data);
    // Refresh page to see changes
    window.location.reload();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

updateUniversity();
```

---

## Supported University Names

These exact names work:
- `Northern Illinois University`
- `University of Texas at Dallas`
- `University of Chicago`
- `Stanford University`
- `MIT`
- `Harvard University`
- [See full list in clearbitLogo.js]

Or abbreviations like:
- `NIU`
- `UT Dallas`
- `UTD`
- `UIUC`
- `NU`

---

## Expected Response

**Success (200)**:
```json
{
  "error": false,
  "message": "University updated successfully",
  "university": "Northern Illinois University",
  "user": {
    "id": "YOUR_USER_ID",
    "university": "Northern Illinois University"
  }
}
```

**Error (400)**:
```json
{
  "error": true,
  "message": "University name is required and must be a string"
}
```

---

## After Update

1. ✅ Your university field in database updated
2. ✅ Your onboarding data updated
3. ✅ Logo will refresh automatically
4. ✅ Your profile will display the correct university

---

## What This Endpoint Does

- Validates the university name (1-150 characters)
- Updates `user.university` in database
- Updates `user.onboardingData.university` 
- Returns success confirmation
- Logs the change for audit trail

---

## Security Notes

- ✅ Requires authentication token
- ✅ Only updates your own university
- ✅ Validates input length
- ✅ Logs all changes

---

## Still Having Issues?

1. Make sure you're logged in (have a valid token)
2. Double-check the university name spelling
3. Check browser console for errors
4. Verify the API endpoint is running
5. Check backend logs for error messages

**Backend logs will show**:
```
🏫 University update request for user abc123
   Old university: University of Texas at Dallas
   New university: Northern Illinois University
✅ University updated successfully for user abc123
```

