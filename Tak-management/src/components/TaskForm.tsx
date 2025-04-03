
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { TaskLabel, Task } from '../contexts/TaskContext';
import { Label } from './ui/label';
import { CheckCircle2 } from 'lucide-react';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, labels: TaskLabel[]) => void;
  task?: Task;
  isEditing?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ open, onClose, onSubmit, task, isEditing = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<TaskLabel[]>([]);

  const availableLabels: { value: TaskLabel; name: string }[] = [
    { value: 'red', name: 'Urgent' },
    { value: 'orange', name: 'High Priority' },
    { value: 'yellow', name: 'Medium Priority' },
    { value: 'green', name: 'Low Priority' },
    { value: 'blue', name: 'Info' },
    { value: 'purple', name: 'Feature' },
  ];

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setSelectedLabels(task.labels);
    } else {
      setTitle('');
      setDescription('');
      setSelectedLabels([]);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    onSubmit(title.trim(), description.trim(), selectedLabels);
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedLabels([]);
  };

  const toggleLabel = (label: TaskLabel) => {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          
          <div className="space-y-1">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {availableLabels.map((label) => (
                <button
                  key={label.value}
                  type="button"
                  className={`
                    flex items-center px-2 py-1 rounded-md text-xs font-medium
                    ${selectedLabels.includes(label.value)
                      ? 'ring-2 ring-offset-1'
                      : 'opacity-70'}
                  `}
                  style={{
                    backgroundColor: `var(--label-${label.value})`,
                    color: ['yellow', 'green'].includes(label.value) ? 'black' : 'white',
                  }}
                  onClick={() => toggleLabel(label.value)}
                >
                  {label.name}
                  {selectedLabels.includes(label.value) && (
                    <CheckCircle2 className="ml-1 h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
