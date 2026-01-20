export type ThemeColor = 'primary' | 'accent' | 'success' | 'warning' | 'error';

export const getGlassClass = (color: ThemeColor) => {
  const classes = {
    primary: 'glass-tinted-primary',
    accent: 'glass-tinted-accent',
    success: 'glass-tinted-success',
    warning: 'glass-tinted-warning',
    error: 'glass-tinted-error',
  };
  return classes[color];
};

export const getNeonClass = (color: ThemeColor) => {
  const classes = {
    primary: 'neon-border-primary shadow-neon-primary',
    accent: 'neon-border-accent shadow-neon-accent',
    success: 'neon-border-success shadow-neon-success',
    warning: 'neon-border-warning shadow-neon-warning',
    error: 'neon-border-error shadow-neon-error',
  };
  return classes[color];
};

export const getTextGradientClass = (color: ThemeColor) => {
  const classes = {
    primary: 'text-gradient-primary',
    accent: 'text-gradient-accent',
    success: 'text-gradient-success',
    warning: 'text-gradient-warning',
    error: 'text-gradient-error',
  };
  return classes[color];
};
