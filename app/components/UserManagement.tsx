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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-200 mb-8">
        <div>
          <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Team Members</h3>
          <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">Access Control & ROles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl active:scale-95 w-full sm:w-auto"
        >
          <UserPlus size={20} />
          Add Member
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="p-6 sm:p-8 bg-white border border-zinc-200 rounded-[2rem] space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
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

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start">
            <div className="p-1 bg-amber-200 rounded text-amber-700 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 14c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-xs text-amber-900 font-bold leading-relaxed">
              Admin privileges must be synchronized with the security policy. System verification may be required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              {loading ? 'Provisioning...' : 'Confirm Enrollment'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-8 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl text-sm font-black hover:bg-zinc-50 transition-all active:scale-95"
            >
              Discard
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.sort((a, b) => (a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? -1 : 1)).map((user) => (
          <div
            key={user.id}
            className="group relative flex items-center gap-4 p-5 bg-white border border-zinc-200 rounded-[2rem] transition-all hover:shadow-2xl hover:border-blue-500/20 hover:scale-[1.02]"
          >
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-full bg-zinc-100 object-cover ring-4 ring-white shadow-md"
              />
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.isAdmin ? 'bg-blue-500' : 'bg-green-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-black text-zinc-900 flex items-center gap-2 truncate">
                {user.name}
              </div>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">{user.role} Member</div>
            </div>
            {user.isAdmin && (
              <div className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase tracking-widest">
                Admin
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
