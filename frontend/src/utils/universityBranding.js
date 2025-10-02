// University Branding Utilities
// Uses Clearbit Logo API and color extraction

/**
 * Get university domain from name
 * Maps common university names to their domains
 */
export function getUniversityDomain(universityName) {
  if (!universityName) return null;
  
  const name = universityName.toLowerCase().trim();
  
  // Common university domain mappings
  const domainMap = {
    // Illinois
    'niu': 'niu.edu',
    'northern illinois university': 'niu.edu',
    'uic': 'uic.edu',
    'university of illinois chicago': 'uic.edu',
    'uiuc': 'illinois.edu',
    'university of illinois': 'illinois.edu',
    'university of illinois at urbana-champaign': 'illinois.edu',
    'northwestern': 'northwestern.edu',
    'northwestern university': 'northwestern.edu',
    'depaul': 'depaul.edu',
    'depaul university': 'depaul.edu',
    'loyola': 'luc.edu',
    'loyola university chicago': 'luc.edu',
    'iit': 'iit.edu',
    'illinois tech': 'iit.edu',
    'illinois institute of technology': 'iit.edu',
    'uchicago': 'uchicago.edu',
    'university of chicago': 'uchicago.edu',
    
    // California
    'stanford': 'stanford.edu',
    'stanford university': 'stanford.edu',
    'berkeley': 'berkeley.edu',
    'uc berkeley': 'berkeley.edu',
    'university of california berkeley': 'berkeley.edu',
    'ucla': 'ucla.edu',
    'usc': 'usc.edu',
    'university of southern california': 'usc.edu',
    'caltech': 'caltech.edu',
    'california institute of technology': 'caltech.edu',
    
    // Massachusetts
    'mit': 'mit.edu',
    'harvard': 'harvard.edu',
    'harvard university': 'harvard.edu',
    'boston university': 'bu.edu',
    'bu': 'bu.edu',
    'northeastern': 'northeastern.edu',
    'northeastern university': 'northeastern.edu',
    
    // Texas
    'ut austin': 'utexas.edu',
    'university of texas': 'utexas.edu',
    'university of texas at austin': 'utexas.edu',
    'ut dallas': 'utdallas.edu',
    'university of texas at dallas': 'utdallas.edu',
    'texas a&m': 'tamu.edu',
    
    // New York
    'nyu': 'nyu.edu',
    'columbia': 'columbia.edu',
    'columbia university': 'columbia.edu',
    'cornell': 'cornell.edu',
    'cornell university': 'cornell.edu',
    
    // Pennsylvania
    'penn state university': 'psu.edu',
    'penn state': 'psu.edu',
    'psu': 'psu.edu',
    'pennsylvania state university': 'psu.edu',
    'university of pennsylvania': 'upenn.edu',
    'upenn': 'upenn.edu',
    'penn': 'upenn.edu',
    
    // Add more as needed
  };
  
  // Check direct mapping
  if (domainMap[name]) {
    return domainMap[name];
  }
  
  // Try to construct domain from name
  // Example: "Stanford University" -> "stanford.edu"
  let cleaned = name
    .replace(/university|college|of|the|at/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Handle special cases
  if (cleaned.includes('texas') && cleaned.includes('dallas')) {
    return 'utdallas.edu';
  }
  
  // Take first significant word
  const firstWord = cleaned.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    return firstWord + '.edu';
  }
  
  return cleaned.replace(/\s+/g, '') + '.edu';
}

/**
 * Get Clearbit logo URL for a university
 */
export function getUniversityLogoUrl(universityName, size = 128) {
  const domain = getUniversityDomain(universityName);
  if (!domain) return null;
  
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

/**
 * Get university branding from backend cache or fetch new
 */
export async function getUniversityBranding(universityName, axiosInstance) {
  if (!universityName) {
    return null;
  }
  
  try {
    // Check backend cache first
    const response = await axiosInstance.get(`/university-branding/${encodeURIComponent(universityName)}`);
    
    if (response.data && response.data.branding) {
      const branding = response.data.branding;
      // Ensure logoUrl is present
      if (!branding.logoUrl) {
        branding.logoUrl = getUniversityLogoUrl(universityName);
      }
      return branding;
    }
  } catch (error) {
    console.error('Error fetching university branding:', error);
  }
  
  // Fallback for unknown universities or error
  return {
    primary: '#2F64FF', // NewRun blue
    secondary: '#FFA500',
    textColor: '#FFFFFF',
    name: universityName, // Use full name from user profile
    logoUrl: getUniversityLogoUrl(universityName),
    domain: getUniversityDomain(universityName)
  };
}

/**
 * Extract dominant color from an image URL
 * Uses a canvas to analyze the image
 */
export async function extractColorFromLogo(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Get color frequency
        const colorMap = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent or white pixels
          if (a < 125 || (r > 240 && g > 240 && b > 240)) continue;
          
          const rgb = `${r},${g},${b}`;
          colorMap[rgb] = (colorMap[rgb] || 0) + 1;
        }
        
        // Find most common color
        let maxCount = 0;
        let dominantColor = null;
        for (const [color, count] of Object.entries(colorMap)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }
        
        if (dominantColor) {
          resolve(`rgb(${dominantColor})`);
        } else {
          reject(new Error('No dominant color found'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Get text color (white or black) based on background luminance
 */
export function getContrastTextColor(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

