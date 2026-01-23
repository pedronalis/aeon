import { List, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { TaskFilter } from '@/domain/tasks/Task';

interface TaskFiltersProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  counts: {
    all: number;
    pending: number;
    completed: number;
    overdue: number;
  };
}

const FILTERS: { value: TaskFilter; label: string; icon: typeof List }[] = [
  { value: 'all', label: 'Todos', icon: List },
  { value: 'pending', label: 'Pendentes', icon: Clock },
  { value: 'completed', label: 'Concluídos', icon: CheckCircle },
  { value: 'overdue', label: 'Atrasados', icon: AlertTriangle },
];

export function TaskFilters({ currentFilter, onFilterChange, counts }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ value, label, icon: Icon }) => {
        const isActive = currentFilter === value;
        const count = counts[value];

        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              text-sm font-heading transition-all duration-fast
              ${isActive
                ? 'parchment-primary text-primary forge-border-primary'
                : 'parchment-panel text-text-secondary hover:text-text hover:parchment-ultra'
              }
            `}
          >
            <Icon size={14} />
            <span>{label}</span>
            <span
              className={`
                ml-1 px-1.5 py-0.5 rounded text-xs
                ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
