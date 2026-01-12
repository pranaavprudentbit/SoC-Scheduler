'use client';

import React, { useState, useMemo } from 'react';
import { Shift, ShiftType, User } from '@/lib/types';
import { Calendar, TrendingUp, Clock, Filter } from 'lucide-react';

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

  const getShiftColor = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING:
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case ShiftType.EVENING:
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case ShiftType.NIGHT:
        return 'bg-slate-100 border-slate-300 text-slate-900';
    }
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return '☀️';
      case ShiftType.EVENING: return '🌆';
      case ShiftType.NIGHT: return '🌙';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Shift History</h3>
        <p className="text-zinc-500 text-sm">Track your past shifts and performance trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Total Shifts</div>
          <div className="text-3xl font-black text-blue-600">{stats.totalShifts}</div>
          <div className="text-xs text-zinc-400 mt-2">{stats.avgShiftsPerWeek} per week</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Total Hours</div>
          <div className="text-3xl font-black text-emerald-600">{stats.totalHours}</div>
          <div className="text-xs text-zinc-400 mt-2">{(stats.totalHours / 8).toFixed(0)} shifts</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Shift Distribution</div>
          <div className="flex items-baseline gap-1 text-sm">
            <span className="text-amber-600 font-bold">{stats.morningCount}</span>
            <span className="text-zinc-400 text-xs">/</span>
            <span className="text-blue-600 font-bold">{stats.eveningCount}</span>
            <span className="text-zinc-400 text-xs">/</span>
            <span className="text-slate-600 font-bold">{stats.nightCount}</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2">M/E/N</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Trend</div>
          <div className="flex items-center gap-2">
            {stats.trend === 'up' && <TrendingUp className="text-emerald-600" size={24} />}
            {stats.trend === 'down' && <TrendingUp className="text-red-600 rotate-180" size={24} />}
            {stats.trend === 'stable' && <div className="text-2xl">→</div>}
            <span className="text-sm font-semibold text-zinc-700 capitalize">{stats.trend}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-zinc-500" />
        
        <div className="flex gap-2">
          {['30', '90', '365', 'ALL'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {range === 'ALL' ? 'All Time' : `${range}d`}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-zinc-200"></div>

        <div className="flex gap-2">
          {['ALL', ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Shift List */}
      <div className="space-y-3">
        {userShifts.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
            <p className="text-zinc-500 font-medium">No shifts found</p>
            <p className="text-zinc-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          userShifts.map(shift => (
            <div
              key={shift.id}
              className={`border-l-4 p-4 rounded-lg transition-all hover:shadow-md ${getShiftColor(shift.type)}`}
              style={{
                borderLeftColor: shift.type === ShiftType.MORNING ? '#b45309' : shift.type === ShiftType.EVENING ? '#2563eb' : '#475569'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getShiftIcon(shift.type)}</div>
                  <div>
                    <div className="font-semibold text-sm">{shift.type} Shift</div>
                    <div className="text-xs opacity-75 flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {new Date(shift.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold opacity-75">
                    <Clock size={12} />
                    8h work
                  </div>
                  <div className="text-xs opacity-50 mt-1">
                    {shift.lunchStart}-{shift.lunchEnd} lunch
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {userShifts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Summary:</span> You've worked <span className="font-bold">{stats.totalShifts}</span> shifts ({stats.totalHours} hours) in the past {dateRange === 'ALL' ? 'all time' : `${dateRange} days`}.
          </p>
        </div>
      )}
    </div>
  );
};
