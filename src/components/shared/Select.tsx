import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

export interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Select({ value, options, onChange, disabled = false, placeholder = 'Escolha seu Ritual...' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-base font-heading
          bg-surface/60 text-text
          border border-border/50 rounded-lg
          flex items-center justify-between gap-3
          transition-all duration-200
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-primary/50 hover:bg-surface/80'
          }
          ${isOpen ? 'border-primary/50 bg-surface/80' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <div className="flex-shrink-0" style={{ color: selectedOption.color }}>
              {selectedOption.icon}
            </div>
          )}
          <span className="font-medium text-left whitespace-nowrap">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 mt-1 z-50
            bg-surface border border-border/50 shadow-lg
            overflow-hidden rounded-lg
            animate-fade-in
            w-full
          "
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-2.5 font-heading
                    flex items-center gap-3
                    transition-colors duration-150
                    ${isSelected
                      ? 'bg-primary/10'
                      : 'hover:bg-surface-hover'
                    }
                  `}
                >
                  {option.icon && (
                    <div className="flex-shrink-0" style={{ color: option.color }}>
                      {option.icon}
                    </div>
                  )}
                  <span
                    className={`flex-1 text-left font-medium whitespace-nowrap ${isSelected ? '' : 'text-text'}`}
                    style={{ color: isSelected ? option.color : undefined }}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check
                      size={16}
                      className="flex-shrink-0"
                      style={{ color: option.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
