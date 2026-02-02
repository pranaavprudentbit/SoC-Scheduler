'use client';

import React, { useState } from 'react';
import { User, Shift, ShiftType } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Sun, Sunset, Moon, Calendar, Users, CheckCircle2, XCircle } from 'lucide-react';
import { db, auth } from '@/lib/firebase/config';
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


  const [selectedUser, setSelectedUser] = useState<string>(users.find(u => u.isActive !== false)?.id || '');
  const [showInactive, setShowInactive] = useState(false);

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
    if (!selectedUser) {
      alert("Please select a user from the Members Bank first.");
      return;
    }

    const user = users.find(u => u.id === selectedUser);
    if (user?.isActive === false) {
      alert("Cannot assign an inactive user.");
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const existingShift = getShiftForDateAndType(date, type);

    const breaks = getDefaultBreaks(type);

    try {
      if (existingShift) {
        const shiftRef = doc(db, 'shifts', existingShift.id);
        await updateDoc(shiftRef, {
          userId: selectedUser,
          ...breaks,
          manuallyCreated: true,
        });

        // Log update
        const currentUser = auth.currentUser;
        if (currentUser) {
          await import('@/lib/logger').then(m => m.logActivity(
            currentUser.uid,
            currentUser.email || 'Admin',
            'Shift Updated',
            `Assigned ${type} shift on ${dateStr} to ${user?.name}`,
            'SHIFT_UPDATE'
          ));
        }

      } else {
        await addDoc(collection(db, 'shifts'), {
          date: dateStr,
          shift: type,
          userId: selectedUser,
          ...breaks,
          manuallyCreated: true,
          createdAt: new Date().toISOString(),
        });

        // Log creation
        const currentUser = auth.currentUser;
        if (currentUser) {
          await import('@/lib/logger').then(m => m.logActivity(
            currentUser.uid,
            currentUser.email || 'Admin',
            'Shift Assigned',
            `Created ${type} shift on ${dateStr} for ${user?.name}`,
            'SHIFT_UPDATE'
          ));
        }
      }
      onRefresh();
    } catch (error) {
      console.error('Error saving shift via click:', error);
    }
  };



  const handleDeleteShift = async (shift: Shift) => {

    try {
      await deleteDoc(doc(db, 'shifts', shift.id));

      // Log deletion
      const currentUser = auth.currentUser;
      if (currentUser) {
        await import('@/lib/logger').then(m => m.logActivity(
          currentUser.uid,
          currentUser.email || 'Admin',
          'Shift Deleted',
          `Removed ${shift.type} shift on ${shift.date}`,
          'SHIFT_UPDATE'
        ));
      }

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

  const handleDragStart = (e: React.DragEvent, userId: string) => {
    e.dataTransfer.setData('userId', userId);
  };

  const handleDrop = async (e: React.DragEvent, date: Date, type: ShiftType) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData('userId');
    if (!userId) return;

    const dateStr = date.toISOString().split('T')[0];
    const existingShift = getShiftForDateAndType(date, type);

    // Check for availability blocks
    const availabilityQuery = query(
      collection(db, 'user_availability'),
      where('userId', '==', userId),
      where('date', '==', dateStr)
    );

    const availabilitySnapshot = await getDocs(availabilityQuery);

    if (!availabilitySnapshot.empty) {
      const blockData = availabilitySnapshot.docs[0].data();
      alert(`❌ Cannot assign shift: User is unavailable on this date.\nReason: ${blockData.reason || 'Blocked'}`);
      return;
    }

    const breaks = getDefaultBreaks(type);

    try {
      if (existingShift) {
        const shiftRef = doc(db, 'shifts', existingShift.id);
        await updateDoc(shiftRef, {
          userId: userId,
          ...breaks,
          manuallyCreated: true,
        });

        // Log update
        const currentUser = auth.currentUser;
        if (currentUser) {
          await import('@/lib/logger').then(m => m.logActivity(
            currentUser.uid,
            currentUser.email || 'Admin',
            'Shift Updated (Drag)',
            `Reassigned ${type} shift on ${dateStr} to ${getUserById(userId)?.name}`,
            'SHIFT_UPDATE'
          ));
        }

      } else {
        await addDoc(collection(db, 'shifts'), {
          date: dateStr,
          shift: type,
          userId: userId,
          ...breaks,
          manuallyCreated: true,
          createdAt: new Date().toISOString(),
        });

        // Log creation
        const currentUser = auth.currentUser;
        if (currentUser) {
          await import('@/lib/logger').then(m => m.logActivity(
            currentUser.uid,
            currentUser.email || 'Admin',
            'Shift Assigned (Drag)',
            `Created ${type} shift on ${dateStr} for ${getUserById(userId)?.name}`,
            'SHIFT_UPDATE'
          ));
        }
      }
      onRefresh();
    } catch (error) {
      console.error('Error saving shift via drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="space-y-6">
      {/* Members Bank */}
      <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Users size={20} />
              </div>
              <h4 className="text-xl font-black text-zinc-900 tracking-tight">Team Members</h4>
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {users.filter(u => u.isActive !== false).length} Active Users
            </p>
          </div>

          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showInactive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
          >
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
        </div>

        <div className="space-y-8">
          {/* Active Members - Primary Bank */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {users
              .filter(u => u.isActive !== false)
              .map(user => {
                const isSelected = selectedUser === user.id;
                return (
                  <div
                    key={user.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, user.id)}
                    onClick={() => setSelectedUser(user.id)}
                    className={`group flex items-center gap-3 p-3 border transition-all duration-300 cursor-pointer relative
                      ${isSelected
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xl scale-[1.05] z-10'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5'
                      } rounded-[1.25rem]`}
                  >
                    <div className="relative">
                      <img src={user.avatar} alt="" className={`w-10 h-10 rounded-full border-2 ${isSelected ? 'border-zinc-700' : 'border-white'} shadow-sm`} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black truncate">{user.name}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {user.role}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white p-1 rounded-full shadow-lg">
                        <CheckCircle2 size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Inactive Members - Collapsible Section */}
          {showInactive && (
            <div className="pt-8 border-t border-dashed border-zinc-200 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Inactive Users</h5>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {users
                  .filter(u => u.isActive === false)
                  .map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-zinc-50/50 border border-zinc-100 rounded-[1.25rem] opacity-60 grayscale cursor-not-allowed"
                    >
                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-zinc-400 truncate">{user.name}</span>
                        <div className="flex items-center gap-1">
                          <XCircle size={8} className="text-zinc-400" />
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Inactive</span>
                        </div>
                      </div>
                    </div>
                  ))}
                {users.filter(u => u.isActive === false).length === 0 && (
                  <div className="col-span-full py-4 text-center">
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">All team members are currently active</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-2 bg-blue-50/50 rounded-full border border-blue-100">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest m-0">
              Select a member, then click a calendar slot to assign.
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
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date, shiftType)}
                    className={`p-2 border-l border-zinc-200 min-h-[80px] sm:min-h-[100px] ${isToday ? 'bg-blue-50/30' : ''} transition-colors hover:bg-zinc-50/50`}
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

      {/* Edit Modal - Removed as per user request for faster click-to-assign */}

    </div>
  );
};
