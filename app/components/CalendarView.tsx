'use client';

import React, { useState } from 'react';
import { Shift, User, ShiftType } from '@/lib/types';
import { Sun, Sunset, Moon, Calendar, CalendarDays } from 'lucide-react';

interface CalendarViewProps {
  shifts: Shift[];
  users: User[];
  currentDate: Date;
  userId?: string; // Optional: filter shifts by user ID
  showTodayOnly?: boolean; // Optional: show only today's shifts
}

export const CalendarView: React.FC<CalendarViewProps> = ({ shifts, users, currentDate, userId, showTodayOnly = false }) => {  
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // Filter shifts by userId if provided
  const filteredShifts = userId ? shifts.filter(s => s.userId === userId) : shifts;
  
  // Calculate dates based on view mode
  const getDates = () => {
    if (showTodayOnly) return [new Date().toISOString().split('T')[0]];
    
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const dates = [];
      
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
      return dates;
    }
    
    // Week view
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };
  
  const dates = getDates();

  // Enhanced styling with gradients and better colors
  const getShiftStyle = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: 
        return 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md';
      case ShiftType.EVENING: 
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md';
      case ShiftType.NIGHT: 
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 shadow-sm hover:shadow-md';
    }
  };

  const getShiftTextStyle = (type: ShiftType) => {
    if (type === ShiftType.NIGHT) return 'text-blue-100';
    return 'text-zinc-600';
  };

  const getNameStyle = (type: ShiftType) => {
      if (type === ShiftType.NIGHT) return 'text-white';
      return 'text-zinc-900';
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: 
        return <Sun className="text-amber-600" size={14} />;
      case ShiftType.EVENING: 
        return <Sunset className="text-blue-600" size={14} />;
      case ShiftType.NIGHT: 
        return <Moon className="text-blue-200" size={14} />;
    }
  };

  const getShiftTime = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return '9AM - 6PM (8h)';
      case ShiftType.EVENING: return '5PM - 2AM (8h)';
      case ShiftType.NIGHT: return '1AM - 10AM (8h)';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">{showTodayOnly ? "Today's Shifts" : (userId ? 'Your Weekly Schedule' : 'Team Schedule')}</h2>
           <p className="text-zinc-500 text-xs sm:text-sm mt-1">{showTodayOnly ? "What you're working on today" : (userId ? 'Your shifts and rest days for this week' : "3 workers per day - everyone else on leave")}</p>
         </div>
         <div className="flex items-center gap-4">
           {/* View Toggle */}
           {!showTodayOnly && (
             <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg p-1">
               <button
                 onClick={() => setViewMode('week')}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                   viewMode === 'week'
                     ? 'bg-blue-600 text-white'
                     : 'text-zinc-600 hover:bg-zinc-100'
                 }`}
               >
                 <CalendarDays size={14} />
                 Week
               </button>
               <button
                 onClick={() => setViewMode('month')}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                   viewMode === 'month'
                     ? 'bg-blue-600 text-white'
                     : 'text-zinc-600 hover:bg-zinc-100'
                 }`}
               >
                 <Calendar size={14} />
                 Month
               </button>
             </div>
           )}
           
           {/* Legend */}
           <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
              <div className="flex items-center gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 px-2.5 sm:px-3 py-1.5 rounded-lg">
                  <Sun className="text-amber-600" size={14} />
                  <span className="text-zinc-700 font-medium">Morning</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 px-2.5 sm:px-3 py-1.5 rounded-lg">
                  <Sunset className="text-blue-600" size={14} />
                  <span className="text-zinc-700 font-medium">Evening</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg">
                  <Moon className="text-blue-200" size={14} />
                  <span className="text-white font-medium">Night</span>
              </div>
           </div>
         </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${
        viewMode === 'month' 
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-7'
      }`}>
        {dates.map((date) => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
          const dayShifts = filteredShifts.filter(s => s.date === date);
          const isToday = new Date().toISOString().split('T')[0] === date;

          return (
            <div 
              key={date} 
              className={`flex flex-col rounded-2xl overflow-hidden transition-all ${
                isToday 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'bg-white border border-zinc-200'
              }`}
            >
              {/* Day Header */}
              <div className={`px-4 py-3 text-center ${
                isToday 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
                  : 'bg-zinc-50 border-b border-zinc-200'
              }`}>
                <div className={`text-xs uppercase tracking-wider font-bold mb-1 ${
                  isToday ? 'text-blue-100' : 'text-zinc-500'
                }`}>
                  {dayName}
                </div>
                <div className={`text-2xl font-bold ${
                  isToday ? 'text-white' : 'text-zinc-900'
                }`}>
                  {dayNum}
                </div>
                <div className={`text-xs font-medium ${
                  isToday ? 'text-blue-100' : 'text-zinc-400'
                }`}>
                  {monthName}
                </div>
              </div>

              {/* Shifts Container */}
              <div className="flex flex-col gap-2 p-3 min-h-[320px]">
                {dayShifts.map(shift => {
                  const user = users.find(u => u.id === shift.userId);
                  if (!user) return null;

                  return (
                    <div 
                      key={shift.id} 
                      className={`p-3 rounded-xl transition-all cursor-pointer ${getShiftStyle(shift.type)}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <img 
                          src={user.avatar} 
                          className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm" 
                          alt="" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className={`text-sm font-semibold truncate ${getNameStyle(shift.type)}`}>
                              {user.name}
                            </div>
                            {shift.manuallyCreated && (
                              <span className={`text-[10px] ${shift.type === ShiftType.NIGHT ? 'text-blue-200' : 'text-blue-600'}`} title="Admin scheduled">
                                🔒
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {getShiftIcon(shift.type)}
                            <span className={`text-xs font-medium ${getShiftTextStyle(shift.type)}`}>
                              {getShiftTime(shift.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {dayShifts.length === 0 && (
                    <div className="h-full flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="text-zinc-300 text-3xl mb-2">—</div>
                          <span className="text-zinc-400 text-xs">No shifts</span>
                        </div>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
