'use client';

import React, { useState } from 'react';
import { User, Shift, ShiftType } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Sun, Sunset, Moon, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

interface AdminCalendarShiftManagerProps {
  users: User[];
  shifts: Shift[];
  onRefresh: () => void;
}

export const AdminCalendarShiftManager: React.FC<AdminCalendarShiftManagerProps> = ({
  users,
  shifts,
  onRefresh
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
    return new Date(today.setDate(diff));
  });

  const [editingShift, setEditingShift] = useState<{ date: string; type: ShiftType; shift?: Shift } | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || '');

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getShiftForDateAndType = (date: Date, type: ShiftType): Shift | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.find(s => s.date === dateStr && s.type === type);
  };

  const getDefaultBreaks = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING:
        return { lunchStart: '12:30', lunchEnd: '13:15', breakStart: '15:00', breakEnd: '15:15' };
      case ShiftType.EVENING:
        return { lunchStart: '20:30', lunchEnd: '21:15', breakStart: '23:00', breakEnd: '23:15' };
      case ShiftType.NIGHT:
        return { lunchStart: '04:30', lunchEnd: '05:15', breakStart: '07:00', breakEnd: '07:15' };
    }
  };

  const handleAssignShift = async (date: Date, type: ShiftType) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingShift = getShiftForDateAndType(date, type);

    if (existingShift) {
      setEditingShift({ date: dateStr, type, shift: existingShift });
      setSelectedUser(existingShift.userId);
    } else {
      setEditingShift({ date: dateStr, type });
      setSelectedUser(users[0]?.id || '');
    }
  };

  const handleSaveShift = async () => {
    if (!editingShift) return;

    try {
      // Check for availability blocks
      const availabilityQuery = query(
        collection(db, 'user_availability'),
        where('userId', '==', selectedUser),
        where('date', '==', editingShift.date)
      );

      const availabilitySnapshot = await getDocs(availabilityQuery);

      if (!availabilitySnapshot.empty) {
        // Get reason if available
        const blockData = availabilitySnapshot.docs[0].data();
        alert(`❌ Cannot assign shift: User is unavailable on this date.\nReason: ${blockData.reason || 'Blocked'}`);
        return;
      }

      const breaks = getDefaultBreaks(editingShift.type);

      if (editingShift.shift) {
        // Update existing shift
        const shiftRef = doc(db, 'shifts', editingShift.shift.id);
        await updateDoc(shiftRef, {
          userId: selectedUser,
          ...breaks,
          manuallyCreated: true, // Mark as manually edited
        });
      } else {
        // Create new shift
        await addDoc(collection(db, 'shifts'), {
          date: editingShift.date,
          shift: editingShift.type,
          userId: selectedUser,
          ...breaks,
          manuallyCreated: true, // Mark as manually created
          createdAt: new Date().toISOString(),
        });
      }

      setEditingShift(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  const handleDeleteShift = async (shift: Shift) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      await deleteDoc(doc(db, 'shifts', shift.id));
      onRefresh();
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return <Sun className="text-amber-500" size={14} />;
      case ShiftType.EVENING: return <Sunset className="text-blue-500" size={14} />;
      case ShiftType.NIGHT: return <Moon className="text-slate-400" size={14} />;
    }
  };

  const getShiftColor = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200';
      case ShiftType.EVENING: return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200';
      case ShiftType.NIGHT: return 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-white';
    }
  };

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Smart Shift Protection</h4>
            <p className="text-xs text-blue-700">
              Shifts you create or edit manually are marked as 🔒 Protected. The AI scheduler will respect these shifts and won't override them.
              Only you can modify or delete protected shifts.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} />
            Weekly Shift Calendar
          </h3>
          <p className="text-zinc-500 text-sm mt-1">Click on any slot to assign or edit shifts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Previous week"
          >
            <ChevronLeft size={20} className="text-zinc-600" />
          </button>

          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-semibold text-blue-900">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Next week"
          >
            <ChevronRight size={20} className="text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid - Swipeable on mobile */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-x-auto scrollbar-hide">
        <div className="min-w-[800px]">
          {/* Header Row - Days */}
          <div className="grid grid-cols-8 border-b border-zinc-200 bg-zinc-50">
            <div className="p-3 sm:p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Shift Type
            </div>
            {weekDates.map((date, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={idx}
                  className={`p-2 sm:p-4 text-center border-l border-zinc-200 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-xs font-semibold ${isToday ? 'text-blue-600' : 'text-zinc-500'} uppercase`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm sm:text-lg font-bold mt-1 ${isToday ? 'text-blue-600' : 'text-zinc-900'}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shift Rows */}
          {[ShiftType.NIGHT, ShiftType.MORNING, ShiftType.EVENING].map((shiftType) => (
            <div key={shiftType} className="grid grid-cols-8 border-b border-zinc-200 last:border-b-0">
              {/* Shift Type Label */}
              <div className="p-3 sm:p-4 flex items-center gap-2 border-r border-zinc-200 bg-zinc-50">
                {getShiftIcon(shiftType)}
                <span className="text-sm font-semibold text-zinc-900 hidden sm:inline">{shiftType}</span>
                <span className="text-xs font-semibold text-zinc-900 sm:hidden">{shiftType.slice(0, 3)}</span>
              </div>

              {/* Shift Cells */}
              {weekDates.map((date, idx) => {
                const shift = getShiftForDateAndType(date, shiftType);
                const user = shift ? getUserById(shift.userId) : null;
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`p-2 border-l border-zinc-200 min-h-[80px] sm:min-h-[100px] ${isToday ? 'bg-blue-50/30' : ''}`}
                  >
                    {shift && user ? (
                      <div className={`h-full rounded-lg border p-2 ${getShiftColor(shiftType)} group relative transition-all hover:shadow-md`}>
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex items-start gap-1.5">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs sm:text-sm font-semibold truncate ${shiftType === ShiftType.NIGHT ? 'text-white' : 'text-zinc-900'}`}>
                                {user.name.split(' ')[0]}
                              </div>
                              {shift.manuallyCreated && (
                                <div className={`text-[10px] font-medium ${shiftType === ShiftType.NIGHT ? 'text-blue-300' : 'text-blue-600'}`}>
                                  🔒 Protected
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleAssignShift(date, shiftType)}
                              className={`p-1 rounded ${shiftType === ShiftType.NIGHT ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-zinc-50'} shadow-sm transition-colors`}
                              title="Edit"
                            >
                              <Edit2 size={12} className={shiftType === ShiftType.NIGHT ? 'text-white' : 'text-blue-600'} />
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift)}
                              className={`p-1 rounded ${shiftType === ShiftType.NIGHT ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-zinc-50'} shadow-sm transition-colors`}
                              title="Delete"
                            >
                              <Trash2 size={12} className={shiftType === ShiftType.NIGHT ? 'text-white' : 'text-red-600'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssignShift(date, shiftType)}
                        className="w-full h-full rounded-lg border-2 border-dashed border-zinc-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center group"
                      >
                        <Plus size={16} className="text-zinc-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingShift && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h4 className="text-xl font-bold text-zinc-900 mb-4">
              {editingShift.shift ? 'Edit' : 'Assign'} {editingShift.type} Shift
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Date: {new Date(editingShift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Assign to:</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingShift(null)}
                  className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShift}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingShift.shift ? 'Update' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
