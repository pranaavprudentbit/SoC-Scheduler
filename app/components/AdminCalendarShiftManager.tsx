'use client';

import React, { useState } from 'react';
import { User, Shift, ShiftType } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Sun, Sunset, Moon, Calendar, Users, CheckCircle2, XCircle } from 'lucide-react';
import { db, auth } from '@/lib/firebase/config';
import { useToast } from './ToastProvider';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

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
  const { showToast, confirm } = useToast();
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

  const getShiftsForDateAndType = (date: Date, type: ShiftType): Shift[] => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts
      .filter(s => s.date === dateStr && s.type === type)
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  };

  const getDefaultBreaks = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING:
        return { lunchStart: '12:00', lunchEnd: '12:45', breakStart: '15:00', breakEnd: '15:15' };
      case ShiftType.EVENING:
        return { lunchStart: '20:00', lunchEnd: '20:45', breakStart: '23:00', breakEnd: '23:15' };
      case ShiftType.NIGHT:
        return { lunchStart: '03:30', lunchEnd: '04:15', breakStart: '07:00', breakEnd: '07:15' };
    }
  };

  const handleAssignShift = async (date: Date, type: ShiftType) => {
    if (!selectedUser) {
      showToast("Please select a user from the Members Bank first.", 'warning');
      return;
    }

    const user = users.find(u => u.id === selectedUser);
    if (user?.isActive === false) {
      showToast("Cannot assign an inactive user.", 'error');
      return;
    }

    const dateStr = date.toISOString().split('T')[0];
    const existingShifts = getShiftsForDateAndType(date, type);
    
    // 1. Check User Preferences (unavailableDates)
    if (user?.preferences?.unavailableDates?.includes(dateStr)) {
      showToast(`Cannot assign shift: ${user.name} is unavailable on this date in their preferences.`, 'error');
      return;
    }

    // 2. Check for Availability Blocks
    const availabilityQuery = query(
      collection(db, 'user_availability'),
      where('userId', '==', selectedUser),
      where('date', '==', dateStr)
    );
    const availabilitySnapshot = await getDocs(availabilityQuery);
    if (!availabilitySnapshot.empty) {
      const blockData = availabilitySnapshot.docs[0].data();
      if (blockData.available === false) {
        showToast(`Cannot assign shift: User is unavailable on this date. Reason: ${blockData.reason || 'Blocked'}`, 'error');
        return;
      }
    }

    // 3. Check for Approved Leave Requests
    const leaveQuery = query(
      collection(db, 'leave_requests'),
      where('userId', '==', selectedUser),
      where('date', '==', dateStr),
      where('status', '==', 'APPROVED')
    );
    const leaveSnapshot = await getDocs(leaveQuery);
    if (!leaveSnapshot.empty) {
      const leaveData = leaveSnapshot.docs[0].data();
      showToast(`Cannot assign shift: ${user?.name} has an approved leave request. Reason: ${leaveData.reason}`, 'error');
      return;
    }

    // Limit to 3 people per shift
    if (existingShifts.length >= 3) {
      showToast("Maximum of 3 people per shift reached.", 'warning');
      return;
    }

    const breaks = getDefaultBreaks(type);

    try {
      await addDoc(collection(db, 'shifts'), {
        date: dateStr,
        type: type,
        userId: selectedUser,
        ...breaks,
        createdAt: new Date().toISOString(),
      });

      // Log creation
      const currentUser = auth.currentUser;
      if (currentUser) {
        await import('@/lib/logger').then(m => m.logActivity(
          currentUser.uid,
          currentUser.email || 'Admin',
          'Shift Assigned',
          `Assigned ${type} shift on ${dateStr} to ${user?.name}`,
          'SHIFT_UPDATE'
        ));
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

      showToast("Shift deleted successfully", 'success');
      onRefresh();
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const getShiftIcon = (type: ShiftType, size: number = 14) => {
    switch (type) {
      case ShiftType.MORNING: return <Sun className="text-amber-500" size={size} />;
      case ShiftType.EVENING: return <Sunset className="text-blue-500" size={size} />;
      case ShiftType.NIGHT: return <Moon className="text-slate-400" size={size} />;
    }
  };



  const handleDragStart = (e: React.DragEvent, userId: string) => {
    e.dataTransfer.setData('userId', userId);
  };

  const handleDrop = async (e: React.DragEvent, date: Date, type: ShiftType) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData('userId');
    if (!userId) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const dateStr = date.toISOString().split('T')[0];
    const existingShifts = getShiftsForDateAndType(date, type);

    // Check if user already has this shift
    if (existingShifts.some(s => s.userId === userId)) {
      showToast("This user is already assigned to this shift.", 'warning');
      return;
    }

    // Check capacity
    if (existingShifts.length >= 3) {
      const firstUser = users.find(u => u.id === existingShifts[0].userId);
      const userName = firstUser ? firstUser.name : 'one user';
      const confirmReplace = await confirm({
        title: 'Replace User',
        message: `Shift is already at capacity (3 people). Replace ${userName} with ${user.name}?`,
        confirmLabel: 'Replace',
        type: 'warning'
      });
      if (!confirmReplace) return;
      // If replacing, delete the first one.
      await deleteDoc(doc(db, 'shifts', existingShifts[0].id));
      showToast(`Replaced ${userName} with ${user.name}`, 'info');
    }

    // Check for availability blocks
    // 1. Check User Preferences (unavailableDates)
    if (user.preferences?.unavailableDates?.includes(dateStr)) {
      showToast(`Cannot assign shift: ${user.name} is unavailable on this date in their preferences.`, 'error');
      return;
    }

    // 2. Check for Availability Blocks
    const availabilityQuery = query(
      collection(db, 'user_availability'),
      where('userId', '==', userId),
      where('date', '==', dateStr)
    );
    const availabilitySnapshot = await getDocs(availabilityQuery);
    if (!availabilitySnapshot.empty) {
      const blockData = availabilitySnapshot.docs[0].data();
      if (blockData.available === false) {
        showToast(`Cannot assign shift: User is unavailable on this date. Reason: ${blockData.reason || 'Blocked'}`, 'error');
        return;
      }
    }

    // 3. Check for Approved Leave Requests
    const leaveQuery = query(
      collection(db, 'leave_requests'),
      where('userId', '==', userId),
      where('date', '==', dateStr),
      where('status', '==', 'APPROVED')
    );
    const leaveSnapshot = await getDocs(leaveQuery);
    if (!leaveSnapshot.empty) {
      const leaveData = leaveSnapshot.docs[0].data();
      showToast(`Cannot assign shift: ${user.name} has an approved leave request. Reason: ${leaveData.reason}`, 'error');
      return;
    }

    const breaks = getDefaultBreaks(type);

    try {
      await addDoc(collection(db, 'shifts'), {
        date: dateStr,
        type: type,
        userId: userId,
        ...breaks,
        createdAt: new Date().toISOString(),
      });

      // Log creation
      const currentUser = auth.currentUser;
      if (currentUser) {
        await import('@/lib/logger').then(m => m.logActivity(
          currentUser.uid,
          currentUser.email || 'Admin',
          'Shift Assigned (Drag)',
          `Assigned ${type} shift on ${dateStr} to ${getUserById(userId)?.name}`,
          'SHIFT_UPDATE'
        ));
      }
      onRefresh();
      showToast(`Shift assigned successfully to ${getUserById(userId)?.name}`, 'success');
    } catch (error) {
      console.error('Error saving shift via drop:', error);
    }
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
                      <span className="text-xs font-black">{user.name}</span>
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
                        <span className="text-xs font-black text-zinc-400">{user.name}</span>
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
                const cellShifts = getShiftsForDateAndType(date, shiftType);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                      handleDrop(e, date, shiftType);
                    }}
                    className={`p-2 border-l border-zinc-200 min-h-[80px] sm:min-h-[100px] ${isToday ? 'bg-blue-50/30' : ''} transition-colors hover:bg-zinc-50/50 border-2 border-dashed border-zinc-100`}
                  >
                    <div className="flex flex-col gap-2 h-full">
                      
                      <div className="flex flex-col gap-1.5 h-full">
                        {cellShifts.map((shift, idx) => {
                          const user = getUserById(shift.userId);
                          if (!user) return null;
                          return (
                            <div 
                              key={shift.id} 
                              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all hover:shadow-md group relative min-w-0 ${
                                shiftType === ShiftType.NIGHT 
                                ? 'bg-zinc-900 border-zinc-800 text-white shadow-sm' 
                                : 'bg-white border-zinc-100 text-zinc-900 shadow-xs'
                              }`}
                            >
                              {/* User Info Section */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/20 shadow-sm"
                                  />
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${user.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[11px] font-bold ${
                                    shiftType === ShiftType.NIGHT ? 'text-white' : 'text-zinc-900'
                                  }`}>
                                    {user ? user.name : 'Unknown'}
                                  </div>
                                  <div className={`text-[9px] font-black uppercase tracking-tighter leading-none ${
                                    shiftType === ShiftType.NIGHT ? 'text-blue-400' : 'text-blue-600'
                                  }`}>
                                    {idx === 0 ? 'Pri' : idx === 1 ? 'Sec' : 'Sup'}
                                  </div>
                                </div>
                              </div>

                              {/* Hover Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() => handleAssignShift(date, shiftType)}
                                  className={`p-1 rounded-md transition-colors ${
                                    shiftType === ShiftType.NIGHT ? 'hover:bg-white/10 text-white/70' : 'hover:bg-zinc-100 text-zinc-500'
                                  }`}
                                  title="Replace"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button
                                  onClick={() => handleDeleteShift(shift)}
                                  className={`p-1 rounded-md transition-colors ${
                                    shiftType === ShiftType.NIGHT ? 'hover:bg-red-900/40 text-red-300' : 'hover:bg-red-50 text-red-500'
                                  }`}
                                  title="Delete"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {cellShifts.length < 3 && (
                          <button
                            onClick={() => handleAssignShift(date, shiftType)}
                            className={`rounded-xl border border-dashed transition-all flex items-center justify-center gap-2 group ${
                              cellShifts.length === 0 
                              ? 'h-full w-full py-6 border-zinc-200 bg-zinc-50/50 hover:bg-blue-50/50 hover:border-blue-300' 
                              : 'py-2 border-zinc-200 bg-zinc-50/30 hover:bg-blue-50 hover:border-blue-200'
                            }`}
                          >
                            <Plus size={cellShifts.length === 0 ? 16 : 12} className="text-zinc-400 group-hover:text-blue-500 group-hover:rotate-90 transition-all duration-300" />
                            <span className="text-[9px] font-bold text-zinc-400 group-hover:text-blue-500 uppercase tracking-tighter">
                              {cellShifts.length === 0 ? "Assign Shift" : "Add Support"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
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
