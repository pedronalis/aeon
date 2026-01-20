import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label className="text-sm font-heading font-medium text-text">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-lg font-body
              bg-surface text-text
              border-2 transition-all duration-normal
              placeholder:text-text-muted
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error focus:border-error' : 'border-border focus:border-primary'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-error font-body animate-fade-in">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-xs text-text-secondary font-body">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
