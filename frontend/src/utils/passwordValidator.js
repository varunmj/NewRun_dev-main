// BULLETPROOF PASSWORD VALIDATION UTILITIES

export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxConsecutiveChars: 3,
  commonPasswords: [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
    'trustno1', '123123', 'jordan23', 'harley', 'ranger', 'jordan',
    'hunter', 'buster', 'soccer', 'hockey', 'killer', 'george',
    'sexy', 'andrew', 'charlie', 'superman', 'asshole', 'fuckyou',
    'dallas', 'jessica', 'panties', 'pepper', '1234', '6969',
    'knight', 'mustang', 'shadow', 'master', 'michael', 'football',
    'tigger', 'sunshine', 'iloveyou', 'fuckme', '2000', 'charlie',
    'robert', 'hockey', 'ranger', 'daniel', 'hannah', 'maggie',
    'jessica', 'charlie', 'jordan', 'michelle', 'andrew', 'joshua',
    'amanda', 'justin', 'sarah', 'matthew', 'jennifer', 'zachary',
    'joshua', 'jessica', 'amanda', 'daniel', 'brittany', 'samantha',
    'joshua', 'jessica', 'amanda', 'daniel', 'brittany', 'samantha'
  ]
};

export const validatePassword = (password) => {
  const errors = [];
  const warnings = [];
  
  // Length validation
  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters long`);
  }
  
  if (password.length > passwordRequirements.maxLength) {
    errors.push(`Password must be no more than ${passwordRequirements.maxLength} characters long`);
  }
  
  // Character type validation
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }
  
  // Consecutive character validation
  if (hasConsecutiveChars(password, passwordRequirements.maxConsecutiveChars)) {
    errors.push(`Password cannot have more than ${passwordRequirements.maxConsecutiveChars} consecutive identical characters`);
  }
  
  // Common password check
  if (passwordRequirements.commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
  }
  
  // Sequence validation (123, abc, etc.)
  if (hasSequentialChars(password)) {
    warnings.push('Password contains sequential characters which may be easy to guess');
  }
  
  // Keyboard pattern validation
  if (hasKeyboardPattern(password)) {
    warnings.push('Password contains keyboard patterns which may be easy to guess');
  }
  
  // Repeated character validation
  if (hasRepeatedChars(password)) {
    warnings.push('Password contains repeated character patterns');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: calculatePasswordStrength(password)
  };
};

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match'
    };
  }
  return { isValid: true };
};

// Helper functions
const hasConsecutiveChars = (str, maxConsecutive) => {
  let consecutiveCount = 1;
  for (let i = 1; i < str.length; i++) {
    if (str[i] === str[i - 1]) {
      consecutiveCount++;
      if (consecutiveCount > maxConsecutive) {
        return true;
      }
    } else {
      consecutiveCount = 1;
    }
  }
  return false;
};

const hasSequentialChars = (str) => {
  const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'];
  
  const lowerStr = str.toLowerCase();
  return sequences.some(seq => lowerStr.includes(seq));
};

const hasKeyboardPattern = (str) => {
  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    '123456', '234567', '345678', '456789', '567890',
    'qwertyuiopasdfghjklzxcvbnm', 'asdfghjklqwertyuiopzxcvbnm'
  ];
  
  const lowerStr = str.toLowerCase();
  return keyboardPatterns.some(pattern => lowerStr.includes(pattern));
};

const hasRepeatedChars = (str) => {
  // Check for repeated 2-3 character patterns
  for (let i = 0; i < str.length - 3; i++) {
    const pattern = str.substring(i, i + 2);
    if (str.substring(i + 2, i + 4) === pattern) {
      return true;
    }
  }
  return false;
};

const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety score
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // Bonus for uncommon characters
  if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // Penalty for common patterns
  if (hasSequentialChars(password)) score -= 1;
  if (hasKeyboardPattern(password)) score -= 1;
  if (hasRepeatedChars(password)) score -= 1;
  if (passwordRequirements.commonPasswords.includes(password.toLowerCase())) score -= 2;
  
  // Normalize to 0-100
  const normalizedScore = Math.max(0, Math.min(100, (score / 7) * 100));
  
  if (normalizedScore < 30) return { level: 'weak', color: 'red', percentage: normalizedScore };
  if (normalizedScore < 60) return { level: 'fair', color: 'orange', percentage: normalizedScore };
  if (normalizedScore < 80) return { level: 'good', color: 'yellow', percentage: normalizedScore };
  return { level: 'strong', color: 'green', percentage: normalizedScore };
};

export const getPasswordStrengthColor = (strength) => {
  const colors = {
    weak: 'text-red-500',
    fair: 'text-orange-500',
    good: 'text-yellow-500',
    strong: 'text-green-500'
  };
  return colors[strength.level] || 'text-gray-500';
};

export const getPasswordStrengthBgColor = (strength) => {
  const colors = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500'
  };
  return colors[strength.level] || 'bg-gray-500';
};
