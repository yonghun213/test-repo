'use client';

import { useState } from 'react';
import StoreForm from './StoreForm';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

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
  const [newOpenDate, setNewOpenDate] = useState('');
  const [openDateReason, setOpenDateReason] = useState('');
  const [isAddingDate, setIsAddingDate] = useState(false);

  const canEdit = ['ADMIN', 'PM', 'CONTRIBUTOR'].includes(userRole);

  const handleAddOpenDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDate(true);

    try {
      const response = await fetch(`/api/stores/${store.id}/open-dates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newOpenDate,
          reason: openDateReason,
          changedBy: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add open date');
      }

      toast.success('Open date added successfully!');
      setNewOpenDate('');
      setOpenDateReason('');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to add open date');
    } finally {
      setIsAddingDate(false);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Store Information */}
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

            {/* Owner Information */}
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
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Planned Open Dates */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Planned Open Dates
              </h3>

              {canEdit && (
                <form onSubmit={handleAddOpenDate} className="mb-4 pb-4 border-b">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New Date
                      </label>
                      <input
                        type="date"
                        value={newOpenDate}
                        onChange={(e) => setNewOpenDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={openDateReason}
                        onChange={(e) => setOpenDateReason(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Date changed because..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingDate}
                      className="w-full px-3 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      {isAddingDate ? 'Adding...' : 'Add Date'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {store.plannedOpenDates.length === 0 ? (
                  <p className="text-sm text-gray-500">No dates set</p>
                ) : (
                  store.plannedOpenDates.map((date: any, index: number) => (
                    <div
                      key={date.id}
                      className={`p-3 rounded-md ${
                        index === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={`text-sm font-medium ${
                            index === 0 ? 'text-orange-900' : 'text-gray-900'
                          }`}
                        >
                          {formatDate(date.date)}
                        </p>
                        {index === 0 && (
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      {date.reason && (
                        <p className="text-xs text-gray-600">{date.reason}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Set on {formatDate(date.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Total Tasks</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {store.tasks.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Files</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {store.files.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Milestones</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {store.milestones.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl">
          <StoreForm countries={countries} userId={userId} store={store} />
        </div>
      )}
    </div>
  );
}
