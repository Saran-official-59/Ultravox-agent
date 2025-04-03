
import React, { useState } from 'react';
import { DndProvider } from "react-dnd/dist/core/DndProvider";
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTask } from '../contexts/TaskContext';
import TaskColumn from '../components/TaskColumn';
import TaskForm from '../components/TaskForm';
import TaskDeleteDialog from '../components/TaskDeleteDialog';
import Navbar from '../components/Navbar';
import { TaskLabel } from '../contexts/TaskContext';
import { Loader2 } from 'lucide-react';

const Board = () => {
  const { board, loading, addTask, updateTask, deleteTask, moveTask } = useTask();
  
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentColumnId, setCurrentColumnId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Get the current task if editing
  const currentTask = currentTaskId ? board.tasks[currentTaskId] : undefined;

  // Handle opening task form for adding
  const handleAddTask = (columnId: string) => {
    setCurrentColumnId(columnId);
    setIsEditing(false);
    setIsTaskFormOpen(true);
  };

  // Handle opening task form for editing
  const handleEditTask = (taskId: string) => {
    setCurrentTaskId(taskId);
    setIsEditing(true);
    setIsTaskFormOpen(true);
  };

  // Handle opening delete dialog
  const handleDeleteDialogOpen = (taskId: string) => {
    setCurrentTaskId(taskId);
    setIsDeleteDialogOpen(true);
  };

  // Handle task submission (add or edit)
  const handleTaskSubmit = async (title: string, description: string, labels: TaskLabel[]) => {
    if (isEditing && currentTaskId) {
      await updateTask(currentTaskId, { title, description, labels });
    } else if (currentColumnId) {
      await addTask(currentColumnId, title, description, labels);
    }
    
    setIsTaskFormOpen(false);
    setCurrentTaskId(null);
    setCurrentColumnId(null);
  };

  // Handle task deletion confirmation
  const handleDeleteConfirm = async () => {
    if (currentTaskId) {
      await deleteTask(currentTaskId);
    }
    
    setIsDeleteDialogOpen(false);
    setCurrentTaskId(null);
  };

  // Handle task drag and drop
  const handleTaskDrop = async (taskId: string, sourceColumnId: string, destinationColumnId: string, index: number) => {
    await moveTask(taskId, sourceColumnId, destinationColumnId, index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex-center p-4">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar onNewTask={() => {
        setCurrentColumnId(board.columns[0].id);
        setIsEditing(false);
        setIsTaskFormOpen(true);
      }} />
      
      <div className="flex-1 p-4 overflow-x-auto">
        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-4 min-h-[calc(100vh-10rem)]">
            {board.columns.map((column) => {
              const columnTasks = column.taskIds.map((taskId) => board.tasks[taskId]).filter(Boolean);
              
              return (
                <TaskColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteDialogOpen}
                  onDrop={handleTaskDrop}
                />
              );
            })}
          </div>
        </DndProvider>
      </div>
      
      {/* Task Form Modal */}
      <TaskForm
        open={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleTaskSubmit}
        task={currentTask}
        isEditing={isEditing}
      />
      
      {/* Delete Confirmation Dialog */}
      <TaskDeleteDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Board;
