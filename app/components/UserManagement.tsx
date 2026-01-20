'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { User } from '@/lib/types';
import { UserPlus } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onRefresh: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ANALYST' as 'ADMIN' | 'ANALYST',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user's token for authorization
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to create users');
      }
      const idToken = await currentUser.getIdToken();

      // Use API route to create user (doesn't affect current session)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          isAdmin: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setFormData({ email: '', password: '', name: '', role: 'ANALYST' });
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to create user', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h3 className="text-zinc-900 text-base sm:text-lg font-semibold">Team Members</h3>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">Manage user accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="p-4 sm:p-6 bg-white border border-zinc-200 rounded-xl space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'ANALYST' })}
                className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ANALYST">Analyst</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900 font-medium">
              <strong>Note:</strong> Admin privileges must be set manually in the database. Contact the developer to grant admin access.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 text-sm rounded-xl hover:bg-zinc-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-xl transition-colors hover:border-zinc-300"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full bg-zinc-100 object-cover"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                {user.name}
                {user.isAdmin && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">ADMIN</span>
                )}
              </div>
              <div className="text-xs text-zinc-500">{user.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
