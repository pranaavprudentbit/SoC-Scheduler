'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { User } from '@/lib/types';
import { UserPlus, Trash2, Shield, ShieldAlert, User as UserIcon, Loader2, X } from 'lucide-react';

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
          <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Team Members</h3>
          <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-widest">Access Control & Roles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl active:scale-95 w-full sm:w-auto"
        >
          {showForm ? <X size={20} /> : <UserPlus size={20} />}
          {showForm ? 'Cancel Enrollment' : 'Add Member'}
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
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Access Password</label>
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
              {loading ? 'Provisioning...' : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.sort((a, b) => (a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? -1 : 1)).map((user) => {
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
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.isAdmin ? 'bg-blue-500' : 'bg-green-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-black text-zinc-900 flex items-center gap-2 truncate">
                    {user.name} {isCurrentUser && <span className="text-[8px] bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full uppercase">You</span>}
                  </div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">{user.role} Member</div>
                </div>
                {user.isAdmin ? (
                  <Shield className="text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" size={24} />
                ) : (
                  <UserIcon className="text-zinc-300 opacity-20 group-hover:opacity-100 transition-opacity" size={24} />
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-50">
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => handleUpdateRole(user.id, user.isAdmin ? 'ANALYST' : 'ADMIN')}
                    disabled={isCurrentUser || isBusy}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.isAdmin
                      ? 'bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-500 border border-zinc-100'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {isBusy ? <Loader2 size={14} className="animate-spin" /> : user.isAdmin ? <ShieldAlert size={14} /> : <Shield size={14} />}
                    {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
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
  );
};
