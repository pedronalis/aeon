import { useEffect, useState } from 'react';
import { Plus, Scroll, FileText, Search, X, AlertTriangle, Calendar, CalendarRange, Clock, CheckCircle } from 'lucide-react';
import { useTasksStore } from '@/store/useTasksStore';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { TaskEngine } from '@/domain/tasks/TaskEngine';
import type { CreateTaskInput, Task, TaskUpdateInput } from '@/domain/tasks/Task';

type TaskSectionId = 'overdue' | 'today' | 'week' | 'future' | 'nodate' | 'completed';

const TASK_SECTION_ORDER: TaskSectionId[] = [
  'overdue',
  'today',
  'week',
  'future',
  'nodate',
  'completed',
];

const TASK_SECTION_META: Record<
  TaskSectionId,
  {
    label: string;
    description: string;
    icon: typeof AlertTriangle;
    iconWrap: string;
    iconColor: string;
    badge: string;
  }
> = {
  overdue: {
    label: 'Atrasados',
    description: 'Prioridade máxima',
    icon: AlertTriangle,
    iconWrap: 'parchment-error forge-border-error',
    iconColor: 'text-error',
    badge: 'bg-error/15 text-error border-error/30',
  },
  today: {
    label: 'Hoje',
    description: 'Prazo termina hoje',
    icon: Calendar,
    iconWrap: 'parchment-primary forge-border-primary',
    iconColor: 'text-primary',
    badge: 'bg-primary/15 text-primary border-primary/30',
  },
  week: {
    label: 'Esta semana',
    description: 'Até os próximos 7 dias',
    icon: CalendarRange,
    iconWrap: 'parchment-warning forge-border-warning',
    iconColor: 'text-warning',
    badge: 'bg-warning/15 text-warning border-warning/30',
  },
  future: {
    label: 'Em breve',
    description: 'Além desta semana',
    icon: Clock,
    iconWrap: 'parchment-accent forge-border-accent',
    iconColor: 'text-accent',
    badge: 'bg-accent/15 text-accent border-accent/30',
  },
  nodate: {
    label: 'Sem prazo',
    description: 'Livre, mas não esquecido',
    icon: Scroll,
    iconWrap: 'parchment-panel border border-border/60',
    iconColor: 'text-text-muted',
    badge: 'bg-surface text-text-muted border-border/60',
  },
  completed: {
    label: 'Concluídos',
    description: 'Selados com honra',
    icon: CheckCircle,
    iconWrap: 'parchment-success forge-border-success',
    iconColor: 'text-success',
    badge: 'bg-success/15 text-success border-success/30',
  },
};

const getSectionShellClass = (sectionId: TaskSectionId) => {
  const base = 'parchment-panel rounded-2xl p-4 md:p-5 border border-border/40';
  if (sectionId === 'overdue') {
    return `${base} bg-error/5 ring-1 ring-error/30`;
  }
  if (sectionId === 'today') {
    return `${base} bg-primary/5 ring-1 ring-primary/30`;
  }
  if (sectionId === 'week') {
    return `${base} bg-warning/5`;
  }
  if (sectionId === 'future') {
    return `${base} bg-accent/5`;
  }
  if (sectionId === 'completed') {
    return `${base} bg-success/5`;
  }
  return base;
};

const buildTaskSections = (tasks: Task[]) => {
  const buckets: Record<TaskSectionId, Task[]> = {
    overdue: [],
    today: [],
    week: [],
    future: [],
    nodate: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.status === 'completed') {
      buckets.completed.push(task);
      continue;
    }

    if (!task.deadline) {
      buckets.nodate.push(task);
      continue;
    }

    const daysUntil = TaskEngine.getDaysUntilDeadline(task.deadline);
    if (daysUntil < 0 || task.status === 'overdue') {
      buckets.overdue.push(task);
      continue;
    }

    if (daysUntil === 0) {
      buckets.today.push(task);
      continue;
    }

    if (daysUntil <= 7) {
      buckets.week.push(task);
      continue;
    }

    buckets.future.push(task);
  }

  return TASK_SECTION_ORDER
    .map((id) => ({ id, tasks: buckets[id] }))
    .filter((section) => section.tasks.length > 0);
};

