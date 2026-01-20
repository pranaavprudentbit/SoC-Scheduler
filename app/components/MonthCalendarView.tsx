'use client';

import React, { useState } from 'react';
import { Shift, User, ShiftType } from '@/lib/types';
import { Sun, Sunset, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthCalendarViewProps {
  shifts: Shift[];
  users: User[];
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({ shifts, users }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
      case ShiftType.MORNING:
        return <Sun className="text-amber-600" size={size} />;
      case ShiftType.EVENING:
        return <Sunset className="text-blue-600" size={size} />;
      case ShiftType.NIGHT:
        return <Moon className="text-slate-200" size={size} />;
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">Full Schedule</h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">3 workers per day • 5 shifts per week • 40 hours per week</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-sm sm:text-lg font-semibold text-zinc-900 min-w-[140px] sm:min-w-[180px] text-center">
              {monthName}
            </div>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {/* Legend - hidden on very small screens */}
        <div className="hidden sm:flex gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
            <Sun className="text-amber-600" size={12} />
            <span className="text-zinc-700 font-medium">Morning</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 px-2.5 py-1.5 rounded-lg">
            <Sunset className="text-blue-600" size={12} />
            <span className="text-zinc-700 font-medium">Evening</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg">
            <Moon className="text-blue-200" size={12} />
            <span className="text-white font-medium">Night</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden overflow-x-auto">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200 min-w-[800px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold text-zinc-600 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 min-w-[800px]">
          {dates.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="min-h-[120px] bg-zinc-50/50 border-b border-r border-zinc-100" />;
            }

            const dateObj = new Date(date);
            const dayNum = dateObj.getDate();
            const dayShifts = shifts.filter(s => s.date === date);
            const isToday = date === today;

            return (
              <div
                key={date}
                className={`min-h-[120px] border-b border-r border-zinc-100 p-2 hover:bg-zinc-50/50 transition-colors ${isToday ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : ''
                  }`}
              >
                {/* Day Number */}
                <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-zinc-600'
                  }`}>
                  {dayNum}
                </div>

                {/* Shifts */}
                <div className="space-y-1">
                  {dayShifts.map(shift => {
                    const user = users.find(u => u.id === shift.userId);
                    if (!user) return null;

                    return (
                      <div
                        key={shift.id}
                        className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 ${getShiftColor(shift.type)}`}
                        title={`${user.name} - ${shift.type}`}
                      >
                        {getShiftIcon(shift.type, 10)}
                        <span className="truncate font-medium flex-1">
                          {user.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
