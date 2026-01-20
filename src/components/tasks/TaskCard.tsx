import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Trash2,
  Play,
  AlertTriangle,
  GripVertical,
} from 'lucide-react';
import type { Task, Subtask } from '@/domain/tasks/Task';
import { TaskEngine } from '@/domain/tasks/TaskEngine';
import { EFFORT_CONFIG } from '@/domain/tasks/Task';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

interface TaskCardProps {
  task: Task;
  subtasks: Subtask[];
  isActive?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onSetActive?: (taskId: string) => void;
  onReorderSubtasks?: (taskId: string, subtaskIds: string[]) => void;
  // Task drag handlers
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function TaskCard({
  task,
  subtasks,
  isActive,
  isDragging,
  isDragOver,
  onComplete,
  onDelete,
  onToggleSubtask,
  onSetActive,
  onReorderSubtasks,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [draggedSubtaskIndex, setDraggedSubtaskIndex] = useState<number | null>(null);
  const [dragOverSubtaskIndex, setDragOverSubtaskIndex] = useState<number | null>(null);

  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue';
  const config = EFFORT_CONFIG[task.effort];
  const progress = TaskEngine.calculateProgress(subtasks);

  const borderClass = isCompleted
    ? 'forge-border-success'
    : isOverdue
      ? 'forge-border-danger'
      : isActive
        ? 'forge-border-accent ring-2 ring-accent/30'
        : 'forge-border-primary';

  // Subtask drag handlers
  const handleSubtaskDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/subtask', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSubtaskIndex(index);
  };

  const handleSubtaskDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Only handle if this is a subtask drag
    if (draggedSubtaskIndex !== null && draggedSubtaskIndex !== index) {
      setDragOverSubtaskIndex(index);
    }
  };

