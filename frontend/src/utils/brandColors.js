/**
 * NewRun Brand Color System
 * Consistent, professional color palette that aligns with NewRun brand
 * Subtle, modern colors that don't clash with the overall design
 */

export const brandColors = {
  // Primary brand colors
  primary: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    300: 'bg-slate-300',
    400: 'bg-slate-400',
    500: 'bg-slate-500',
    600: 'bg-slate-600',
    700: 'bg-slate-700',
    800: 'bg-slate-800',
    900: 'bg-slate-900',
  },

  // Priority colors (subtle, professional)
  priority: {
    high: {
      bg: 'bg-orange-500/5',
      border: 'border-orange-500/30',
      text: 'text-orange-300',
      badge: 'bg-orange-500/20 text-orange-300',
      hover: 'hover:bg-orange-500/10'
    },
    medium: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-300',
      hover: 'hover:bg-amber-500/10'
    },
    low: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300',
      hover: 'hover:bg-emerald-500/10'
    }
  },

  // Insight type colors
  insight: {
    urgent: {
      bg: 'bg-orange-500/5',
      border: 'border-orange-500/30',
      text: 'text-orange-300',
      icon: 'bg-orange-500/10',
      badge: 'bg-orange-500/20 text-orange-300'
    },
    warning: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      icon: 'bg-amber-500/10',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    success: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      icon: 'bg-emerald-500/10',
      badge: 'bg-emerald-500/20 text-emerald-300'
    },
    info: {
      bg: 'bg-slate-500/5',
      border: 'border-slate-500/30',
      text: 'text-slate-300',
      icon: 'bg-slate-500/10',
      badge: 'bg-slate-500/20 text-slate-300'
    }
  },

  // Action colors
  action: {
    primary: {
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      hover: 'hover:bg-blue-500/10'
    },
    secondary: {
      bg: 'bg-slate-500/5',
      border: 'border-slate-500/30',
      text: 'text-slate-300',
      hover: 'hover:bg-slate-500/10'
    }
  },

  // Neutral colors for consistency
  neutral: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
    textSecondary: 'text-white/70',
    textMuted: 'text-white/50'
  }
};

/**
 * Get brand-consistent colors for insights
 */
export const getInsightColors = (type, priority) => {
  const insightColors = brandColors.insight[type] || brandColors.insight.info;
  const priorityColors = brandColors.priority[priority] || brandColors.priority.medium;
  
  return {
    ...insightColors,
    priority: priorityColors
  };
};

/**
 * Get brand-consistent colors for actions
 */
export const getActionColors = (priority) => {
  return brandColors.priority[priority] || brandColors.priority.medium;
};

/**
 * Get brand-consistent colors for property cards
 */
export const getPropertyCardColors = (isRecommended = false) => {
  if (isRecommended) {
    return {
      bg: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
      border: 'border-blue-500/50',
      hover: 'hover:border-blue-500/70'
    };
  }
  
  return {
    bg: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:border-white/20'
  };
};

export default brandColors;
