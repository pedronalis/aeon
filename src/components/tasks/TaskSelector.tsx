import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { Task } from '@/domain/tasks/Task';
import { EFFORT_CONFIG } from '@/domain/tasks/Task';

interface TaskSelectorProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
  placeholder?: string;
}

export function TaskSelector({
  tasks,
  selectedTaskId,
  onSelect,
  placeholder = 'Selecionar pergaminho...',
}: TaskSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

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

  const handleSelect = (taskId: string) => {
    onSelect(taskId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  if (tasks.length === 0) {
    return (
      <p className="text-xs text-text-muted text-center py-2 font-body">
        Nenhum pergaminho pendente
      </p>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected Task Display or Selector Button */}
      {selectedTask ? (
        <div className="flex items-center gap-2 p-2 parchment-primary rounded-lg">
          <span className="text-sm">{EFFORT_CONFIG[selectedTask.effort].icon}</span>
          <span className="flex-1 text-sm font-body text-text truncate">
            {selectedTask.title}
          </span>
          <button
            onClick={handleClear}
            className="p-1 text-text-muted hover:text-danger transition-colors"
            aria-label="Desvincular tarefa"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full flex items-center justify-between gap-2
            px-3 py-2 rounded-lg text-sm font-body
            bg-surface text-text-muted border-2 border-border
            hover:border-primary/50 transition-colors
          "
        >
          <span className="truncate">{placeholder}</span>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && !selectedTask && (
        <div className="
          absolute z-50 mt-1 w-full
          parchment-ultra forge-border-primary rounded-lg shadow-elevation-3
          py-1 max-h-48 overflow-y-auto animate-fade-in
        ">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleSelect(task.id)}
              className="
                w-full flex items-center gap-2 px-3 py-2
                text-left text-sm font-body
                hover:parchment-primary transition-colors
              "
            >
              <span className="flex-shrink-0">{EFFORT_CONFIG[task.effort].icon}</span>
              <span className="flex-1 truncate text-text">{task.title}</span>
              {task.status === 'overdue' && (
                <span className="text-xs text-danger font-heading">Vencida</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
