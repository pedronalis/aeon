import { useState } from 'react';
import { Check, RefreshCw, X, Calendar, Clock, Scroll } from 'lucide-react';
import { useTasksStore } from '@/store/useTasksStore';
import { TaskEngine } from '@/domain/tasks/TaskEngine';
import { EFFORT_CONFIG } from '@/domain/tasks/Task';
import { Button } from '@/components/shared/Button';
import { TaskSelector } from '@/components/tasks/TaskSelector';

interface XpToast {
  id: number;
  amount: number;
}

export function ActiveTaskPanel() {
  const {
    tasks,
    subtasks,
    activeTaskId,
    setActiveTask,
    toggleSubtask,
    completeTask,
    getTaskWithSubtasks,
  } = useTasksStore();

  const [showSelector, setShowSelector] = useState(false);
  const [xpToasts, setXpToasts] = useState<XpToast[]>([]);

  // Get active task with subtasks
  const activeTaskData = activeTaskId ? getTaskWithSubtasks(activeTaskId) : null;

  // Pending tasks for selector
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'overdue');

  // Show XP toast when subtask is completed
  const showXpGain = (amount: number) => {
    const id = Date.now();
    setXpToasts((prev) => [...prev, { id, amount }]);
    setTimeout(() => {
      setXpToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  };

  // Handle subtask toggle
  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (subtask && !subtask.completed) {
      showXpGain(subtask.xpReward);
    }
    await toggleSubtask(subtaskId);
  };

  // Handle task completion
  const handleCompleteTask = async () => {
    if (!activeTaskId) return;
    const xpGained = await completeTask(activeTaskId);
    if (xpGained > 0) {
      showXpGain(xpGained);
    }
  };

  // Handle task change
  const handleChangeTask = () => {
    setShowSelector(true);
  };

  // Handle task selection
  const handleSelectTask = (taskId: string | null) => {
    setActiveTask(taskId);
    setShowSelector(false);
  };

  // Handle unlinking task
  const handleUnlinkTask = () => {
    setActiveTask(null);
  };

  // No active task - show selector
  if (!activeTaskData || showSelector) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Scroll size={16} className="text-primary" />
            <h2 className="text-base font-display text-primary mb-0.5">Pergaminho Ativo</h2>
          </div>
          <p className="text-text-muted text-xs font-body">
            {showSelector ? 'Selecione outro pergaminho' : 'Vincule um pergaminho ao timer'}
          </p>
        </div>

        {/* Task Selector */}
        <div className="parchment-panel rounded-lg p-4">
          {pendingTasks.length === 0 ? (
            <div className="text-center py-6">
              <Scroll size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <p className="text-sm text-text-muted font-body">
                Nenhum pergaminho pendente
              </p>
              <p className="text-xs text-text-muted/70 font-body mt-1">
                Crie novos pergaminhos na aba Tarefas
              </p>
            </div>
          ) : (
            <>
              <TaskSelector
                tasks={pendingTasks}
                selectedTaskId={null}
                onSelect={handleSelectTask}
                placeholder="Escolher pergaminho..."
              />
              {showSelector && (
                <Button
                  onClick={() => setShowSelector(false)}
                  variant="parchment"
                  size="sm"
                  className="w-full mt-3 justify-center"
                >
                  Cancelar
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex-1" />
      </div>
    );
  }

  // Active task - show details
  const config = EFFORT_CONFIG[activeTaskData.effort];
  const progress = TaskEngine.calculateProgress(activeTaskData.subtasks);
  const isOverdue = activeTaskData.status === 'overdue';

  return (
    <div className="flex flex-col h-full relative">
      {/* XP Toasts */}
      <div className="absolute top-0 right-0 z-10 pointer-events-none">
        {xpToasts.map((toast) => (
          <div
            key={toast.id}
            className="text-sm font-bold text-success animate-fade-in-up mb-1"
          >
            +{toast.amount} XP
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scroll size={16} className="text-primary" />
            <h2 className="text-base font-display text-primary">Pergaminho Ativo</h2>
          </div>
          <button
            onClick={handleUnlinkTask}
            className="p-1 text-text-muted hover:text-danger transition-colors"
            aria-label="Desvincular pergaminho"
            title="Desvincular"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Task Header */}
      <div className="parchment-panel rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          {/* Effort Icon */}
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg
              ${isOverdue ? 'parchment-danger' : 'parchment-primary'}
            `}
          >
            {config.icon}
          </div>

          {/* Title and Meta */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-text truncate font-heading">
              {activeTaskData.title}
            </h3>

            <div className="flex items-center gap-3 text-xs mt-1">
              {/* XP */}
              <span
                className={`font-semibold font-heading ${
                  isOverdue ? 'text-danger' : 'text-primary'
                }`}
              >
                {isOverdue ? `-${activeTaskData.xpPenalty}` : `+${activeTaskData.xpReward}`} XP
              </span>

              {/* Deadline */}
              {activeTaskData.deadline && (
                <span
                  className={`flex items-center gap-1 ${TaskEngine.getDeadlineColorClass(activeTaskData)}`}
                >
                  <Calendar size={10} />
                  {TaskEngine.formatDeadlineText(activeTaskData.deadline)}
                </span>
              )}

              {/* Linked Pomodoros */}
              {activeTaskData.linkedPomodoros > 0 && (
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock size={10} />
                  {activeTaskData.linkedPomodoros}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
      {activeTaskData.subtasks.length > 0 && (
        <div className="flex-1 parchment-panel rounded-lg p-4 mb-4 overflow-hidden flex flex-col">
          <p className="text-xs text-text-muted font-heading mb-2">Etapas</p>

          {/* Subtasks List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {activeTaskData.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-surface-hover group"
              >
                <button
                  onClick={() => handleToggleSubtask(subtask.id)}
                  className={`
                    flex-shrink-0 w-5 h-5 rounded-md
                    flex items-center justify-center
                    transition-all duration-fast
                    focus:outline-none focus:scale-110
                    ${subtask.completed
                      ? 'bg-success text-background'
                      : 'border-2 border-border hover:border-primary text-transparent hover:text-primary/50'
                    }
                    cursor-pointer
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

          {/* Progress Bar */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs font-body mb-1">
              <span className="text-text-secondary">
                {progress.completed}/{progress.total} etapas
              </span>
              <span className="text-text-muted">{progress.percentage}%</span>
            </div>
            <div className="relative h-2 parchment-ultra rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-primary to-bronze"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* No subtasks message */}
      {activeTaskData.subtasks.length === 0 && (
        <div className="flex-1 parchment-panel rounded-lg p-4 mb-4 flex items-center justify-center">
          <p className="text-sm text-text-muted font-body text-center">
            Este pergaminho<br />n&atilde;o possui etapas
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleCompleteTask}
          variant="royal"
          icon={<Check size={16} />}
          className="w-full justify-center"
        >
          Concluir Pergaminho
        </Button>

        <Button
          onClick={handleChangeTask}
          variant="parchment"
          icon={<RefreshCw size={14} />}
          size="sm"
          className="w-full justify-center"
        >
          Trocar Pergaminho
        </Button>
      </div>
    </div>
  );
}
