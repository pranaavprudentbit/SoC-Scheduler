'use client';

import React, { useState } from 'react';
import { Save, Clock, Calendar, X, Plus, Moon, Sun, Sunset, User as UserIcon, BarChart2, History, FileText, Activity } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Shift, SwapRequest, LeaveRequest, ShiftType } from '@/lib/types';
import { ShiftHistory } from './ShiftHistory';
import { PerformanceDashboard } from './PerformanceDashboard';
import { BulkAvailability } from './BulkAvailability';
import { LeaveRequestPanel } from './LeaveRequestPanel';

interface PreferencesPanelProps {
  currentUser: User;
  shifts: Shift[];
  users: User[];
  swaps: SwapRequest[];
  leaveRequests: LeaveRequest[];
  onUpdate: (user: User) => void;
  onRefresh: () => void;
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({
  currentUser,
  shifts,
  users,
  swaps,
  leaveRequests,
  onUpdate,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'history' | 'performance' | 'availability' | 'leaves'>('profile');
  const [prefs, setPrefs] = useState(currentUser.preferences);
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [loading, setLoading] = useState(false);

  const toggleShiftType = (type: ShiftType) => {
    const current = prefs.preferredShifts;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setPrefs({ ...prefs, preferredShifts: updated });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        name,
        avatar,
        preferredDays: prefs.preferredDays,
        preferredShifts: prefs.preferredShifts,
        updatedAt: new Date().toISOString()
      });

      const { logActivity } = await import('@/lib/logger');
      await logActivity(
        currentUser.id,
        name,
        'Updated Profile',
        'Updated profile details and preferences',
        'PROFILE_UPDATE'
      );

      onUpdate({ ...currentUser, name, avatar, preferences: prefs });
    } catch (error: any) {
      console.error('Failed to update preferences', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return <Sun size={20} />;
      case ShiftType.EVENING: return <Sunset size={20} />;
      case ShiftType.NIGHT: return <Moon size={20} />;
    }
  };

  const getShiftTime = (type: ShiftType) => {
    switch (type) {
      case ShiftType.NIGHT: return '01:00 AM - 09:00 AM';
      case ShiftType.MORNING: return '09:00 AM - 05:00 PM';
      case ShiftType.EVENING: return '05:00 PM - 01:00 AM';
    }
  };

  const subTabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'leaves', label: 'Leaves', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8 pb-20 sm:pb-0">
      {/* Header - Centered for consistency */}
      <div className="flex flex-col items-center justify-center gap-6 pb-8 border-b border-zinc-200 text-center">
        <div className="px-1 sm:px-0">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">
            Settings
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">
            Operational preferences & Profile
          </p>
        </div>
        {activeSubTab === 'profile' && (
          <button
            onClick={handleSave}
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 w-full sm:w-auto ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
          >
            <Save size={16} /> {loading ? 'Syncing...' : 'Update Profile'}
          </button>
        )}
      </div>

      {/* Strategic Navigation Ribbon - Sticky on mobile */}
      <div className="sticky top-[64px] sm:static z-40 -mx-4 px-4 sm:mx-0 sm:px-0 bg-white/80 backdrop-blur-md sm:bg-transparent py-2 sm:py-0 border-b border-zinc-200 sm:border-0">
        <div className="overflow-x-auto scrollbar-hide overscroll-x-contain touch-pan-x">
          <div className="flex bg-zinc-100/50 p-1 rounded-2xl border border-zinc-200/50 w-max min-w-full items-center justify-center gap-1">
            {subTabs.map(tab => {
              const isActive = activeSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0 ${isActive
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                  <span className="hidden sm:block whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeSubTab === 'profile' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Tactical Profile Node */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-8 shadow-sm overflow-hidden relative">

              <div className="flex items-center gap-3 mb-6 relative">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Identity Details</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Personal Identification</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fleet Callsign</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 hover:border-zinc-200 text-zinc-900 px-4 py-3 sm:py-4 rounded-2xl font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-300"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Visual ID Signature</label>
                  <div className="flex flex-wrap gap-3 items-center">
                    {[
                      { theme: 'Matrix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Matrix' },
                      { theme: 'Circuit', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Circuit' },
                      { theme: 'Terminal', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Terminal' },
                      { theme: 'Mainframe', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mainframe' },
                      { theme: 'Gateway', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gateway' },
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAvatar(opt.url)}
                        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${avatar === opt.url
                          ? 'border-purple-600 ring-4 ring-purple-600/10 shadow-lg'
                          : 'border-zinc-100 hover:border-zinc-300'
                          }`}
                      >
                        <img src={opt.url} alt={`Avatar ${i}`} className="w-full h-full object-cover bg-zinc-50" />
                        {avatar === opt.url && (
                          <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center">
                            <div className="bg-purple-600 text-white rounded-full p-0.5 shadow-sm">
                              <Plus className="rotate-45" size={10} strokeWidth={4} />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Active Preview */}
                    <div className="ml-auto flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100 shadow-inner">
                      <div className="text-right hidden sm:block">
                        <div className="text-[8px] font-black text-purple-600 uppercase tracking-tighter">Detected</div>
                        <div className="text-[10px] font-black text-zinc-900 uppercase">Signal Active</div>
                      </div>
                      <img
                        src={avatar}
                        alt="Active Preview"
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-md"
                        onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&bold=true`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Shift Preferences */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Shift Priorities</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tactical Routing Bias</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {[ShiftType.NIGHT, ShiftType.MORNING, ShiftType.EVENING].map(type => {
                  const isSelected = prefs.preferredShifts.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleShiftType(type)}
                      className={`p-5 sm:p-6 rounded-3xl text-left border-3 transition-all relative group overflow-hidden ${isSelected
                        ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-100 scale-[1.02] z-10'
                        : 'bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className={`p-2.5 rounded-2xl transition-all ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100'}`}>
                          {getShiftIcon(type)}
                        </div>
                        {isSelected && (
                          <div className="bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-tighter">
                            Active
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <h4 className={`font-black text-xl mb-1 tracking-tight ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                          {type}
                        </h4>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-blue-100' : 'text-zinc-400'}`}>
                          <Clock size={10} />
                          {getShiftTime(type)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'availability' && (
          <div className="space-y-6">
            <BulkAvailability currentUser={currentUser} onRefresh={onRefresh} />
          </div>
        )}

        {activeSubTab === 'leaves' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LeaveRequestPanel currentUser={currentUser} leaveRequests={leaveRequests} onRefresh={onRefresh} />
          </div>
        )}

        {activeSubTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShiftHistory shifts={shifts} currentUser={currentUser} />
          </div>
        )}

        {activeSubTab === 'performance' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PerformanceDashboard currentUser={currentUser} shifts={shifts} swaps={swaps} users={users} />
          </div>
        )}


      </div>
    </div>
  );
};
