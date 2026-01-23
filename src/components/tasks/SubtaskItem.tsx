import { Check, X, Circle } from 'lucide-react';
import type { Subtask } from '@/domain/tasks/Task';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (subtaskId: string) => void;
  onDelete?: (subtaskId: string) => void;
  disabled?: boolean;
}

export function SubtaskItem({ subtask, onToggle, onDelete, disabled }: SubtaskItemProps) {
  return (
    <div
      className={`
        flex items-center gap-2 py-1.5 group
        ${disabled ? 'opacity-60' : ''}
      `}
    >
      <button
        onClick={() => !disabled && onToggle(subtask.id)}
        disabled={disabled}
        className={`
          flex-shrink-0 w-5 h-5 rounded-md
          flex items-center justify-center
          transition-all duration-fast
          focus:outline-none focus:scale-110
          ${subtask.completed
            ? 'bg-success text-background'
            : 'border-2 border-border hover:border-primary text-transparent hover:text-primary/50'
          }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={subtask.completed ? 'Desmarcar subtarefa' : 'Marcar subtarefa'}
      >
        {subtask.completed ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <Circle size={10} className="opacity-0 group-hover:opacity-100" />
        )}
      </button>

      <span
        className={`
          flex-1 text-sm font-body
          ${subtask.completed ? 'text-text-muted line-through' : 'text-text-secondary'}
        `}
      >
        {subtask.title}
      </span>

      <span className="text-xs text-primary font-heading opacity-70">
        +{subtask.xpReward} XP
      </span>

      {onDelete && !disabled && (
        <button
          onClick={() => onDelete(subtask.id)}
          className="
            opacity-0 group-hover:opacity-100
            p-1 rounded text-text-muted hover:text-error
            transition-all duration-fast
          "
          aria-label="Remover subtarefa"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
