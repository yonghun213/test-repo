'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { X } from 'lucide-react';

interface TaskEditModalProps {
  task: any;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: any) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export default function TaskEditModal({ task, isOpen = true, onClose, onSave, onDelete }: TaskEditModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState(task?.status || 'NOT_STARTED');
  const [policy, setPolicy] = useState<'THIS_ONLY' | 'CASCADE_LATER' | 'CASCADE_ALL'>('THIS_ONLY');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setStartDate(
        task.startDate || task.start_date
          ? format(new Date(task.startDate || task.start_date), 'yyyy-MM-dd')
          : ''
      );
      setDueDate(
        task.dueDate || task.due_date
          ? format(new Date(task.dueDate || task.due_date), 'yyyy-MM-dd')
          : ''
      );
      setStatus(task.status || 'NOT_STARTED');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(task.id, {
        title,
        startDate,
        dueDate,
        status,
        reschedulePolicy: policy
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="block mb-1">Task Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label className="block mb-1">Phase</Label>
            <p className="text-gray-600">{task.phase || 'Uncategorized'}</p>
          </div>

          <div>
            <Label htmlFor="status" className="block mb-1">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="block mb-1">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate" className="block mb-1">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="block mb-2">Reschedule Policy</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="policy"
                  value="THIS_ONLY"
                  checked={policy === 'THIS_ONLY'}
                  onChange={() => setPolicy('THIS_ONLY')}
                  className="text-orange-500"
                />
                <span className="text-sm">This task only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="policy"
                  value="CASCADE_LATER"
                  checked={policy === 'CASCADE_LATER'}
                  onChange={() => setPolicy('CASCADE_LATER')}
                  className="text-orange-500"
                />
                <span className="text-sm">Cascade to later tasks</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="policy"
                  value="CASCADE_ALL"
                  checked={policy === 'CASCADE_ALL'}
                  onChange={() => setPolicy('CASCADE_ALL')}
                  className="text-orange-500"
                />
                <span className="text-sm">Cascade to all linked tasks</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
