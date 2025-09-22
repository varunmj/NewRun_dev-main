import React from 'react';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthBgColor } from '../../utils/passwordValidator';

const PasswordStrengthIndicator = ({ password, showDetails = true }) => {
  if (!password) return null;

  const validation = validatePassword(password);
  const { strength } = validation;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getPasswordStrengthBgColor(strength)}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getPasswordStrengthColor(strength)}`}>
          {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
        </span>
      </div>

      {/* Detailed Requirements */}
      {showDetails && (
        <div className="space-y-1">
          {/* Errors */}
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-500">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              <span>{error}</span>
            </div>
          ))}
          
          {/* Warnings */}
          {validation.warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-yellow-500">
              <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
              <span>{warning}</span>
            </div>
          ))}
          
          {/* Success indicators */}
          {validation.isValid && validation.errors.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              <span>Password meets all security requirements</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
