import React from 'react';
import { Column, Task } from '../contexts/TaskContext';
import TaskCard from './TaskCard';
import { useDrop } from 'react-dnd/dist/hooks/useDrop';
import { Plus } from 'lucide-react';

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDrop: (taskId: string, sourceColumnId: string, destinationColumnId: string, index: number) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDrop,
}) => {
  // Set up drop functionality
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; columnId: string }, monitor) => {
      // Calculate where in the column to insert the task
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const targetRect = dropRef.current?.getBoundingClientRect();
      if (!targetRect) return;
      
      const taskElements = Array.from(
        dropRef.current?.querySelectorAll('.task-card') || []
      );
      
      let targetIndex = tasks.length;
      
      for (let i = 0; i < taskElements.length; i++) {
        const taskRect = taskElements[i].getBoundingClientRect();
        if (clientOffset.y < taskRect.top + taskRect.height / 2) {
          targetIndex = i;
          break;
        }
      }
      
      onDrop(item.id, item.columnId, column.id, targetIndex);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Ref for the column to detect drop position
  const dropRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={(node) => {
        drop(node);
        dropRef.current = node;
      }}
      className={`task-container ${isOver ? 'bg-blue-50' : ''}`}
    >
      <div className="flex-between mb-3">
        <h2 className="text-subtitle-sm text-gray-700">{column.title}</h2>
        <span className="badge-gray">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-2 min-h-[200px]">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <TaskCard
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          </div>
        ))}
      </div>
      
      <button
        onClick={() => onAddTask(column.id)}
        className="mt-2 flex-center w-full py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Task
      </button>
    </div>
  );
};

export default TaskColumn;
