'use client';

import React, { useState, useEffect } from 'react';
import { Save, Clock, Calendar, X, Plus, Moon, Sun, Sunset, User as UserIcon, BarChart2, MessageSquare, History, FileText } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Shift, SwapRequest, LeaveRequest, ShiftType } from '@/lib/types';
import { ShiftHistory } from './ShiftHistory';
import { PerformanceDashboard } from './PerformanceDashboard';
import { ShiftNotes } from './ShiftNotes';
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
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'history' | 'performance' | 'notes' | 'availability' | 'leaves'>('profile');
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
    { id: 'notes', label: 'Notes', icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 mb-1">Account & Settings</h2>
          <p className="text-zinc-500">Manage your profile, preferences, and view your records</p>
        </div>
        {activeSubTab === 'profile' && (
          <button
            onClick={handleSave}
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Internal Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeSubTab === tab.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 animate-in fade-in duration-300">
        {activeSubTab === 'profile' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Profile Details */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <UserIcon className="text-purple-600" size={22} />
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Profile Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 px-4 py-2.5 sm:py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Avatar URL</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="flex-1 bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 px-4 py-2.5 sm:py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all min-w-0"
                      placeholder="https://..."
                    />
                    <img src={avatar} alt="Preview" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-200 flex-shrink-0" onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferred Shifts */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-blue-600" size={22} />
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Preferred Shifts</h3>
              </div>
              <p className="text-zinc-500 mb-4 sm:mb-6 text-sm">Select the shifts you prefer to work. The AI scheduler will prioritize these when generating your schedule.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleShiftType(type)}
                    className={`p-6 rounded-xl text-left border-2 transition-all ${prefs.preferredShifts.includes(type)
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${prefs.preferredShifts.includes(type) ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'}`}>
                        {getShiftIcon(type)}
                      </div>
                      {prefs.preferredShifts.includes(type) && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h4 className={`font-bold text-lg mb-1 ${prefs.preferredShifts.includes(type) ? 'text-blue-900' : 'text-zinc-900'}`}>
                      {type}
                    </h4>
                    <p className={`text-sm ${prefs.preferredShifts.includes(type) ? 'text-blue-600' : 'text-zinc-500'}`}>
                      {getShiftTime(type)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'availability' && (
          <div className="space-y-6">
            <BulkAvailability currentUser={currentUser} onRefresh={onRefresh} />

            {/* Blackout Dates Integration */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-red-600" size={22} />
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Blackout Dates</h3>
              </div>
              <p className="text-zinc-500 mb-4 sm:mb-6 text-sm">Add dates when you are unavailable. You will not be scheduled on these days.</p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-300 text-zinc-900 px-4 py-2.5 sm:py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                  min={new Date().toISOString().split('T')[0]}
                />
                <button
                  onClick={addBlackoutDate}
                  disabled={!newDate}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  <Plus size={18} /> Add Date
                </button>
              </div>
              {blockedDates.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Your Blackout Dates ({blockedDates.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {blockedDates
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl group hover:bg-red-100 transition-colors">
                          <span className="font-medium">{new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <button onClick={() => removeBlackoutDate(item.id, item.date)} className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-200 rounded-lg">
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-zinc-50 border border-zinc-200 border-dashed rounded-xl text-center">
                  <p className="text-zinc-400 text-sm">No blackout dates set. Add dates above when you're unavailable.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'leaves' && (
          <LeaveRequestPanel currentUser={currentUser} leaveRequests={leaveRequests} onRefresh={onRefresh} />
        )}

        {activeSubTab === 'history' && (
          <ShiftHistory shifts={shifts} currentUser={currentUser} />
        )}

        {activeSubTab === 'performance' && (
          <PerformanceDashboard currentUser={currentUser} shifts={shifts} swaps={swaps} users={users} />
        )}

        {activeSubTab === 'notes' && (
          <ShiftNotes shifts={shifts} currentUser={currentUser} users={users} />
        )}
      </div>
    </div>
  );
};
