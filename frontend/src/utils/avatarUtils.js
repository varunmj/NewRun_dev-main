/**
 * Utility functions for generating consistent avatars and initials
 */

/**
 * Generate initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate a consistent background color for avatars based on name
 * @param {string} name - Name to generate color for
 * @returns {string} - Tailwind CSS class for background color
 */
export const getAvatarBgColor = (name) => {
  if (!name || typeof name !== 'string') return 'bg-gray-500';
  
  const colors = [
    'bg-red-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-violet-500'
  ];
  
  // Generate a simple hash from the name
  const hash = name
    .split('')
    .reduce((a, b) => a + b.charCodeAt(0), 0);
  
  return colors[hash % colors.length];
};

/**
 * Generate a complete avatar object with initials and color
 * @param {string} name - Full name
 * @param {string} avatarUrl - Optional avatar URL
 * @returns {object} - Avatar object with initials, color, and URL
 */
export const generateAvatar = (name, avatarUrl = '') => {
  return {
    url: avatarUrl,
    initials: getInitials(name),
    bgColor: getAvatarBgColor(name),
    hasImage: !!avatarUrl
  };
};

/**
 * Format avatar URL for consistent display
 * @param {string} avatarUrl - Avatar URL
 * @returns {string} - Formatted URL or empty string
 */
export const formatAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return '';
  return avatarUrl.trim();
};

/**
 * Check if an avatar URL is valid
 * @param {string} avatarUrl - Avatar URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return false;
  
  try {
    new URL(avatarUrl);
    return true;
  } catch {
    return false;
  }
};
