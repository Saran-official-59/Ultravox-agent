import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { fetchTasks, createTask, updateTaskAPI, deleteTaskAPI, fetchBoard, updateBoard } from '../services/api';

// Define task types
export type TaskLabel = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

type TaskResponse = {
  _id: string;
  title: string;
  description: string;
  labels: TaskLabel[];
  createdAt: string;
  columnId: string;
};

type BoardResponse = {
  columns: Column[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  labels: TaskLabel[];
  createdAt: string;
  columnId: string;
};

export type Column = {
  id: string;
  title: string;
  taskIds: string[];
};

export type Board = {
  columns: Column[];
  tasks: Record<string, Task>;
};

type TaskContextType = {
  board: Board;
  loading: boolean;
  addTask: (columnId: string, title: string, description: string, labels: TaskLabel[]) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceColumnId: string, destinationColumnId: string, newIndex: number) => Promise<void>;
};

// Create initial empty board
const initialBoard: Board = {
  columns: [
    { id: 'column-1', title: 'To Do', taskIds: [] },
    { id: 'column-2', title: 'In Progress', taskIds: [] },
    { id: 'column-3', title: 'Done', taskIds: [] },
  ],
  tasks: {},
};

// Create the task context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load tasks and board structure from API when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setBoard(initialBoard);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load board structure
        const boardData = await fetchBoard(user.id) as BoardResponse;
        
        // Load tasks
        const tasksData = await fetchTasks(user.id) as TaskResponse[];
        
        // Convert tasks array to record object
        const tasksRecord: Record<string, Task> = {};
        tasksData.forEach((task) => {
          tasksRecord[task._id] = {
            id: task._id,
            title: task.title,
            description: task.description,
            labels: task.labels,
            createdAt: task.createdAt,
            columnId: task.columnId
          };
        });

        setBoard({
          columns: boardData.columns,
          tasks: tasksRecord
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load your tasks');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Add a new task
  const addTask = async (columnId: string, title: string, description: string, labels: TaskLabel[]) => {
    if (!user) {
      toast.error('You must be logged in to add tasks');
      return;
    }

    try {
      const newTask = await createTask(user.id, title, description, labels, columnId) as TaskResponse;
      
      setBoard(prev => {
        // Create updated column
        const updatedColumns = prev.columns.map(column => {
          if (column.id === columnId) {
            return {
              ...column,
              taskIds: [...column.taskIds, newTask._id],
            };
          }
          return column;
        });

        // Create updated tasks
        const updatedTasks = {
          ...prev.tasks,
          [newTask._id]: {
            id: newTask._id,
            title: newTask.title,
            description: newTask.description,
            labels: newTask.labels,
            createdAt: newTask.createdAt,
            columnId: newTask.columnId,
          },
        };

        // Update board structure in the backend
        updateBoard(user.id, { columns: updatedColumns });

        return {
          columns: updatedColumns,
          tasks: updatedTasks,
        };
      });

      toast.success('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  // Update a task
  const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    if (!user) {
      toast.error('You must be logged in to update tasks');
      return;
    }

    try {
      await updateTaskAPI(taskId, updates);

      setBoard(prev => {
        const task = prev.tasks[taskId];
        if (!task) return prev;

        const updatedTask = {
          ...task,
          ...updates,
        };

        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            [taskId]: updatedTask,
          },
        };
      });

      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete tasks');
      return;
    }

    try {
      await deleteTaskAPI(taskId);

      setBoard(prev => {
        const task = prev.tasks[taskId];
        if (!task) return prev;

        // Create a copy of tasks without the deleted task
        const { [taskId]: deletedTask, ...remainingTasks } = prev.tasks;

        // Update column to remove taskId
        const updatedColumns = prev.columns.map(column => {
          if (column.taskIds.includes(taskId)) {
            return {
              ...column,
              taskIds: column.taskIds.filter(id => id !== taskId),
            };
          }
          return column;
        });

        // Update board structure in the backend
        updateBoard(user.id, { columns: updatedColumns });

        return {
          columns: updatedColumns,
          tasks: remainingTasks,
        };
      });

      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Move a task between columns or reorder within a column
  const moveTask = async (taskId: string, sourceColumnId: string, destinationColumnId: string, newIndex: number) => {
    if (!user) {
      toast.error('You must be logged in to move tasks');
      return;
    }

    setBoard(prev => {
      // Find the source and destination columns
      const sourceColumn = prev.columns.find(col => col.id === sourceColumnId);
      const destinationColumn = prev.columns.find(col => col.id === destinationColumnId);
      
      if (!sourceColumn || !destinationColumn) return prev;

      // Create new columns array removing the task from source
      const updatedColumns = prev.columns.map(column => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            taskIds: column.taskIds.filter(id => id !== taskId),
          };
        }
        return column;
      });

      // Add the task to the destination column at the specified index
      const finalColumns = updatedColumns.map(column => {
        if (column.id === destinationColumnId) {
          const newTaskIds = [...column.taskIds];
          newTaskIds.splice(newIndex, 0, taskId);
          return {
            ...column,
            taskIds: newTaskIds,
          };
        }
        return column;
      });

      // Update the task's columnId if it has changed
      const updatedTasks = {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          columnId: destinationColumnId,
        },
      };

      // Update the task in the backend
      updateTaskAPI(taskId, { columnId: destinationColumnId });
      
      // Update board structure in the backend
      updateBoard(user.id, { columns: finalColumns });

      return {
        columns: finalColumns,
        tasks: updatedTasks,
      };
    });
  };

  return (
    <TaskContext.Provider value={{ board, loading, addTask, updateTask, deleteTask, moveTask }}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use the task context
export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
