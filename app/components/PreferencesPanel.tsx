'use client';

import React, { useState, useEffect } from 'react';
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
  const [newDate, setNewDate] = useState('');
  const [blockedDates, setBlockedDates] = useState<any[]>([]);

  // Load blocked dates from centralized collection
  React.useEffect(() => {
    loadBlockedDates();
  }, [currentUser.id]);

  const loadBlockedDates = async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'user_availability'), where('userId', '==', currentUser.id));
      const snapshot = await getDocs(q);
      setBlockedDates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  const toggleShiftType = (type: ShiftType) => {
    const current = prefs.preferredShifts;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setPrefs({ ...prefs, preferredShifts: updated });
  };

  const addBlackoutDate = async () => {
    if (newDate) {
      try {
        const { collection, addDoc } = await import('firebase/firestore');
        const { logActivity } = await import('@/lib/logger');

        await addDoc(collection(db, 'user_availability'), {
          userId: currentUser.id,
          date: newDate,
          available: false,
          reason: 'Personal (Preferences)',
          createdAt: new Date().toISOString()
        });

        await logActivity(
          currentUser.id,
          currentUser.name,
          'Unavailable',
          `Blocked ${newDate} via Preferences`,
          'AVAILABILITY_CHANGE'
        );

        setNewDate('');
        loadBlockedDates();
        onRefresh();
      } catch (error) {
        console.error('Error adding blackout date:', error);
      }
    }
  };

  const removeBlackoutDate = async (id: string, date: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { logActivity } = await import('@/lib/logger');

      await deleteDoc(doc(db, 'user_availability', id));

      await logActivity(
        currentUser.id,
        currentUser.name,
        'Available',
        `Unblocked ${date} via Preferences`,
        'AVAILABILITY_CHANGE'
      );

      loadBlockedDates();
      onRefresh();
    } catch (error) {
      console.error('Error removing blackout date:', error);
    }
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
      case ShiftType.MORNING: return '9:00 AM - 6:00 PM';
      case ShiftType.EVENING: return '5:00 PM - 2:00 AM';
      case ShiftType.NIGHT: return '1:00 AM - 10:00 AM';
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
      {/* Header - Refined for mobile transparency and focus */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start lg:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-200">
        <div className="px-1 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-none">
            Settings
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wider">
            Operational preferences & Profile
          </p>
        </div>
        {activeSubTab === 'profile' && (
          <button
            onClick={handleSave}
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
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
                {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => {
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

            {/* Tactical Blackout Node */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Blackout Dates</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hard Availability Blocks</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-5 py-3.5 sm:py-4 rounded-2xl font-black outline-none focus:border-red-500 focus:ring-8 focus:ring-red-500/5 focus:bg-white transition-all uppercase tracking-widest text-xs"
                  min={new Date().toISOString().split('T')[0]}
                />
                <button
                  onClick={addBlackoutDate}
                  disabled={!newDate}
                  className="bg-zinc-900 hover:bg-black disabled:bg-zinc-100 disabled:text-zinc-300 text-white px-8 py-3.5 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} /> Logic Block
                </button>
              </div>

              {blockedDates.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-[1px] flex-1 bg-zinc-100"></div>
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Active Blocks ({blockedDates.length})</h4>
                    <div className="h-[1px] flex-1 bg-zinc-100"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {blockedDates
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-zinc-50 border-2 border-zinc-100 text-zinc-700 px-4 py-4 rounded-2xl group hover:bg-white hover:border-red-100 transition-all hover:shadow-md">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-0.5">Tactical Date</span>
                            <span className="font-black text-sm tracking-tight">{new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <button
                            onClick={() => removeBlackoutDate(item.id, item.date)}
                            className="text-zinc-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl"
                          >
                            <X size={18} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 px-6 bg-zinc-50/50 border-2 border-dashed border-zinc-100 rounded-[2rem] text-center">
                  <Activity className="mx-auto text-zinc-200 mb-4" size={40} />
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">Deployment Clear</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-1">No active availability blocks detected</p>
                </div>
              )}
            </div>
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
