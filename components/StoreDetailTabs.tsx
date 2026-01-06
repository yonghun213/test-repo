'use client';

import { useState } from 'react';
import StoreForm from './StoreForm';
import CalendarView from './CalendarView';
import TaskEditModal from './TaskEditModal';
import TaskCreateModal from './TaskCreateModal';

interface Task {
  id: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  phase?: string;
  priority?: string;
}

interface Props {
  store: any;
  countries: any[];
  userId: string;
  userRole: string;
}

export default function StoreDetailTabs({
  store,
  countries,
  userId,
  userRole,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');
  const [tasks, setTasks] = useState<Task[]>(store.tasks || []);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canEdit = ['ADMIN', 'PM', 'CONTRIBUTOR'].includes(userRole);

  // Calendar event handlers
  const handleEventDrop = async ({ event, start, end }: { event: any; start: Date; end: Date }) => {
    const taskId = event.id || event.resource?.id;
    if (!taskId) return;
    
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          dueDate: end.toISOString(),
          reschedulePolicy: 'THIS_ONLY'
        })
      });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, startDate: start.toISOString(), dueDate: end.toISOString() }
          : t
      ));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleEventClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleTaskCreate = async (taskData: Partial<Task>) => {
    try {
      const res = await fetch(`/api/stores/${store.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'edit'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Edit
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Top Row - Owner & Stats (Left) + Store Info (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Owner Information + Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Owner Information
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {store.ownerName && (
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.ownerName}
                    </dd>
                  </div>
                )}
                {store.ownerPhone && (
                  <div>
                    <dt className="text-sm text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.ownerPhone}
                    </dd>
                  </div>
                )}
                {store.ownerEmail && (
                  <div>
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.ownerEmail}
                    </dd>
                  </div>
                )}
                {store.ownerAddress && (
                  <div>
                    <dt className="text-sm text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.ownerAddress}
                    </dd>
                  </div>
                )}
              </dl>
              
              {/* Quick Stats - Horizontal Layout */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <dd className="text-2xl font-semibold text-gray-900">
                      {tasks.length}
                    </dd>
                    <dt className="text-xs text-gray-500 mt-1">Total Tasks</dt>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <dd className="text-2xl font-semibold text-gray-900">
                      {store.files.length}
                    </dd>
                    <dt className="text-xs text-gray-500 mt-1">Files</dt>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <dd className="text-2xl font-semibold text-gray-900">
                      {store.milestones.length}
                    </dd>
                    <dt className="text-xs text-gray-500 mt-1">Milestones</dt>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Store Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Store Information
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        store.status === 'PLANNING'
                          ? 'bg-blue-100 text-blue-800'
                          : store.status === 'CONTRACT_SIGNED'
                          ? 'bg-purple-100 text-purple-800'
                          : store.status === 'CONSTRUCTION'
                          ? 'bg-yellow-100 text-yellow-800'
                          : store.status === 'PRE_OPENING'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {store.status.replace(/_/g, ' ')}
                    </span>
                  </dd>
                </div>
                {store.tempName && (
                  <div>
                    <dt className="text-sm text-gray-500">Temporary Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.tempName}
                    </dd>
                  </div>
                )}
                {store.officialName && (
                  <div>
                    <dt className="text-sm text-gray-500">Official Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.officialName}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">{store.country}</dd>
                </div>
                {store.city && (
                  <div>
                    <dt className="text-sm text-gray-500">City</dt>
                    <dd className="mt-1 text-sm text-gray-900">{store.city}</dd>
                  </div>
                )}
                {store.address && (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.address}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Timezone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{store.timezone}</dd>
                </div>
                {store.storePhone && (
                  <div>
                    <dt className="text-sm text-gray-500">Store Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.storePhone}
                    </dd>
                  </div>
                )}
                {store.storeEmail && (
                  <div>
                    <dt className="text-sm text-gray-500">Store Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {store.storeEmail}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Bottom - Calendar with Task Management */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Calendar</h3>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
              >
                + Add Task
              </button>
            </div>
            <CalendarView
              tasks={tasks}
              onEventDrop={handleEventDrop}
              onEventClick={handleEventClick}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl">
          <StoreForm countries={countries} userId={userId} store={store} />
        </div>
      )}

      {/* Task Edit Modal */}
      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleTaskUpdate}
        />
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        storeId={store.id}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleTaskCreate}
      />
    </div>
  );
}
