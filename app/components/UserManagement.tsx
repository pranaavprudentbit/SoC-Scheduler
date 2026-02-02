'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { User } from '@/lib/types';
import { UserPlus, Trash2, Shield, ShieldAlert, User as UserIcon, Loader2, X, ToggleLeft, ToggleRight, CheckCircle2, XCircle } from 'lucide-react';

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('You must be logged in');
      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...formData,
          isAdmin: formData.role === 'ADMIN',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create user');

      setFormData({ email: '', password: '', name: '', role: 'ANALYST' });
      setShowForm(false);
      onRefresh();

      // Log creation
      await import('@/lib/logger').then(m => m.logActivity(
        currentUser.uid,
        currentUser.email || 'Admin',
        'User Created',
        `Created new user ${formData.name} (${formData.email}) as ${formData.role}`,
        'PROFILE_UPDATE'
      ));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId,
          role: newRole,
          isAdmin: newRole === 'ADMIN',
        }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      onRefresh();

      // Obtain user name for logging - might be efficient to pass it or find it, but let's just log ID for now or find from users prop if possible.
      // We have users prop, let's find the user name.
      const targetUser = users.find(u => u.id === userId);

      // Log role update
      await import('@/lib/logger').then(m => m.logActivity(
        currentUser.uid,
        currentUser.email || 'Admin',
        'Role Updated',
        `Changed role for ${targetUser?.name || userId} to ${newRole}`,
        'PROFILE_UPDATE'
      ));

    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      onRefresh();

      const targetUser = users.find(u => u.id === userId);
      const action = !currentStatus ? 'Reactivated' : 'Deactivated';

      // Log status toggle
      await import('@/lib/logger').then(m => m.logActivity(
        currentUser.uid,
        currentUser.email || 'Admin',
        'User Status Changed',
        `${action} user ${targetUser?.name || userId}`,
        'PROFILE_UPDATE'
      ));

    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY remove ${userName}? This will delete their account and all their shifts.`)) return;

    setActionLoading(userId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`/api/users/${userId}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      onRefresh();

      // Log deletion
      await import('@/lib/logger').then(m => m.logActivity(
        currentUser.uid,
        currentUser.email || 'Admin',
        'User Deleted',
        `Permanently deleted user ${userName}`,
        'PROFILE_UPDATE'
      ));

    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-6 pb-6 border-b border-zinc-200 mb-8 text-center">
        <div>
          <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Team</h3>
          <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-widest">Manage Users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl active:scale-95 w-full sm:w-auto"
        >
          {showForm ? <X size={20} /> : <UserPlus size={20} />}
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="p-6 sm:p-8 bg-white border border-zinc-200 rounded-[2rem] space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                placeholder="e.g. John Doe"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Team Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'ANALYST' })}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none"
              >
                <option value="ANALYST">SOC Analyst</option>
                <option value="ADMIN">SOC Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                placeholder="name@company.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-xs text-red-700 font-black tracking-tight">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-12">
        {/* Active Personnel Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
              {users.filter(u => u.isActive !== false).length} Online
            </div>
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Active Users</h4>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users
              .filter(u => u.isActive !== false)
              .sort((a, b) => (a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? -1 : 1))
              .map((user) => {
                const isCurrentUser = auth.currentUser?.uid === user.id;
                const isBusy = actionLoading === user.id;

                return (
                  <div
                    key={user.id}
                    className="group relative flex flex-col p-6 bg-white border border-zinc-200 rounded-[2.5rem] transition-all hover:shadow-2xl hover:border-blue-500/20 hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-16 h-16 rounded-full bg-zinc-100 object-cover ring-4 ring-white shadow-md transition-transform group-hover:scale-110"
                        />
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.isAdmin ? 'bg-blue-500' : 'bg-transparent'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-black text-zinc-900 flex items-center gap-2 truncate">
                          {user.name}
                          {isCurrentUser && <span className="text-[8px] bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full uppercase">You</span>}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {/* Role Badge */}
                          <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 ${user.isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                            }`}>
                            {user.isAdmin ? <Shield size={10} /> : <UserIcon size={10} />}
                            {user.isAdmin ? 'Admin Access' : 'Analyst Access'}
                          </div>

                          {/* Duty Badge */}
                          <div className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Active Duty
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-zinc-50">
                      <div className="flex-1 flex gap-2">
                        {/* Grant/Revoke Admin Logic */}
                        <button
                          onClick={() => handleUpdateRole(user.id, user.isAdmin ? 'ANALYST' : 'ADMIN')}
                          disabled={isCurrentUser || isBusy}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.isAdmin
                            ? 'bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 border border-zinc-100'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : user.isAdmin ? <ShieldAlert size={14} /> : <Shield size={14} />}
                          {user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                        </button>

                        {/* Deactivate User Logic */}
                        <button
                          onClick={() => handleToggleActive(user.id, true)}
                          disabled={isCurrentUser || isBusy}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ToggleRight size={14} />}
                          Deactivate
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={isCurrentUser || isBusy}
                          className="flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Inactive Personnel Section */}
        {users.some(u => u.isActive === false) && (
          <div className="space-y-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                {users.filter(u => u.isActive === false).length} Inactive
              </div>
              <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Inactive Users</h4>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users
                .filter(u => u.isActive === false)
                .map((user) => {
                  const isBusy = actionLoading === user.id;

                  return (
                    <div
                      key={user.id}
                      className="group relative flex flex-col p-6 bg-zinc-50/50 border border-zinc-200 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-xl"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative grayscale group-hover:grayscale-0 transition-all">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-16 h-16 rounded-full bg-zinc-100 object-cover ring-4 ring-white shadow-md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-black text-zinc-400 group-hover:text-zinc-900 transition-colors truncate">
                            {user.name}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            {/* Role Badge - Simplified for Inactive */}
                            <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 ${user.isAdmin ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
                              }`}>
                              {user.isAdmin ? <Shield size={10} /> : <UserIcon size={10} />}
                              {user.isAdmin ? 'Admin' : 'Analyst'}
                            </div>

                            {/* Inactive Loading Badge */}
                            <div className="text-[9px] font-bold text-zinc-400 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100">
                              <XCircle size={10} />
                              INACTIVE
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                        <div className="flex-1 flex gap-2">
                          <button
                            onClick={() => handleToggleActive(user.id, false)}
                            disabled={isBusy}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ToggleLeft size={14} />}
                            Reactivate Duty
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={isBusy}
                            className="flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
