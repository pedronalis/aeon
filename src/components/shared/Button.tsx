import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Medieval variants + backwards compatible aliases
  variant?: 'royal' | 'iron' | 'crimson' | 'forest' | 'danger' | 'parchment' | 'primary' | 'secondary' | 'accent' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'royal',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      rounded = false,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2',
      'font-heading font-medium transition-all duration-normal',
      'focus-gold',
      'active:scale-[0.98]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    ];

    // Map old variant names to new medieval variants
    const variantMap: Record<string, string> = {
      primary: 'royal',
      secondary: 'iron',
      accent: 'crimson',
      ghost: 'parchment',
      glass: 'parchment',
    };
    const resolvedVariant = variantMap[variant] || variant;

    const variantStyles = {
      royal: [
        'parchment-primary',
        'forge-border-primary',
        'shadow-torch-sm',
        'text-primary',
        'hover:shadow-torch-primary',
        'hover:brightness-110',
        'transition-all duration-300',
        'disabled:hover:shadow-torch-sm disabled:hover:brightness-100',
      ],
      iron: [
        'parchment-ultra',
        'border-2 border-text-secondary/50 text-text-secondary',
        'hover:border-text-secondary',
        'hover:shadow-elevation-2',
        'transition-all duration-300',
        'disabled:hover:border-text-secondary/50 disabled:hover:shadow-none',
      ],
      crimson: [
        'parchment-accent',
        'forge-border-accent',
        'shadow-torch-accent',
        'text-accent',
        'hover:shadow-torch-accent',
        'hover:brightness-110',
        'transition-all duration-300',
        'disabled:hover:brightness-100',
      ],
      forest: [
        'parchment-success',
        'forge-border-success',
        'text-success',
        'hover:shadow-torch-success',
        'hover:brightness-110',
        'transition-all duration-300',
        'disabled:hover:brightness-100',
      ],
      danger: [
        'parchment-error',
        'forge-border-error',
        'text-error',
        'hover:shadow-torch-error',
        'hover:brightness-110',
        'transition-all duration-300',
        'disabled:hover:shadow-none disabled:hover:brightness-100',
      ],
      parchment: [
        'parchment-ultra',
        'border-2 border-primary/30',
        'text-primary',
        'hover:parchment-primary',
        'hover:forge-border-primary',
        'hover:shadow-torch-primary',
        'transition-all duration-300',
        'disabled:hover:border-primary/30 disabled:hover:shadow-none',
      ],
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    const widthStyles = fullWidth ? 'w-full' : '';
    const roundedStyles = rounded ? 'rounded-full' : 'rounded-lg';

    const classes = [
      ...baseStyles,
      ...(variantStyles[resolvedVariant as keyof typeof variantStyles] || variantStyles.royal),
      sizeStyles[size],
      widthStyles,
      roundedStyles,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSize = size === 'sm' ? 16 : size === 'lg' || size === 'xl' ? 24 : 18;

    const renderIcon = (position: 'left' | 'right') => {
      if (loading && position === 'left') {
        return <Loader2 size={iconSize} className="animate-spin" />;
      }
      if (icon && iconPosition === position && !loading) {
        return <span className="flex-shrink-0">{icon}</span>;
      }
      return null;
    };

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {renderIcon('left')}
        {children && <span>{children}</span>}
        {renderIcon('right')}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Backwards compatibility aliases
export type { ButtonProps as ButtonPropsLegacy };
