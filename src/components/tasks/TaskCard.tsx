import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Pencil,
  Plus,
  Trash2,
  Play,
  AlertTriangle,
  GripVertical,
  X,
  Shield,
} from 'lucide-react';
import type { Task, Subtask } from '@/domain/tasks/Task';
import { TaskEngine } from '@/domain/tasks/TaskEngine';
import { EFFORT_CONFIG, EFFORT_ORDER } from '@/domain/tasks/Task';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { DatePicker } from '@/components/shared/DatePicker';

interface TaskCardProps {
  task: Task;
  subtasks: Subtask[];
  isActive?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onUpdateSubtask?: (subtaskId: string, title: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onSetActive?: (taskId: string) => void;
  onReorderSubtasks?: (taskId: string, subtaskIds: string[]) => void;
  // Task drag handlers
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const EDIT_STEPS = [
  { id: 'details', label: 'Essência', hint: 'Título e descrição' },
  { id: 'effort', label: 'Dificuldade', hint: 'Risco e recompensa' },
  { id: 'deadline', label: 'Prazo', hint: 'Com juramento' },
] as const;

export function TaskCard({
  task,
  subtasks,
  isActive,
  isDragging,
  isDragOver,
  onComplete,
  onDelete,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  onUpdateTask,
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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description ?? '');
  const [draftEffort, setDraftEffort] = useState(task.effort);
  const [draftDeadline, setDraftDeadline] = useState(task.deadline ?? '');
  const [editStep, setEditStep] = useState(0);

  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue';
  const config = EFFORT_CONFIG[task.effort];
  const progress = TaskEngine.calculateProgress(subtasks);
  const maxSubtasks = 10;
  const canAddSubtask = !isCompleted && subtasks.length < maxSubtasks;
  const showSubtaskEditor = expanded || subtasks.length === 0;

  const effortOptions = EFFORT_ORDER.map((value) => {
    const config = EFFORT_CONFIG[value];
    return {
      value,
      label: config.label,
      icon: config.icon,
      xp: config.xpReward,
      penalty: config.xpPenalty,
    };
  });

  useEffect(() => {
    if (!isEditingTask) {
      setDraftTitle(task.title);
      setDraftDescription(task.description ?? '');
      setDraftEffort(task.effort);
      setDraftDeadline(task.deadline ?? '');
      setEditStep(0);
    }
  }, [task, isEditingTask]);

  const borderClass = isCompleted
    ? 'forge-border-success'
    : isOverdue
    ? 'forge-border-error'
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

  const handleAddSubtask = () => {
    const trimmedTitle = newSubtaskTitle.trim();
    if (!trimmedTitle || !canAddSubtask) return;
    onAddSubtask?.(task.id, trimmedTitle);
    setNewSubtaskTitle('');
    setExpanded(true);
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditingTitle('');
  };

  const handleSaveEdit = () => {
    if (!editingSubtaskId) return;
    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) return;
    onUpdateSubtask?.(editingSubtaskId, trimmedTitle);
    setEditingSubtaskId(null);
    setEditingTitle('');
  };

  const handleStartTaskEdit = () => {
    if (isCompleted) return;
    setIsEditingTask(true);
    setDraftTitle(task.title);
    setDraftDescription(task.description ?? '');
    setDraftEffort(task.effort);
    setDraftDeadline(task.deadline ?? '');
    setEditStep(0);
  };

  const handleCancelTaskEdit = () => {
    setIsEditingTask(false);
    setDraftTitle(task.title);
    setDraftDescription(task.description ?? '');
    setDraftEffort(task.effort);
    setDraftDeadline(task.deadline ?? '');
    setEditStep(0);
  };

  const handleSaveTaskEdit = async () => {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) return;
    const trimmedDescription = draftDescription.trim();
    await onUpdateTask?.(task.id, {
      title: trimmedTitle,
      description: trimmedDescription,
      effort: draftEffort,
      deadline: draftDeadline ? draftDeadline : null,
    });
    setIsEditingTask(false);
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
        ${isActive ? 'animate-glow-breathe' : ''}
      `}
    >
      <Card
        variant="parchment"
        hoverable
        borderGlow
        className={`
          ${borderClass}
          ${isDragOver ? 'ring-2 ring-primary' : ''}
          ${isCompleted ? 'opacity-95' : ''}
          ${isActive ? 'shadow-torch-accent' : ''}
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
                  ? 'parchment-error'
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
                  <span className="text-xs font-semibold text-error uppercase tracking-wider flex items-center gap-1 animate-pulse font-heading">
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
            {!isEditingTask && task.description && (
              <p className="text-text-secondary text-sm mb-2 font-body line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs mb-2">
              {/* XP */}
              <span
                className={`font-semibold font-heading ${
                  isOverdue ? 'text-error' : 'text-primary'
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

            {isEditingTask && (
              <div className="mt-4 space-y-4 rounded-xl border border-primary/15 parchment-panel p-4 pb-6 shadow-torch-sm">
                <div className="parchment-panel rounded-lg border border-primary/10 p-3">
                  <div className="flex items-center justify-between text-[11px] font-heading text-text-muted mb-2">
                    <span className="uppercase tracking-[0.2em]">Edição guiada</span>
                    <span>Etapa {editStep + 1} de {EDIT_STEPS.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {EDIT_STEPS.map((stepItem, index) => {
                      const isActive = editStep === index;
                      const isCompleted = editStep > index;
                      const canJump = index <= editStep || draftTitle.trim().length > 0;
                      return (
                        <button
                          key={stepItem.id}
                          type="button"
                          onClick={() => {
                            if (!canJump) return;
                            setEditStep(index);
                          }}
                          className={`
                            text-left rounded-lg p-2.5 transition-all duration-fast
                            ${isActive
                              ? 'parchment-primary forge-border-primary shadow-torch-sm'
                              : isCompleted
                                ? 'parchment-panel border border-primary/20 hover:parchment-ultra'
                                : 'parchment-panel border border-border/50 hover:parchment-ultra'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-heading text-text-muted uppercase tracking-[0.2em]">
                              Etapa {index + 1}
                            </span>
                            {isCompleted && <Check size={12} className="text-success" />}
                          </div>
                          <div className="text-sm font-heading text-text mt-1">{stepItem.label}</div>
                          <div className="text-[10px] text-text-muted font-body mt-0.5">
                            {stepItem.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {editStep === 0 && (
                  <div className="space-y-4">
                    <Input
                      label="Título do Pergaminho"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Digite o nome do pergaminho"
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-heading font-medium text-text">
                        Descrição (opcional)
                      </label>
                      <textarea
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        rows={2}
                        placeholder="Detalhes adicionais sobre a tarefa..."
                        className="
                          w-full px-4 py-3 rounded-lg font-body
                          parchment-ultra text-text
                          border-2 border-border transition-all duration-normal
                          placeholder:text-text-muted
                          focus:outline-none focus:border-primary
                          resize-none
                        "
                      />
                    </div>
                  </div>
                )}

                {editStep === 1 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-heading font-medium text-text">
                      Nível de Esforço
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {effortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDraftEffort(option.value)}
                          className={`
                            flex flex-col items-center gap-1.5 p-4 rounded-xl
                            transition-all duration-fast
                            ${draftEffort === option.value
                              ? 'parchment-primary forge-border-primary shadow-torch-sm'
                              : 'parchment-panel border border-border/60 hover:parchment-ultra hover:border-primary/30'
                            }
                          `}
                        >
                          <span className="text-2xl">{option.icon}</span>
                          <span className="text-sm font-heading">{option.label}</span>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] font-heading">
                            <span className="text-primary">+{option.xp} XP</span>
                            <span className="text-text-muted/50">|</span>
                            <span className="text-error">-{option.penalty} XP</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editStep === 2 && (
                  <div className="space-y-3">
                    <div className="relative">
                      <DatePicker
                        value={draftDeadline}
                        onChange={setDraftDeadline}
                        label="Prazo (opcional)"
                        placeholder="Selecione o prazo..."
                      />
                      {draftDeadline && (
                        <p className="text-xs text-text-muted font-body mt-1.5">
                          Penalidade se atrasar: -{config.xpPenalty} XP
                        </p>
                      )}
                    </div>

                    <div className="parchment-ultra rounded-lg border border-primary/20 p-3 flex items-start gap-3">
                      <div className="p-2 rounded-md parchment-primary forge-border-primary shadow-torch-sm">
                        <Shield size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-heading uppercase tracking-[0.28em] text-primary">
                          Juramento de Honra
                        </p>
                        <p className="text-xs text-text-secondary font-body mt-1 leading-relaxed">
                          Ao mover o prazo, tua palavra ecoa nos salões da Ordem. Ajuste apenas quando o destino exigir.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="parchment"
                    size="sm"
                    onClick={() => setEditStep((current) => Math.max(0, current - 1))}
                    disabled={editStep === 0}
                  >
                    Voltar
                  </Button>
                  {editStep < EDIT_STEPS.length - 1 && (
                    <Button
                      variant="parchment"
                      size="sm"
                      onClick={() => setEditStep((current) => Math.min(current + 1, EDIT_STEPS.length - 1))}
                      disabled={editStep === 0 && draftTitle.trim().length === 0}
                    >
                      Avançar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Subtasks Progress Bar */}
            {subtasks.length > 0 && (
              <div className="pt-4 space-y-1 mb-3">
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
              <div className="pt-3">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors font-heading"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded ? 'Ocultar etapas' : 'Ver etapas'}
                </button>

                {expanded && (
                  <div className="mt-2 pl-1 border-l-2 border-border space-y-0.5 animate-fade-in">
                    {subtasks.map((subtask, index) => {
                      const isEditing = editingSubtaskId === subtask.id;

                      return (
                        <div
                          key={subtask.id}
                          draggable={!isCompleted && !isEditing}
                          onDragStart={(e) => handleSubtaskDragStart(e, index)}
                          onDragOver={(e) => handleSubtaskDragOver(e, index)}
                          onDragLeave={handleSubtaskDragLeave}
                          onDrop={(e) => handleSubtaskDrop(e, index)}
                          onDragEnd={handleSubtaskDragEnd}
                          className={`
                            flex items-center gap-2 py-1.5 px-1 rounded group
                            transition-all duration-fast
                            ${!isCompleted && !isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
                            ${draggedSubtaskIndex === index ? 'opacity-50 bg-primary/10' : ''}
                            ${dragOverSubtaskIndex === index ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-surface-hover'}
                          `}
                        >
                          {!isCompleted && !isEditing && (
                            <GripVertical size={12} className="text-text-muted flex-shrink-0" />
                          )}

                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEdit();
                                  }
                                }}
                                className="
                                  flex-1 px-3 py-1.5 rounded-md font-body text-sm
                                  parchment-ultra text-text border-2 border-border
                                  focus:outline-none focus:border-primary
                                  placeholder:text-text-muted
                                "
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                type="button"
                                className="p-1 rounded text-success hover:text-success/80 transition-colors"
                                aria-label="Salvar subtarefa"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                type="button"
                                className="p-1 rounded text-text-muted hover:text-text transition-colors"
                                aria-label="Cancelar edição"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
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

                              <span className="text-[10px] text-text-muted font-heading uppercase tracking-[0.2em] opacity-70 group-hover:text-primary/80 transition-colors">
                                +{subtask.xpReward} XP
                              </span>

                              {!isCompleted && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-fast">
                                  <button
                                    onClick={() => handleStartEdit(subtask)}
                                    type="button"
                                    className="p-1 rounded text-text-muted hover:text-primary transition-colors"
                                    aria-label="Editar subtarefa"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteSubtask?.(subtask.id)}
                                    type="button"
                                    className="p-1 rounded text-text-muted hover:text-error transition-colors"
                                    aria-label="Excluir subtarefa"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {showSubtaskEditor && !isCompleted && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-text-muted font-heading mb-2">
                  <span>Etapas</span>
                  <span>{subtasks.length}/{maxSubtasks}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Adicionar etapa..."
                    className="
                      flex-1 px-3 py-2 rounded-md font-body text-sm
                      parchment-ultra text-text border-2 border-border
                      focus:outline-none focus:border-primary
                      placeholder:text-text-muted
                    "
                  />
                  <Button
                    onClick={handleAddSubtask}
                    variant="parchment"
                    size="sm"
                    icon={<Plus size={14} />}
                    type="button"
                    disabled={!canAddSubtask || !newSubtaskTitle.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                {!canAddSubtask && (
                  <p className="text-xs text-text-muted font-body mt-1">
                    Limite de 10 etapas atingido.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isCompleted && !isEditingTask && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  onClick={() => onComplete(task.id)}
                  variant="royal"
                  size="sm"
                  icon={<Check size={14} />}
                  className="hover:animate-button-press"
                >
                  Concluir
                </Button>

                {onSetActive && !isActive && (
                  <Button
                    onClick={() => onSetActive(task.id)}
                    variant="parchment"
                    size="sm"
                    icon={<Play size={14} />}
                    className="hover:animate-button-press"
                  >
                    Vincular
                  </Button>
                )}

                {isActive && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-accent/30 text-accent text-xs font-heading animate-scale-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Ativo
                  </div>
                )}

                <div className="flex-1" />

                <Button
                  onClick={handleStartTaskEdit}
                  variant="parchment"
                  size="sm"
                  icon={<Pencil size={14} />}
                >
                  Editar
                </Button>

                <Button
                  onClick={() => onDelete(task.id)}
                  variant="iron"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  aria-label="Deletar tarefa"
                />
              </div>
            )}

            {!isCompleted && isEditingTask && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  onClick={handleSaveTaskEdit}
                  variant="royal"
                  size="sm"
                  icon={<Check size={14} />}
                  disabled={!draftTitle.trim()}
                >
                  Salvar
                </Button>
                <Button
                  onClick={handleCancelTaskEdit}
                  variant="iron"
                  size="sm"
                  icon={<X size={14} />}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