  const handleSubtaskDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverSubtaskIndex(null);
  };

  const handleSubtaskDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if this is a subtask drag
    const subtaskData = e.dataTransfer.getData('text/subtask');
    if (!subtaskData) return;

    if (draggedSubtaskIndex === null || draggedSubtaskIndex === dropIndex) {
      setDraggedSubtaskIndex(null);
      setDragOverSubtaskIndex(null);
      return;
    }

    // Reorder subtasks
    const newSubtasks = [...subtasks];
    const [removed] = newSubtasks.splice(draggedSubtaskIndex, 1);
    newSubtasks.splice(dropIndex, 0, removed);

    // Call parent to persist
    if (onReorderSubtasks) {
      onReorderSubtasks(task.id, newSubtasks.map((s) => s.id));
    }

    setDraggedSubtaskIndex(null);
    setDragOverSubtaskIndex(null);
  };

  const handleSubtaskDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedSubtaskIndex(null);
    setDragOverSubtaskIndex(null);
  };

  // Task drag handlers - wrap to check if it's not a subtask drag
  const handleTaskDragStart = (e: React.DragEvent) => {
    // Don't start task drag if we're dragging a subtask
    if (draggedSubtaskIndex !== null) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/task', task.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.();
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    // Only handle if this is a task drag (not subtask)
    if (draggedSubtaskIndex !== null) return;
    onDragOver?.(e);
  };

  const handleTaskDrop = (e: React.DragEvent) => {
    // Only handle if this is a task drag
    const taskData = e.dataTransfer.getData('text/task');
    if (!taskData) return;
    onDrop?.(e);
  };

  return (
    <div
      draggable={!isCompleted && draggedSubtaskIndex === null}
      onDragStart={handleTaskDragStart}
      onDragOver={handleTaskDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleTaskDrop}
      onDragEnd={onDragEnd}
      className={`
        transition-all duration-fast
        ${isDragging ? 'opacity-50' : ''}
        ${isDragOver ? 'transform translate-y-1' : ''}
      `}
    >
      <Card
        variant="parchment"
        className={`
          ${borderClass}
          ${isDragOver ? 'ring-2 ring-primary' : ''}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {!isCompleted && (
            <div className="cursor-grab active:cursor-grabbing text-text-muted hover:text-primary transition-colors pt-3">
              <GripVertical size={16} />
            </div>
          )}

          {/* Effort Icon */}
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg
              ${isCompleted
                ? 'parchment-success'
                : isOverdue
                  ? 'parchment-danger'
                  : 'parchment-primary'
              }
            `}
          >
            {isCompleted ? <Check size={20} className="text-success" /> : config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className={`
                  font-bold text-base truncate font-heading
                  ${isCompleted ? 'text-gilded-success line-through' : 'text-text'}
                `}
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isOverdue && (
                  <span className="text-xs font-semibold text-danger uppercase tracking-wider flex items-center gap-1 animate-pulse font-heading">
                    <AlertTriangle size={12} />
                    Vencida
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs font-semibold text-success uppercase tracking-wider font-heading">
                    Completa
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-text-secondary text-sm mb-2 font-body line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs mb-2">
              {/* XP */}
              <span
                className={`font-semibold font-heading ${
                  isOverdue ? 'text-danger' : 'text-primary'
                }`}
              >
                {isOverdue ? `-${task.xpPenalty}` : `+${task.xpReward}`} XP
              </span>

              {/* Effort Level */}
              <span className="text-text-muted font-body">{config.label}</span>

              {/* Deadline */}
              {task.deadline && (
                <span
                  className={`flex items-center gap-1 ${TaskEngine.getDeadlineColorClass(task)}`}
                >
                  <Calendar size={12} />
                  {TaskEngine.formatDeadlineText(task.deadline)}
                </span>
              )}

              {/* Linked Pomodoros */}
              {task.linkedPomodoros > 0 && (
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock size={12} />
                  {task.linkedPomodoros}
                </span>
              )}
            </div>

            {/* Subtasks Progress Bar */}
            {subtasks.length > 0 && (
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between text-xs font-body">
                  <span className={isCompleted ? 'text-success' : 'text-text-secondary'}>
                    {progress.completed}/{progress.total} etapas
                  </span>
                  <span className="text-text-muted">{progress.percentage}%</span>
                </div>
                <div className="relative h-2 parchment-ultra rounded-full overflow-hidden">
                  <div
                    className={`
                      absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full
                      ${isCompleted
                        ? 'bg-gradient-to-r from-success to-success/80'
                        : 'bg-gradient-to-r from-primary to-bronze'
                      }
                    `}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expandable Subtasks */}
            {subtasks.length > 0 && (
              <div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors font-heading"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded ? 'Ocultar etapas' : 'Ver etapas'}
                </button>

                {expanded && (
                  <div className="mt-2 pl-1 border-l-2 border-border space-y-0.5 animate-fade-in">
                    {subtasks.map((subtask, index) => (
                      <div
                        key={subtask.id}
                        draggable={!isCompleted}
                        onDragStart={(e) => handleSubtaskDragStart(e, index)}
                        onDragOver={(e) => handleSubtaskDragOver(e, index)}
                        onDragLeave={handleSubtaskDragLeave}
                        onDrop={(e) => handleSubtaskDrop(e, index)}
                        onDragEnd={handleSubtaskDragEnd}
                        className={`
                          flex items-center gap-2 py-1.5 px-1 rounded group
                          transition-all duration-fast
                          ${!isCompleted ? 'cursor-grab active:cursor-grabbing' : ''}
                          ${draggedSubtaskIndex === index ? 'opacity-50 bg-primary/10' : ''}
                          ${dragOverSubtaskIndex === index ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-surface-hover'}
                        `}
                      >
                        {!isCompleted && (
                          <GripVertical size={12} className="text-text-muted flex-shrink-0" />
                        )}

                        <button
                          onClick={() => !isCompleted && onToggleSubtask(subtask.id)}
                          disabled={isCompleted}
                          className={`
                            flex-shrink-0 w-5 h-5 rounded-md
                            flex items-center justify-center
                            transition-all duration-fast
                            focus:outline-none focus:scale-110
                            ${subtask.completed
                              ? 'bg-success text-background'
                              : 'border-2 border-border hover:border-primary text-transparent hover:text-primary/50'
                            }
                            ${isCompleted ? 'cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          aria-label={subtask.completed ? 'Desmarcar subtarefa' : 'Marcar subtarefa'}
                        >
                          {subtask.completed && <Check size={12} strokeWidth={3} />}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isCompleted && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  onClick={() => onComplete(task.id)}
                  variant="royal"
                  size="sm"
                  icon={<Check size={14} />}
                >
                  Concluir
                </Button>

                {onSetActive && !isActive && (
                  <Button
                    onClick={() => onSetActive(task.id)}
                    variant="parchment"
                    size="sm"
                    icon={<Play size={14} />}
                  >
                    Vincular
                  </Button>
                )}

                <div className="flex-1" />

                <Button
                  onClick={() => onDelete(task.id)}
                  variant="iron"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  aria-label="Deletar tarefa"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
