import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD or empty
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
  placeholder?: string;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function DatePicker({ value, onChange, minDate, label, placeholder = 'Selecionar data...' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update viewDate when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month days to show
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: number[] = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthLastDay - i);
  }

  // Current month days
  const currentMonthDays: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  // Next month days to complete the grid
  const totalCells = Math.ceil((prevMonthDays.length + currentMonthDays.length) / 7) * 7;
  const nextMonthDays: number[] = [];
  for (let i = 1; i <= totalCells - prevMonthDays.length - currentMonthDays.length; i++) {
    nextMonthDays.push(i);
  }

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const goToPrevYear = () => {
    setViewDate(new Date(year - 1, month, 1));
  };

  const goToNextYear = () => {
    setViewDate(new Date(year + 1, month, 1));
  };

  const selectDate = (day: number, monthOffset: number = 0) => {
    const selectedDate = new Date(year, month + monthOffset, day);
    const dateStr = formatDateStr(selectedDate);

    // Check minDate
    if (minDate && dateStr < minDate) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = (day: number, monthOffset: number = 0): boolean => {
    const today = new Date();
    const checkDate = new Date(year, month + monthOffset, day);
    return (
      today.getFullYear() === checkDate.getFullYear() &&
      today.getMonth() === checkDate.getMonth() &&
      today.getDate() === checkDate.getDate()
    );
  };

  const isSelected = (day: number, monthOffset: number = 0): boolean => {
    if (!value) return false;
    const checkDate = formatDateStr(new Date(year, month + monthOffset, day));
    return checkDate === value;
  };

  const isDisabled = (day: number, monthOffset: number = 0): boolean => {
    if (!minDate) return false;
    const checkDate = formatDateStr(new Date(year, month + monthOffset, day));
    return checkDate < minDate;
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-heading font-medium text-text flex items-center gap-2">
          <Calendar size={14} />
          {label}
        </label>
      )}

      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative w-full px-4 py-3 rounded-lg font-body
          bg-surface text-text cursor-pointer
          border-2 border-border transition-all duration-normal
          hover:border-primary/50
          focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30
        "
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-text' : 'text-text-muted'}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && (
              <button
                onClick={clearDate}
                className="p-1 text-text-muted hover:text-danger transition-colors"
                aria-label="Limpar data"
              >
                <X size={14} />
              </button>
            )}
            <Calendar size={16} className="text-text-muted" />
          </div>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="
          absolute z-50 mt-1
          parchment-ultra forge-border-primary rounded-lg shadow-elevation-3
          p-4 min-w-[280px] animate-fade-in
        ">
          {/* Header with Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevMonth}
                className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-heading text-text min-w-[80px] text-center">
                {MONTHS_PT[month]}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Year Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevYear}
                className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                aria-label="Ano anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-heading text-text min-w-[50px] text-center">
                {year}
              </span>
              <button
                onClick={goToNextYear}
                className="p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
                aria-label="Próximo ano"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS_PT.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-heading text-text-muted py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous Month Days */}
            {prevMonthDays.map((day) => (
              <button
                key={`prev-${day}`}
                onClick={() => selectDate(day, -1)}
                disabled={isDisabled(day, -1)}
                className={`
                  p-2 text-sm rounded-lg text-center transition-colors
                  ${isDisabled(day, -1)
                    ? 'text-text-muted/30 cursor-not-allowed'
                    : 'text-text-muted hover:bg-surface-hover cursor-pointer'
                  }
                `}
              >
                {day}
              </button>
            ))}

            {/* Current Month Days */}
            {currentMonthDays.map((day) => (
              <button
                key={`curr-${day}`}
                onClick={() => selectDate(day)}
                disabled={isDisabled(day)}
                className={`
                  p-2 text-sm rounded-lg text-center transition-all
                  ${isSelected(day)
                    ? 'bg-primary text-background font-bold'
                    : isToday(day)
                      ? 'bg-primary/20 text-primary font-semibold ring-1 ring-primary'
                      : isDisabled(day)
                        ? 'text-text-muted/30 cursor-not-allowed'
                        : 'text-text hover:bg-surface-hover cursor-pointer'
                  }
                `}
              >
                {day}
              </button>
            ))}

            {/* Next Month Days */}
            {nextMonthDays.map((day) => (
              <button
                key={`next-${day}`}
                onClick={() => selectDate(day, 1)}
                disabled={isDisabled(day, 1)}
                className={`
                  p-2 text-sm rounded-lg text-center transition-colors
                  ${isDisabled(day, 1)
                    ? 'text-text-muted/30 cursor-not-allowed'
                    : 'text-text-muted hover:bg-surface-hover cursor-pointer'
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-border">
            <button
              onClick={() => {
                const today = new Date();
                onChange(formatDateStr(today));
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs font-heading rounded-lg parchment-panel hover:parchment-primary transition-colors whitespace-nowrap"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onChange(formatDateStr(tomorrow));
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs font-heading rounded-lg parchment-panel hover:parchment-primary transition-colors whitespace-nowrap"
            >
              Amanha
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                onChange(formatDateStr(nextWeek));
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs font-heading rounded-lg parchment-panel hover:parchment-primary transition-colors whitespace-nowrap"
            >
              +7 dias
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
