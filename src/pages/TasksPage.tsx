import { useEffect, useState } from 'react';
import { Plus, Scroll, FileText } from 'lucide-react';
import { useTasksStore } from '@/store/useTasksStore';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/shared/Button';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import type { CreateTaskInput, Task } from '@/domain/tasks/Task';

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

  useEffect(() => {
    loadTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTask = async (input: CreateTaskInput) => {
    await createTask(input);
  };

  const handleCompleteTask = async (taskId: string) => {
    const xpGained = await completeTask(taskId);
    if (xpGained > 0) {
      console.log(`Task completed! +${xpGained} XP`);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const xpChange = await toggleSubtask(subtaskId);
    if (xpChange !== 0) {
      console.log(`Subtask toggled: ${xpChange > 0 ? '+' : ''}${xpChange} XP`);
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

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
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
    const displayedTasks = getFilteredTasks();

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

  const filteredTasks = getFilteredTasks();

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

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters
            currentFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="parchment-ultra rounded-2xl p-8 md:p-12 text-center forge-border-primary">
              <Scroll
                size={48}
                className="text-text-muted mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-bold text-text mb-2 font-display">
                {filter === 'all'
                  ? 'Nenhum pergaminho ainda'
                  : `Nenhum pergaminho ${
                      filter === 'pending'
                        ? 'pendente'
                        : filter === 'completed'
                          ? 'concluído'
                          : 'atrasado'
                    }`}
              </h3>
              <p className="text-text-secondary font-body mb-4">
                {filter === 'all'
                  ? 'Crie seu primeiro pergaminho para começar a rastrear suas tarefas!'
                  : 'Nenhuma tarefa encontrada com esse filtro.'}
              </p>
              {filter === 'all' && (
                <Button
                  variant="royal"
                  onClick={() => setIsFormOpen(true)}
                  icon={<Plus size={16} />}
                >
                  Criar Pergaminho
                </Button>
              )}
            </div>
          ) : (
            filteredTasks.map((task, index) => (
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
            ))
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
