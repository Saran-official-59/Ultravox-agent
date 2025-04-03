import React from 'react';
import { Task, TaskLabel } from '../contexts/TaskContext';
import { Card, CardContent } from './ui/card';
import { Tag, Trash2, Edit } from 'lucide-react';
import { useDrag } from 'react-dnd/dist/hooks/useDrag';
import { ConnectDragSource } from 'react-dnd';

interface TaskCardProps {
  task: Task;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  // Set up drag functionality
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, columnId: task.columnId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Format date for display
  const formattedDate = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Render label badges
  const renderLabels = () => {
    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {task.labels.map((label) => (
          <span
            key={label}
            className="inline-block h-2 w-6 rounded-full"
            style={{ backgroundColor: `var(--label-${label})` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div ref={dragRef as unknown as React.Ref<HTMLDivElement>}>
      <Card
        className={`mb-2 animate-fade-in cursor-move ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <CardContent className="p-3">
          {renderLabels()}
          <h3 className="text-subtitle-sm mb-1">{task.title}</h3>
          <p className="text-small line-clamp-2 mb-2">{task.description}</p>
          
          <div className="flex-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-small text-gray-400">{formattedDate}</span>
            
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task.id);
                }}
                className="action-button"
              >
                <Edit className="h-3.5 w-3.5 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="action-button"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskCard;
