import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { X } from 'lucide-react';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'royal' | 'quest' | 'achievement' | 'rank';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  removable?: boolean;
  pulse?: boolean;
  glow?: boolean;
  pulseGlow?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      icon,
      removable = false,
      pulse = false,
      glow = false,
      pulseGlow = false,
      onRemove,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Map variant names
    const variantMap: Record<string, string> = {
      royal: 'primary',
      quest: 'primary',
      achievement: 'warning',
      rank: 'accent',
    };
    const resolvedVariant = variantMap[variant] || variant;

    const baseStyles = [
      'inline-flex items-center gap-2 rounded-full',
      'transition-all duration-normal font-heading',
      'animate-scale-in',
    ];

    const variantStyles = {
      default: [
        'bg-surface/50',
        'border-2 border-border',
        'text-text',
      ],
      primary: [
        'bg-primary/15',
        'border-2 border-primary',
        'text-primary',
        glow && 'shadow-torch-primary',
        pulseGlow && 'animate-gold-breathe',
      ],
      accent: [
        'bg-accent/15',
        'border-2 border-accent',
        'text-accent',
        glow && 'shadow-torch-accent',
        pulseGlow && 'animate-gold-breathe',
      ],
      success: [
        'bg-success/15',
        'border-2 border-success',
        'text-success',
        glow && 'shadow-torch-success',
        pulseGlow && 'animate-gold-breathe',
      ],
      warning: [
        'bg-warning/15',
        'border-2 border-warning',
        'text-warning',
        glow && 'shadow-torch-warning',
        pulseGlow && 'animate-gold-breathe',
      ],
      error: [
        'bg-error/15',
        'border-2 border-error',
        'text-error',
        glow && 'shadow-torch-error',
        pulseGlow && 'animate-gold-breathe',
      ],
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const pulseStyles = pulse ? 'animate-pulse' : '';

    const classes = [
      ...baseStyles,
      ...(variantStyles[resolvedVariant as keyof typeof variantStyles] || variantStyles.default),
      sizeStyles[size],
      pulseStyles,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

    return (
      <div ref={ref} className={classes} {...props}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {removable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Remove"
          >
            <X size={iconSize} />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
