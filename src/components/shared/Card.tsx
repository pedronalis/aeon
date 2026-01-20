import { HTMLAttributes, ReactNode, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'parchment' | 'royal' | 'glass' | 'neon';
  hoverable?: boolean;
  clickable?: boolean;
  gradient?: boolean;
  borderGlow?: boolean;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hoverable = false,
      clickable = false,
      gradient = false,
      borderGlow = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Map old variant names to new ones
    const variantMap: Record<string, string> = {
      glass: 'parchment',
      neon: 'royal',
    };
    const resolvedVariant = variantMap[variant] || variant;

    const baseStyles = [
      'rounded-lg p-4 md:p-6 lg:p-8',
      'transition-all duration-normal',
    ];

    const variantStyles = {
      default: [
        'parchment-card',
        'shadow-elevation-2',
      ],
      elevated: [
        'parchment-ultra',
        'shadow-elevation-2',
        hoverable && 'hover:shadow-elevation-3',
      ],
      outlined: [
        'parchment-panel',
        'border-2 border-border',
      ],
      parchment: [
        'parchment-card',
      ],
      royal: [
        'bg-transparent',
        'parchment-ultra',
        'forge-border-primary',
        'shadow-torch-primary',
      ],
    };

    const interactionStyles = [
      hoverable && 'hover-forge-lift',
      clickable && 'cursor-pointer',
      (hoverable || clickable) && 'hover:shadow-torch-primary',
      borderGlow && hoverable && 'hover:forge-border-primary hover:shadow-torch-primary hover:forge-border-animated',
    ];

    const gradientStyles = gradient ? 'gradient-surface-premium' : '';

    const classes = [
      ...baseStyles,
      ...(variantStyles[resolvedVariant as keyof typeof variantStyles] || variantStyles.default),
      ...interactionStyles,
      gradientStyles,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
