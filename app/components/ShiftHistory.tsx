'use client';

import React, { useState, useMemo } from 'react';
import { Shift, ShiftType, User } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface ShiftHistoryProps {
  shifts: Shift[];
  currentUser: User;
}

export const ShiftHistory: React.FC<ShiftHistoryProps> = ({ shifts, currentUser }) => {
  const [filterType, setFilterType] = useState<ShiftType | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<'30' | '90' | '365' | 'ALL'>('90');

  // Calculate date cutoff
  const getCutoffDate = () => {
    const today = new Date();
    switch (dateRange) {
      case '30': return new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
      case '90': return new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
      case '365': return new Date(today.setDate(today.getDate() - 365)).toISOString().split('T')[0];
      default: return '1900-01-01';
    }
  };

  // Filter user's past shifts
  const userShifts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const cutoff = getCutoffDate();

    return shifts
      .filter(s => s.userId === currentUser.id && s.date < today && s.date >= cutoff)
      .filter(s => filterType === 'ALL' ? true : s.type === filterType)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, filterType, dateRange, currentUser.id]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalShifts = userShifts.length;
    const totalHours = totalShifts * 8; // 8 hours per shift
    const morningCount = userShifts.filter(s => s.type === ShiftType.MORNING).length;
    const eveningCount = userShifts.filter(s => s.type === ShiftType.EVENING).length;
    const nightCount = userShifts.filter(s => s.type === ShiftType.NIGHT).length;

    // Trend: compare first half vs second half
    const midpoint = Math.floor(userShifts.length / 2);
    const firstHalf = userShifts.slice(0, midpoint).length;
    const secondHalf = userShifts.slice(midpoint).length;
    const trend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable';

    return {
      totalShifts,
      totalHours,
      morningCount,
      eveningCount,
      nightCount,
      trend,
      avgShiftsPerWeek: userShifts.length > 0 ? (userShifts.length / (parseInt(dateRange) / 7)).toFixed(1) : '0'
    };
  }, [userShifts, dateRange]);


  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return '☀️';
      case ShiftType.EVENING: return '🌆';
      case ShiftType.NIGHT: return '🌙';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Tactical Stats Header - Optimized 2x2 for Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Deployments', value: stats.totalShifts, sub: `${stats.avgShiftsPerWeek}/W Avg`, color: 'text-blue-600' },
          { label: 'Total Hours', value: stats.totalHours, sub: 'Active Duty', color: 'text-emerald-600' },
          { label: 'Distribution', value: `${stats.morningCount}/${stats.eveningCount}/${stats.nightCount}`, sub: 'M/E/N Split', color: 'text-zinc-900' },
          { label: 'Trend', value: stats.trend.toUpperCase(), sub: 'Performance', color: stats.trend === 'up' ? 'text-emerald-600' : stats.trend === 'down' ? 'text-red-600' : 'text-zinc-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="text-[8px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-1">{stat.label}</div>
            <div className={`text-xl sm:text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
            <div className="text-[8px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter opacity-70">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Strategic Filter Ribbon - Simplified */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <div className="flex bg-zinc-100/50 p-1 rounded-2xl border border-zinc-200/50 w-max items-center gap-1">
          <div className="flex gap-1">
            {['30', '90', 'ALL'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range as any)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateRange === range
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
                  : 'text-zinc-500'
                  }`}
              >
                {range === 'ALL' ? 'Full' : `${range}D`}
              </button>
            ))}
          </div>
          <div className="w-[1px] h-4 bg-zinc-200 mx-1" />
          <div className="flex gap-1">
            {['ALL', ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
                  : 'text-zinc-500'
                  }`}
              >
                {type === 'ALL' ? 'Units' : type.charAt(0)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deployment Records - Enhanced for Mobile Legibility */}
      <div className="space-y-3">
        {userShifts.length === 0 ? (
          <div className="py-20 text-center bg-zinc-100/30 border-2 border-dashed border-zinc-200 rounded-[2.5rem]">
            <Calendar className="mx-auto text-zinc-300 mb-4" size={32} />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Operational Records</p>
          </div>
        ) : (
          userShifts.map(shift => (
            <div
              key={shift.id}
              className="bg-white border border-zinc-200 p-4 rounded-3xl transition-all active:scale-[0.98] group relative overflow-hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${shift.type === ShiftType.MORNING ? 'bg-amber-50 text-amber-600' :
                  shift.type === ShiftType.EVENING ? 'bg-blue-50 text-blue-600' :
                    'bg-zinc-100 text-zinc-900'
                  }`}>
                  {getShiftIcon(shift.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-zinc-900 uppercase tracking-tight">{shift.type}</span>
                    {shift.manuallyCreated && <span className="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Admin</span>}
                  </div>
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                    {new Date(shift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-900 uppercase tracking-tighter">8.0 HRS</div>
                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Duty Cycle</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
