import { HTMLAttributes, ReactNode, forwardRef } from 'react';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  noPadding?: boolean;
  children: ReactNode;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      maxWidth = 'lg',
      centered = true,
      noPadding = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const maxWidthStyles = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    };

    const paddingStyles = noPadding
      ? ''
      : 'px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4';

    const centeredStyles = centered ? 'mx-auto' : '';

    const classes = [
      'w-full',
      maxWidthStyles[maxWidth],
      centeredStyles,
      paddingStyles,
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

Container.displayName = 'Container';
