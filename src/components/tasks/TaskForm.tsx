import { useState, useRef } from 'react';
import { Plus, X, Scroll, GripVertical } from 'lucide-react';
import type { TaskEffort, CreateTaskInput } from '@/domain/tasks/Task';
import { EFFORT_CONFIG } from '@/domain/tasks/Task';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { DatePicker } from '@/components/shared/DatePicker';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => void;
}

const EFFORT_OPTIONS: { value: TaskEffort; label: string; icon: string; xp: number }[] = [
  { value: 'trivial', label: 'Trivial', icon: '📜', xp: 5 },
  { value: 'common', label: 'Comum', icon: '⚔️', xp: 15 },
  { value: 'epic', label: 'Épico', icon: '👑', xp: 30 },
  { value: 'legendary', label: 'Lendário', icon: '🏆', xp: 50 },
];

export function TaskForm({ isOpen, onClose, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effort, setEffort] = useState<TaskEffort>('common');
  const [deadline, setDeadline] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

  const addSubtask = () => {
    if (subtaskInput.trim() && subtasks.length < 10) {
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput('');
      subtaskInputRef.current?.focus();
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  // Drag and Drop handlers for subtasks
  const handleDragStart = (index: number) => {
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
        <div className="flex justify-end gap-3">
          <Button variant="iron" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="royal"
            onClick={handleSubmit}
            disabled={!title.trim()}
            icon={<Scroll size={16} />}
          >
            Criar Pergaminho
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Título da Tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Estudar TypeScript"
          autoFocus
        />

        {/* Description */}
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

        {/* Effort Level */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-heading font-medium text-text">
            Nível de Esforço
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {EFFORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEffort(option.value)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg
                  transition-all duration-fast
                  ${effort === option.value
                    ? 'parchment-primary forge-border-primary'
                    : 'parchment-panel hover:parchment-ultra border-2 border-transparent'
                  }
                `}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-xs font-heading">{option.label}</span>
                <span className="text-xs text-primary font-semibold">+{option.xp} XP</span>
              </button>
            ))}
          </div>
        </div>

        {/* Deadline with Custom DatePicker */}
        <div className="relative">
          <DatePicker
            value={deadline}
            onChange={setDeadline}
            minDate={minDate}
            label="Prazo (opcional)"
            placeholder="Selecionar prazo..."
          />
          {deadline && (
            <p className="text-xs text-text-muted font-body mt-1.5">
              Penalidade se atrasar: -{config.xpPenalty} XP
            </p>
          )}
        </div>

        {/* Subtasks */}
        <div className="flex flex-col gap-2">
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
                <span>XP distribuido: {xpPerSubtask} XP por etapa</span>
                <span className="text-text-muted/50">|</span>
                <span>Arraste para reordenar</span>
              </p>
              <div className="parchment-panel rounded-lg p-2 space-y-1">
                {subtasks.map((subtask, index) => (
                  <div
                    key={`subtask-${index}-${subtask}`}
                    draggable
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
                    <div className="flex items-center gap-1 text-text-muted">
                      <GripVertical size={14} className="cursor-grab" />
                      <span className="text-xs font-mono w-4">{index + 1}.</span>
                    </div>
                    <span className="flex-1 text-sm text-text-secondary font-body truncate">
                      {subtask}
                    </span>
                    <div className="flex items-center gap-1">
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
                        className="p-1 text-text-muted hover:text-danger transition-colors"
                        aria-label="Remover etapa"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
