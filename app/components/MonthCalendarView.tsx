'use client';

import React, { useState } from 'react';
import { Shift, User, ShiftType } from '@/lib/types';
import { Sun, Sunset, Moon, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface MonthCalendarViewProps {
  shifts: Shift[];
  users: User[];
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({ shifts, users }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Create array of all dates in the month
  const dates: (string | null)[] = [];

  // Add empty slots for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    dates.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    dates.push(date.toISOString().split('T')[0]);
  }

  const getShiftIcon = (type: ShiftType, size = 12) => {
    switch (type) {
      case ShiftType.NIGHT:
        return <Moon className="text-slate-200" size={size} />;
      case ShiftType.MORNING:
        return <Sun className="text-amber-600" size={size} />;
      case ShiftType.EVENING:
        return <Sunset className="text-blue-600" size={size} />;
    }
  };

  const getShiftColor = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return 'bg-amber-100 border-amber-300 text-amber-900';
      case ShiftType.EVENING: return 'bg-blue-100 border-blue-300 text-blue-900';
      case ShiftType.NIGHT: return 'bg-slate-800 border-slate-700 text-white';
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedDayShifts = selectedDate ? shifts.filter(s => s.date === selectedDate) : [];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Full Schedule</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-widest">Operational view of team deployment</p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-100 p-1 rounded-2xl border border-zinc-200 w-fit">
          <button
            onClick={previousMonth}
            className="p-2.5 rounded-xl bg-white shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-all active:scale-95"
          >
            <ChevronLeft size={20} className="text-zinc-600" />
          </button>
          <div className="text-sm font-black text-zinc-900 min-w-[140px] text-center px-4 uppercase tracking-widest">
            {monthName}
          </div>
          <button
            onClick={nextMonth}
            className="p-2.5 rounded-xl bg-white shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-all active:scale-95"
          >
            <ChevronRight size={20} className="text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-zinc-200 shadow-2xl overflow-hidden flex flex-col mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-zinc-50/50 border-b border-zinc-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
            <div key={day} className={`py-4 text-center border-r last:border-r-0 border-zinc-100 ${idx === 0 || idx === 6 ? 'bg-zinc-100/30' : ''}`}>
              <span className="hidden md:inline text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}
              </span>
              <span className="md:hidden text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {dates.map((date, index) => {
            const isWeekend = index % 7 === 0 || index % 7 === 6;

            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className={`min-h-[80px] sm:min-h-[140px] border-b border-r border-zinc-100/50 ${isWeekend ? 'bg-zinc-50/50' : 'bg-transparent'}`}
                />
              );
            }

            const dateObj = new Date(date);
            const dayNum = dateObj.getDate();
            const dayShifts = shifts.filter(s => s.date === date);
            const isToday = date === today;
            const isSelected = date === selectedDate;

            return (
              <div
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[80px] sm:min-h-[140px] border-b border-r border-zinc-100 p-2 sm:p-4 transition-all group relative flex flex-col cursor-pointer ${isSelected ? 'bg-blue-600/10 ring-2 ring-inset ring-blue-500 z-10' :
                  isToday ? 'bg-blue-50/30' : isWeekend ? 'bg-zinc-50/20' : 'bg-white'
                  } hover:bg-zinc-50/80`}
              >
                {/* Status Indicator */}
                {isToday && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.4)]" />
                )}

                {/* Day Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className={`text-xs sm:text-sm font-black flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-xl transition-all ${isToday
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : isSelected ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'text-zinc-400 group-hover:text-zinc-900'
                    }`}>
                    {dayNum}
                  </div>

                  {/* Mobile Mobile Shifts Count */}
                  {dayShifts.length > 0 && (
                    <div className="sm:hidden flex -space-x-1">
                      {dayShifts.slice(0, 3).map((s, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full border border-white ${s.type === ShiftType.MORNING ? 'bg-amber-500' : s.type === ShiftType.EVENING ? 'bg-blue-500' : 'bg-zinc-900'
                          }`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Day Content - Desktop/Tablet */}
                <div className="hidden sm:flex flex-col gap-1.5">
                  {dayShifts
                    .sort((a, b) => {
                      const order = { [ShiftType.NIGHT]: 1, [ShiftType.MORNING]: 2, [ShiftType.EVENING]: 3 };
                      return (order[a.type] || 0) - (order[b.type] || 0);
                    })
                    .map(shift => {
                      const user = users.find(u => u.id === shift.userId);
                      if (!user) return null;

                      return (
                        <div
                          key={shift.id}
                          className={`text-[9px] px-2 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${shift.type === ShiftType.MORNING
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : shift.type === ShiftType.EVENING
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-zinc-900 border-zinc-800 text-white'
                            }`}
                        >
                          <div className="opacity-70">{getShiftIcon(shift.type, 10)}</div>
                          <span className="truncate font-black tracking-tight">{user.name.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                </div>

                {/* Day Content - Mobile Small Badges */}
                <div className="sm:hidden mt-auto flex flex-wrap gap-1">
                  {dayShifts
                    .sort((a, b) => {
                      const order = { [ShiftType.NIGHT]: 1, [ShiftType.MORNING]: 2, [ShiftType.EVENING]: 3 };
                      return (order[a.type] || 0) - (order[b.type] || 0);
                    })
                    .map(shift => (
                      <div
                        key={shift.id}
                        className={`p-1 rounded-md border shadow-xs ${shift.type === ShiftType.MORNING
                          ? 'bg-amber-100 border-amber-200'
                          : shift.type === ShiftType.EVENING
                            ? 'bg-blue-100 border-blue-200'
                            : 'bg-zinc-800 border-zinc-700'
                          }`}
                      >
                        {getShiftIcon(shift.type, 8)}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Briefing - Mobile ONLY */}
      <div className="sm:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedDate && (
          <div className="bg-white rounded-[2rem] border border-zinc-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
                </h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Daily Briefing</p>
              </div>
              <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {selectedDayShifts.length} Shifts
              </div>
            </div>

            <div className="space-y-3">
              {selectedDayShifts.length > 0 ? (
                selectedDayShifts
                  .sort((a, b) => {
                    const order = { [ShiftType.NIGHT]: 1, [ShiftType.MORNING]: 2, [ShiftType.EVENING]: 3 };
                    return (order[a.type] || 0) - (order[b.type] || 0);
                  })
                  .map(shift => {
                    const user = users.find(u => u.id === shift.userId);
                    if (!user) return null;

                    return (
                      <div
                        key={shift.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${shift.type === ShiftType.MORNING
                          ? 'bg-amber-50/50 border-amber-200'
                          : shift.type === ShiftType.EVENING
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-zinc-50 border-zinc-200'
                          }`}
                      >
                        <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-zinc-900">{user.name}</div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{user.role}</div>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${getShiftColor(shift.type)} shadow-sm`}>
                          {getShiftIcon(shift.type, 18)}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-50 text-zinc-300 mb-3">
                    <Activity size={24} />
                  </div>
                  <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No deployments today</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
