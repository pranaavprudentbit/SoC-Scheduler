'use client';

import { Sun, Sunset, Moon, Calendar, CalendarDays, ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Shift, User, ShiftType } from '@/lib/types';

interface CalendarViewProps {
  shifts: Shift[];
  users: User[];
  currentDate: Date;
  onDateChange?: (date: Date) => void;
  userId?: string; // Target user ID for highlighting or filtering
  showAll?: boolean; // If true, shows everyone but highlights the userId
  showTodayOnly?: boolean; // Optional: show only today's shifts
  hideViewToggle?: boolean; // Optional: hide the week/month toggle
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  users,
  currentDate,
  onDateChange,
  userId,
  showAll = false,
  showTodayOnly = false,
  hideViewToggle = false
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isMobile, setIsMobile] = useState(false);
  const [now, setNow] = useState(new Date());

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Sync now on mount immediately to ensure hydration match isn't an issue, 
    // but here we just want live updates.
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter logic: Show all if showAll is true, otherwise filter by userId if provided
  const filteredShifts = showAll ? shifts : (userId ? shifts.filter(s => s.userId === userId) : shifts);

  // Calculate dates based on view mode
  const getDates = () => {
    if (showTodayOnly) return [getLocalDateString(new Date())];

    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const dates = [];

      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        dates.push(getLocalDateString(d));
      }
      return dates;
    }

    if (isMobile) {
      // Mobile view: Show current day and the next day relative to currentDate
      return [0, 1].map(offset => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + offset);
        return getLocalDateString(d);
      });
    }

    // Week view: Anchor to the most recent Monday for a standard week spread
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return getLocalDateString(d);
    });
  };

  const dates = getDates();

  const navigate = (direction: number) => {
    if (!onDateChange) return;
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (isMobile) {
      newDate.setDate(newDate.getDate() + direction);
    } else {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    onDateChange(newDate);
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
      case ShiftType.MORNING: return '09:00 AM - 05:00 PM';
      case ShiftType.EVENING: return '05:00 PM - 01:00 AM';
      case ShiftType.NIGHT: return '01:00 AM - 09:00 AM';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {showTodayOnly ? "Live Shifts" : (userId ? 'Personal Timeline' : 'Fleet Operations')}
            </h2>
            <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-wider">
              {showTodayOnly ? "Currently active duty" : "Weekly strategic deployment"}
            </p>
          </div>

          {!showTodayOnly && (
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-2xl border border-zinc-200 w-fit">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all active:scale-90"
              >
                <ChevronLeft size={16} className="text-zinc-600" />
              </button>
              <span className="text-[10px] font-black text-zinc-900 px-3 uppercase tracking-widest">
                {isMobile ? (
                  new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                ) : viewMode === 'month' ? (
                  new Date(currentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                ) : (
                  <>
                    {new Date(dates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(dates[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </>
                )}
              </span>
              <button
                onClick={() => navigate(1)}
                className="p-2 rounded-xl bg-white shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all active:scale-90"
              >
                <ChevronRight size={16} className="text-zinc-600" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          {!showTodayOnly && !hideViewToggle && (
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
              >
                {isMobile ? <CalendarRange size={14} /> : <CalendarDays size={14} />}
                {isMobile ? 'Daily' : 'Week'}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
              >
                <Calendar size={14} />
                Month
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[ShiftType.NIGHT, ShiftType.MORNING, ShiftType.EVENING].map(type => (
              <div key={type} className="flex items-center gap-3 px-4 py-2 bg-white border border-zinc-100 rounded-[1.2rem] shadow-sm">
                <div className="flex items-center gap-2">
                  {getShiftIcon(type)}
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{type}</span>
                </div>
                <div className="h-3 w-px bg-zinc-200 hidden sm:block" />
                <span className="text-[9px] font-bold text-zinc-500 whitespace-nowrap">
                  {getShiftTime(type)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'lg:grid-cols-7'} gap-3 lg:gap-4 pb-4 lg:pb-0`}>
          {dates.map((date) => {
            const [y, m, d] = date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d; // Use parsed day directly
            const dayShifts = filteredShifts.filter(s => s.date === date);
            const isToday = getLocalDateString(new Date()) === date;
            const isCurrentSelection = getLocalDateString(currentDate) === date;

            return (
              <div
                key={date}
                className={`w-full lg:w-auto bg-white rounded-[2rem] border-2 transition-all p-4 flex flex-col ${isToday ? 'border-blue-500 shadow-xl scale-[1.05] z-10' : 'border-zinc-100 hover:border-zinc-200 opacity-60'
                  } ${isCurrentSelection ? 'border-zinc-300 shadow-md ring-2 ring-zinc-100' : ''}`}
              >
                {/* Header */}
                <div className="text-center mb-4 pb-2 border-b border-zinc-50">
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isToday ? 'text-blue-600' : 'text-zinc-400'}`}>
                    {dayName}
                  </div>
                  <div className={`text-4xl font-black ${isToday ? 'text-blue-600' : 'text-zinc-900'}`}>
                    {dayNum}
                  </div>
                </div>

                {/* Shift Stack */}
                <div className="space-y-1.5 flex-1">
                  {[ShiftType.NIGHT, ShiftType.MORNING, ShiftType.EVENING].map(type => {
                    const shift = dayShifts.find(s => s.type === type);
                    const isCurrentUser = shift?.userId === userId;

                    // Check if this specific shift is currently active (LIVE)
                    const isShiftActive = () => {
                      const shiftStart = new Date(date);
                      const shiftEnd = new Date(date);
                      const currentTime = now.getTime();

                      // Set exact timings based on our 8-hour logic
                      if (type === ShiftType.NIGHT) {
                        shiftStart.setHours(1, 0, 0, 0);
                        shiftEnd.setHours(9, 0, 0, 0);
                      } else if (type === ShiftType.MORNING) {
                        shiftStart.setHours(9, 0, 0, 0);
                        shiftEnd.setHours(17, 0, 0, 0);
                      } else if (type === ShiftType.EVENING) {
                        shiftStart.setHours(17, 0, 0, 0);
                        shiftEnd.setDate(shiftEnd.getDate() + 1); // Ends next day
                        shiftEnd.setHours(1, 0, 0, 0);
                      }

                      return currentTime >= shiftStart.getTime() && currentTime < shiftEnd.getTime();
                    };

                    const isLive = isShiftActive();

                    return (
                      <div
                        key={type}
                        className={`flex flex-col p-2 rounded-2xl transition-all relative overflow-hidden ${shift
                          ? isLive
                            ? 'bg-white border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] z-20 scale-[1.02]'
                            : isCurrentUser
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500 ring-offset-1'
                              : 'bg-zinc-50 border border-zinc-100 text-zinc-600'
                          : 'bg-transparent border border-dashed border-zinc-100 opacity-20'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <div className={`${isCurrentUser && !isLive ? 'text-white' : isLive ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {getShiftIcon(type)}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isLive && shift && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                            )}
                            <span className={`text-[7px] font-black uppercase tracking-tighter ${isLive ? 'text-emerald-600' : 'opacity-70'}`}>
                              {isLive ? 'LIVE' : ''}
                            </span>
                          </div>
                        </div>
                        <div className={`text-[9px] font-black truncate uppercase tracking-tighter ${isLive ? 'text-zinc-900' : ''}`}>
                          {shift ? (isCurrentUser ? "ME" : users.find(u => u.id === shift.userId)?.name.split(' ')[0]) : "OFF"}
                        </div>
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
