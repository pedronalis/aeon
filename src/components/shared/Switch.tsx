import { type InputHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export function Switch({ label, description, checked, disabled, className = '', ...props }: SwitchProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`
            w-12 h-7 rounded-full
            transition-all duration-300
            ${checked
              ? 'bg-gradient-to-r from-primary to-bronze shadow-torch-primary'
              : 'parchment-panel border border-border'
            }
            ${disabled ? 'cursor-not-allowed' : ''}
            peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background
          `}
        >
          <div
            className={`
              absolute top-1 w-5 h-5 rounded-full
              transition-all duration-300 ease-out
              ${checked
                ? 'translate-x-6 bg-text shadow-lg'
                : 'translate-x-1 bg-text-secondary'
              }
            `}
          />
          {checked && (
            <div className="absolute inset-0 rounded-full animate-torch-flicker opacity-40 bg-primary/20" />
          )}
        </div>
      </div>

      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-text font-heading font-medium text-sm mb-0.5">{label}</p>
          )}
          {description && (
            <p className="text-text-muted font-body text-xs">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}