export function TasksPage() {
  const {
    tasks,
    subtasks,
    filter,
    loading,
    activeTaskId,
    loadTasks,
    createTask,
    completeTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtask,
    updateTask,
    setFilter,
    setActiveTask,
    getFilteredTasks,
    reorderTasks,
    reorderSubtasks,
  } = useTasksStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
  const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const pushToast = useNotificationsStore((state) => state.pushToast);
  const searchValue = search.trim();
  const searchTerm = searchValue.toLowerCase();
  const matchesSearch = (task: Task) => {
    if (!searchTerm) return true;
    const title = task.title.toLowerCase();
    const description = task.description?.toLowerCase() ?? '';
    return title.includes(searchTerm) || description.includes(searchTerm);
  };
  const getDisplayedTasks = () => {
    const base = getFilteredTasks().filter(matchesSearch);
    const shouldGroup = filter === 'all' || filter === 'pending';
    if (!shouldGroup) return base;
    const sections = buildTaskSections(base);
    return sections.flatMap((section) => section.tasks);
  };

  useEffect(() => {
    loadTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTask = async (input: CreateTaskInput) => {
    await createTask(input);
  };

  const handleCompleteTask = async (taskId: string) => {
    const xpGained = await completeTask(taskId);
    if (xpGained > 0) {
      const task = tasks.find((t) => t.id === taskId);
      pushToast({
        kind: 'xp',
        title: 'Pergaminho selado',
        description: task?.title,
        xp: xpGained,
        icon: '✨',
      });
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const xpChange = await toggleSubtask(subtaskId);
    if (xpChange > 0) {
      const subtask = subtasks.find((s) => s.id === subtaskId);
      pushToast({
        kind: 'xp',
        title: 'Etapa selada',
        description: subtask?.title,
        xp: xpChange,
        icon: '✨',
      });
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    await addSubtask(taskId, title);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteSubtask(subtaskId);
  };

  const handleUpdateSubtask = async (subtaskId: string, title: string) => {
    await updateSubtask(subtaskId, title);
  };

  const handleUpdateTask = async (taskId: string, updates: TaskUpdateInput) => {
    await updateTask(taskId, updates);
  };

  // Task drag handlers
  const handleTaskDragStart = (index: number) => {
    setDraggedTaskIndex(index);
  };

  const handleTaskDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTaskIndex !== null && draggedTaskIndex !== index) {
      setDragOverTaskIndex(index);
    }
  };

  const handleTaskDragLeave = () => {
    setDragOverTaskIndex(null);
  };

  const handleTaskDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedTaskIndex === null || draggedTaskIndex === dropIndex) {
      setDraggedTaskIndex(null);
      setDragOverTaskIndex(null);
      return;
    }

    // Usar as tarefas filtradas exibidas na tela
    const displayedTasks = getDisplayedTasks();

    if (draggedTaskIndex >= displayedTasks.length || dropIndex >= displayedTasks.length) {
      setDraggedTaskIndex(null);
      setDragOverTaskIndex(null);
      return;
    }

    // Reordenar a lista
    const newTasks = [...displayedTasks];
    const [removed] = newTasks.splice(draggedTaskIndex, 1);
    newTasks.splice(dropIndex, 0, removed);

    // Persistir a nova ordem
    await reorderTasks(newTasks.map((t) => t.id));

    setDraggedTaskIndex(null);
    setDragOverTaskIndex(null);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskIndex(null);
    setDragOverTaskIndex(null);
  };

  // Subtask reorder handler
  const handleReorderSubtasks = async (taskId: string, subtaskIds: string[]) => {
    await reorderSubtasks(taskId, subtaskIds);
  };

  if (loading) {
    return (
      <Container maxWidth="2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary font-body animate-pulse">
            Carregando pergaminhos...
          </p>
        </div>
      </Container>
    );
  }

  const filteredTasks = getFilteredTasks().filter(matchesSearch);
  const shouldGroup = filter === 'all' || filter === 'pending';
  const groupedSections = shouldGroup ? buildTaskSections(filteredTasks) : null;
  const displayedTasks = groupedSections
    ? groupedSections.flatMap((section) => section.tasks)
    : filteredTasks;
  const taskIndexById = new Map(displayedTasks.map((task, index) => [task.id, index]));

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    overdue: tasks.filter((t) => t.status === 'overdue').length,
  };

  return (
    <Container maxWidth="2xl" className="animate-fade-in" noPadding>
      <div className="px-4 py-4 md:py-6 lg:py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="parchment-primary forge-border-primary p-3 rounded-xl">
              <FileText size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gilded-primary font-display">
                Pergaminhos
              </h1>
              <p className="text-text-secondary text-sm font-body">
                Suas tarefas e missões pessoais
              </p>
            </div>
          </div>

          <Button
            variant="royal"
            onClick={() => setIsFormOpen(true)}
            icon={<Plus size={18} />}
          >
            <span className="hidden md:inline">Novo Pergaminho</span>
            <span className="md:hidden">Novo</span>
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pergaminhos por título ou descrição..."
              leftIcon={<Search size={16} />}
              rightIcon={
                searchValue ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-text-muted hover:text-text transition-colors"
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                ) : null
              }
              className="flex-1"
            />
            {searchValue && (
              <div className="parchment-panel rounded-lg px-3 py-2 text-xs font-heading text-text-secondary whitespace-nowrap">
                {filteredTasks.length} resultado{filteredTasks.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <TaskFilters
            currentFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
        </div>

        {/* Task List */}
        <div className="space-y-6">
          {displayedTasks.length === 0 ? (
            <div className="parchment-ultra rounded-2xl p-8 md:p-12 text-center forge-border-primary">
              <Scroll
                size={48}
                className="text-text-muted mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-bold text-text mb-2 font-display">
                {searchValue
                  ? 'Nenhum pergaminho encontrado'
                  : filter === 'all'
                    ? 'Nenhum pergaminho no salão'
                    : `Nenhum pergaminho ${
                        filter === 'pending'
                          ? 'pendente'
                          : filter === 'completed'
                            ? 'concluído'
                            : 'atrasado'
                      }`}
              </h3>
              <p className="text-text-secondary font-body mb-4">
                {searchValue
                  ? `Nenhum pergaminho responde ao termo "${searchValue}".`
                  : filter === 'all'
                    ? 'Forje seu primeiro pergaminho e dê início à sua saga.'
                    : 'Nenhum pergaminho respondeu a este selo.'}
              </p>
              {filter === 'all' && !searchValue && (
                <Button
                  variant="royal"
                  onClick={() => setIsFormOpen(true)}
                  icon={<Plus size={16} />}
                >
                  Criar Pergaminho
                </Button>
              )}
            </div>
          ) : groupedSections ? (
            groupedSections.map((section, sectionIndex) => {
              const meta = TASK_SECTION_META[section.id];
              const Icon = meta.icon;
              return (
                <div
                  key={section.id}
                  className={`${getSectionShellClass(section.id)} animate-slide-in-up`}
                  style={{ animationDelay: `${sectionIndex * 80}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${meta.iconWrap}`}>
                        <Icon size={16} className={meta.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-sm font-heading text-text">{meta.label}</h3>
                        <p className="text-xs text-text-muted font-body">{meta.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-heading px-2 py-1 rounded-full border ${meta.badge}`}>
                      {section.tasks.length}
                    </span>
                  </div>
                  <div className="ornate-divider opacity-60 my-4" />
                  <div className="space-y-4">
                    {section.tasks.map((task) => {
                      const index = taskIndexById.get(task.id) ?? 0;
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          subtasks={subtasks.filter((s) => s.taskId === task.id).sort((a, b) => a.order - b.order)}
                          isActive={activeTaskId === task.id}
                          isDragging={draggedTaskIndex === index}
                          isDragOver={dragOverTaskIndex === index}
                          onComplete={handleCompleteTask}
                          onDelete={deleteTask}
                          onToggleSubtask={handleToggleSubtask}
                          onAddSubtask={handleAddSubtask}
                          onDeleteSubtask={handleDeleteSubtask}
                          onUpdateSubtask={handleUpdateSubtask}
                          onUpdateTask={handleUpdateTask}
                          onSetActive={setActiveTask}
                          onReorderSubtasks={handleReorderSubtasks}
                          onDragStart={() => handleTaskDragStart(index)}
                          onDragOver={(e) => handleTaskDragOver(e, index)}
                          onDragLeave={handleTaskDragLeave}
                          onDrop={(e) => handleTaskDrop(e, index)}
                          onDragEnd={handleTaskDragEnd}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            displayedTasks.map((task) => {
              const index = taskIndexById.get(task.id) ?? 0;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  subtasks={subtasks.filter((s) => s.taskId === task.id).sort((a, b) => a.order - b.order)}
                  isActive={activeTaskId === task.id}
                  isDragging={draggedTaskIndex === index}
                  isDragOver={dragOverTaskIndex === index}
                  onComplete={handleCompleteTask}
                  onDelete={deleteTask}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateSubtask={handleUpdateSubtask}
                  onUpdateTask={handleUpdateTask}
                  onSetActive={setActiveTask}
                  onReorderSubtasks={handleReorderSubtasks}
                  onDragStart={() => handleTaskDragStart(index)}
                  onDragOver={(e) => handleTaskDragOver(e, index)}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={(e) => handleTaskDrop(e, index)}
                  onDragEnd={handleTaskDragEnd}
                />
              );
            })
          )}
        </div>

        {/* Active Task Indicator */}
        {activeTaskId && (
          <div className="fixed bottom-4 right-4 parchment-accent forge-border-accent rounded-lg px-4 py-2 shadow-elevation-3 animate-fade-in">
            <p className="text-sm font-heading text-accent">
              Tarefa vinculada ao Timer
            </p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTask}
      />
    </Container>
  );
}
