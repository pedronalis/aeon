import { useState, useRef } from 'react';
import { Check, GripVertical, Pencil, Plus, Scroll, X } from 'lucide-react';
import type { TaskEffort, CreateTaskInput } from '@/domain/tasks/Task';
import { EFFORT_CONFIG, EFFORT_ORDER } from '@/domain/tasks/Task';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { DatePicker } from '@/components/shared/DatePicker';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => void;
}

const FORM_STEPS = [
  { id: 'details', label: 'Essência', hint: 'Título e descrição' },
  { id: 'effort', label: 'Dificuldade', hint: 'Risco e recompensa' },
  { id: 'deadline', label: 'Prazo', hint: 'Opcional' },
  { id: 'subtasks', label: 'Etapas', hint: 'Quebra do pergaminho' },
] as const;

const EFFORT_OPTIONS: {
  value: TaskEffort;
  label: string;
  icon: string;
  xp: number;
  penalty: number;
}[] = EFFORT_ORDER.map((value) => {
  const config = EFFORT_CONFIG[value];
  return {
    value,
    label: config.label,
    icon: config.icon,
    xp: config.xpReward,
    penalty: config.xpPenalty,
  };
});

export function TaskForm({ isOpen, onClose, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effort, setEffort] = useState<TaskEffort>('common');
  const [deadline, setDeadline] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [step, setStep] = useState(0);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEffort('common');
    setDeadline('');
    setSubtaskInput('');
    setSubtasks([]);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setEditingIndex(null);
    setEditingValue('');
    setStep(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalSteps = FORM_STEPS.length;
  const isLastStep = step === totalSteps - 1;
  const canProceed = step === 0 ? title.trim().length > 0 : true;

  const submitForm = () => {
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      effort,
      deadline: deadline || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    handleClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLastStep) {
      if (!canProceed) return;
      setStep((current) => Math.min(current + 1, totalSteps - 1));
      return;
    }

    submitForm();
  };

  const addSubtask = () => {
    if (subtaskInput.trim() && subtasks.length < 10) {
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput('');
      subtaskInputRef.current?.focus();
    }
  };

  const removeSubtask = (index: number) => {
    if (editingIndex !== null) {
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditingValue('');
      } else if (index < editingIndex) {
        setEditingIndex(editingIndex - 1);
      }
    }
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleStartSubtaskEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(subtasks[index] ?? '');
  };

  const handleCancelSubtaskEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleSaveSubtaskEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    const next = [...subtasks];
    next[editingIndex] = trimmed;
    setSubtasks(next);
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  // Drag and Drop handlers for subtasks
  const handleDragStart = (index: number) => {
    if (editingIndex !== null) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSubtasks = [...subtasks];
    const [removed] = newSubtasks.splice(draggedIndex, 1);
    newSubtasks.splice(dropIndex, 0, removed);
    setSubtasks(newSubtasks);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move subtask with keyboard
  const moveSubtask = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= subtasks.length) return;

    const newSubtasks = [...subtasks];
    const [removed] = newSubtasks.splice(index, 1);
    newSubtasks.splice(newIndex, 0, removed);
    setSubtasks(newSubtasks);
  };

  const config = EFFORT_CONFIG[effort];
  const xpPerSubtask = subtasks.length > 0 ? Math.floor(config.xpReward / subtasks.length) : 0;
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo Pergaminho"
      size="lg"
      footer={
        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="iron" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="parchment"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              Voltar
            </Button>
            {isLastStep ? (
              <Button
                variant="royal"
                onClick={submitForm}
                disabled={!title.trim()}
                icon={<Scroll size={16} />}
              >
                Criar Pergaminho
              </Button>
            ) : (
              <Button
                variant="royal"
                onClick={() => setStep((current) => Math.min(current + 1, totalSteps - 1))}
                disabled={!canProceed}
                icon={<Scroll size={16} />}
              >
                Avançar
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="parchment-panel rounded-xl p-4 border border-primary/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FORM_STEPS.map((stepItem, index) => {
              const isActive = index === step;
              const isCompleted = index < step;
              const canJump = index <= step || title.trim().length > 0;
              return (
                <button
                  key={stepItem.id}
                  type="button"
                  onClick={() => {
                    if (!canJump) return;
                    setStep(index);
                  }}
                  className={`
                    text-left rounded-lg p-3 transition-all duration-fast
                    ${isActive
                      ? 'parchment-primary forge-border-primary shadow-torch-sm'
                      : isCompleted
                        ? 'parchment-panel border border-primary/20 hover:parchment-ultra'
                        : 'parchment-panel border border-border/50 hover:parchment-ultra'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading text-text-muted uppercase tracking-[0.2em]">
                      Etapa {index + 1}
                    </span>
                    {isCompleted && <Check size={12} className="text-success" />}
                  </div>
                  <div className="text-sm font-heading text-text mt-1">{stepItem.label}</div>
                  <div className="text-[11px] text-text-muted font-body mt-1">
                    {stepItem.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {step === 0 && (
          <div className="parchment-panel rounded-xl p-4 border border-primary/10 space-y-4">
            <Input
              label="Título do Pergaminho"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Estudar TypeScript"
              autoFocus
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-heading font-medium text-text">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes adicionais sobre a tarefa..."
                rows={2}
                className="
                  w-full px-4 py-3 rounded-lg font-body
                  bg-surface text-text
                  border-2 border-border transition-all duration-normal
                  placeholder:text-text-muted
                  focus:outline-none focus:border-primary
                  resize-none
                "
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="parchment-panel rounded-xl p-4 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-heading font-medium text-text">
                Dificuldade do Pergaminho
              </label>
              <div className="text-xs font-heading text-text-muted">
                {config.label}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {EFFORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEffort(option.value)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl
                    transition-all duration-fast
                    ${effort === option.value
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
            <div className="flex items-center gap-3 text-xs font-body text-text-muted">
              <span>Recompensa base:</span>
              <span className="font-heading text-primary">+{config.xpReward} XP</span>
              <span className="text-text-muted/50">|</span>
              <span>Penalidade:</span>
              <span className="font-heading text-error">-{config.xpPenalty} XP</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="parchment-panel rounded-xl p-4 border border-primary/10 space-y-2">
            <DatePicker
              value={deadline}
              onChange={setDeadline}
              minDate={minDate}
              label="Prazo (opcional)"
              placeholder="Selecionar prazo..."
            />
            {deadline && (
              <p className="text-xs text-text-muted font-body">
                Penalidade se atrasar: -{config.xpPenalty} XP
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="parchment-panel rounded-xl p-4 border border-primary/10 space-y-2">
            <label className="text-sm font-heading font-medium text-text">
              Etapas (opcional, max 10)
            </label>

            <div className="flex gap-2">
              <Input
                ref={subtaskInputRef}
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Adicionar etapa..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="parchment"
                onClick={addSubtask}
                disabled={!subtaskInput.trim() || subtasks.length >= 10}
                icon={<Plus size={16} />}
              >
                Adicionar
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-xs text-text-muted flex items-center gap-2">
                  <span>XP distribuído: {xpPerSubtask} XP por etapa</span>
                  <span className="text-text-muted/50">|</span>
                  <span>Arraste para reordenar</span>
                </p>
                <div className="parchment-panel rounded-lg p-2 space-y-1">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={`subtask-${index}-${subtask}`}
                      draggable={editingIndex === null}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center gap-2 py-2 px-2 rounded-lg
                        transition-all duration-fast cursor-grab active:cursor-grabbing
                        ${draggedIndex === index ? 'opacity-50 bg-primary/10' : ''}
                        ${dragOverIndex === index ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-surface-hover'}
                      `}
                    >
                      {editingIndex === index ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex items-center gap-1 text-text-muted">
                            <GripVertical size={14} className="cursor-grab" />
                            <span className="text-xs font-mono w-4">{index + 1}.</span>
                          </div>
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveSubtaskEdit();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancelSubtaskEdit();
                              }
                            }}
                            className="
                              flex-1 px-3 py-2 rounded-md font-body text-sm
                              parchment-ultra text-text border-2 border-border
                              focus:outline-none focus:border-primary
                              placeholder:text-text-muted
                            "
                            autoFocus
                          />
                          <button
                            onClick={handleSaveSubtaskEdit}
                            type="button"
                            className="p-1 rounded text-success hover:text-success/80 transition-colors"
                            aria-label="Salvar etapa"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelSubtaskEdit}
                            type="button"
                            className="p-1 rounded text-text-muted hover:text-text transition-colors"
                            aria-label="Cancelar edição"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 text-text-muted">
                            <GripVertical size={14} className="cursor-grab" />
                            <span className="text-xs font-mono w-4">{index + 1}.</span>
                          </div>
                          <span
                            onDoubleClick={() => handleStartSubtaskEdit(index)}
                            className="flex-1 text-sm text-text-secondary font-body truncate cursor-text"
                            title="Duplo clique para editar"
                          >
                            {subtask}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartSubtaskEdit(index)}
                              className="p-1 text-text-muted hover:text-primary transition-colors"
                              aria-label="Editar etapa"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSubtask(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
                              aria-label="Mover para cima"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 15l-6-6-6 6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSubtask(index, 'down')}
                              disabled={index === subtasks.length - 1}
                              className="p-1 text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
                              aria-label="Mover para baixo"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSubtask(index)}
                              className="p-1 text-text-muted hover:text-error transition-colors"
                              aria-label="Remover etapa"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
