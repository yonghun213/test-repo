'use client';

import { useState, useEffect } from 'react';
import StoreForm from './StoreForm';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import OpeningReadiness from './OpeningReadiness';
import TaskEditModal from './TaskEditModal';
import TaskCreateModal from './TaskCreateModal';
import { Calendar, BarChart3, Target, CheckSquare, FileText, Flag, Download, Eye } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'readiness' | 'edit'>('overview');
  const [viewMode, setViewMode] = useState<'calendar' | 'gantt'>('calendar');
  const [tasks, setTasks] = useState<Task[]>(store.tasks || []);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuickStat, setSelectedQuickStat] = useState<'tasks' | 'files' | 'milestones' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const canEdit = ['ADMIN', 'PM', 'CONTRIBUTOR'].includes(userRole);

  // Update timezone clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time for timezone
  const getTimezoneTime = () => {
    try {
      return currentTime.toLocaleTimeString('en-US', {
        timeZone: store.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return currentTime.toLocaleTimeString('en-US', { hour12: false });
    }
  };

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
          <button
            onClick={() => setActiveTab('readiness')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
              activeTab === 'readiness'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="w-4 h-4" />
            Readiness
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
          {/* Calendar/Gantt View Toggle - Moved to Top */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Store Overview</h2>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'gantt'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Gantt
                </button>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Top Row - Owner & Stats (Left) + Store Info (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Owner Information + Interactive Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Owner Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="md:col-span-2">
                      <dt className="text-sm text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {store.ownerEmail}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Store Information Card */}
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
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500">Timezone</dt>
                    <dd className="mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{store.timezone}</span>
                        <span className="text-lg font-mono font-semibold text-blue-600">
                          {getTimezoneTime()}
                        </span>
                      </div>
                    </dd>
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

            {/* Right Side - Interactive Quick Stats with Detail Panel */}
            <div className="space-y-4">
              {/* Quick Stats - Clickable */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedQuickStat(selectedQuickStat === 'tasks' ? null : 'tasks')}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedQuickStat === 'tasks'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <CheckSquare className={`w-6 h-6 mx-auto mb-2 ${
                      selectedQuickStat === 'tasks' ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                    <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Tasks</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedQuickStat(selectedQuickStat === 'files' ? null : 'files')}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedQuickStat === 'files'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <FileText className={`w-6 h-6 mx-auto mb-2 ${
                      selectedQuickStat === 'files' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className="text-2xl font-bold text-gray-900">{store.files.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Files</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedQuickStat(selectedQuickStat === 'milestones' ? null : 'milestones')}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedQuickStat === 'milestones'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <Flag className={`w-6 h-6 mx-auto mb-2 ${
                      selectedQuickStat === 'milestones' ? 'text-green-600' : 'text-gray-600'
                    }`} />
                    <div className="text-2xl font-bold text-gray-900">{store.milestones.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Milestones</div>
                  </button>
                </div>
              </div>

              {/* Detail Panel - Blue Box */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 min-h-[320px]">
                {selectedQuickStat === null ? (
                  <div className="flex items-center justify-center h-full text-white text-center">
                    <div>
                      <div className="text-2xl font-bold mb-2">간이 리스트 목록</div>
                      <p className="text-blue-100 text-sm">
                        Click Tasks, Files, or Milestones above to view details
                      </p>
                    </div>
                  </div>
                ) : selectedQuickStat === 'tasks' ? (
                  <div className="text-white">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Recent Tasks ({tasks.slice(0, 5).length})
                    </h4>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto">
                      {tasks.slice(0, 5).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsEditModalOpen(true);
                          }}
                          className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        >
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-blue-100 mt-1">
                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-white/20 rounded">{task.status}</span>
                            {task.phase && (
                              <span className="text-xs px-2 py-0.5 bg-white/20 rounded">{task.phase}</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-center py-8 text-blue-100">No tasks available</div>
                      )}
                    </div>
                  </div>
                ) : selectedQuickStat === 'files' ? (
                  <div className="text-white">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Recent Files ({store.files.slice(0, 5).length})
                    </h4>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto">
                      {store.files.slice(0, 5).map((file: any) => (
                        <div
                          key={file.id}
                          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{file.fileName}</div>
                              <div className="text-xs text-blue-100 mt-1">
                                {(file.fileSize / 1024).toFixed(1)} KB · {new Date(file.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => window.open(file.filePath, '_blank')}
                                className="p-1.5 hover:bg-white/20 rounded"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={file.filePath}
                                download={file.fileName}
                                className="p-1.5 hover:bg-white/20 rounded"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                      {store.files.length === 0 && (
                        <div className="text-center py-8 text-blue-100">No files uploaded</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-white">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Flag className="w-5 h-5" />
                      Milestones ({store.milestones.length})
                    </h4>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto">
                      {store.milestones.map((milestone: any) => (
                        <div
                          key={milestone.id}
                          className="p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                        >
                          <div className="font-medium text-sm">{milestone.type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-blue-100 mt-1">
                            📅 {new Date(milestone.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {store.milestones.length === 0 && (
                        <div className="text-center py-8 text-blue-100">No milestones set</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom - Calendar/Gantt View */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Schedule</h3>
            
            {viewMode === 'calendar' ? (
              <CalendarView
                tasks={tasks}
                onEventDrop={handleEventDrop}
                onEventClick={handleEventClick}
              />
            ) : (
              <GanttChart
                tasks={tasks as any}
                onTaskClick={(task) => handleEventClick(task as any)}
              />
            )}
          </div>
        </div>
      ) : activeTab === 'readiness' ? (
        <div className="space-y-6">
          <OpeningReadiness
            tasks={tasks as any}
            targetOpenDate={store.targetOpenDate}
            storeName={store.officialName || store.tempName || 'Store'}
          />
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
