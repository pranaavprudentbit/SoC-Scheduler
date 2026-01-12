'use client';

import React, { useMemo } from 'react';
import { User, Shift, ShiftType } from '@/lib/types';
import { BarChart3, TrendingUp, Clock, Moon, Sunset, Sun, Users, AlertTriangle } from 'lucide-react';

interface AnalyticsDashboardProps {
  users: User[];
  shifts: Shift[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ users, shifts }) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    // Filter shifts
    const thisWeekShifts = shifts.filter(s => s.date >= weekStartStr && s.date < today);
    const thisMonthShifts = shifts.filter(s => s.date >= monthStartStr);
    const futureShifts = shifts.filter(s => s.date >= today);

    // Shift type distribution
    const shiftTypeCount = {
      [ShiftType.MORNING]: futureShifts.filter(s => s.type === ShiftType.MORNING).length,
      [ShiftType.EVENING]: futureShifts.filter(s => s.type === ShiftType.EVENING).length,
      [ShiftType.NIGHT]: futureShifts.filter(s => s.type === ShiftType.NIGHT).length,
    };

    // User workload (next 14 days)
    const twoWeeksOut = new Date(now);
    twoWeeksOut.setDate(now.getDate() + 14);
    const twoWeeksOutStr = twoWeeksOut.toISOString().split('T')[0];
    const upcomingShifts = shifts.filter(s => s.date >= today && s.date <= twoWeeksOutStr);
    
    const userWorkload = users.map(user => {
      const userShifts = upcomingShifts.filter(s => s.userId === user.id);
      const nightShifts = userShifts.filter(s => s.type === ShiftType.NIGHT).length;
      return {
        user,
        totalShifts: userShifts.length,
        nightShifts,
        morningShifts: userShifts.filter(s => s.type === ShiftType.MORNING).length,
        eveningShifts: userShifts.filter(s => s.type === ShiftType.EVENING).length,
      };
    }).sort((a, b) => b.totalShifts - a.totalShifts);

    // Coverage analysis - next 7 days
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const coverageData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayShifts = shifts.filter(s => s.date === dateStr);
      coverageData.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        morning: dayShifts.filter(s => s.type === ShiftType.MORNING).length,
        evening: dayShifts.filter(s => s.type === ShiftType.EVENING).length,
        night: dayShifts.filter(s => s.type === ShiftType.NIGHT).length,
        total: dayShifts.length,
      });
    }

    // Find gaps
    const gaps = coverageData.filter(d => d.total < 3);

    // Burnout risk - users with many consecutive shifts
    const burnoutRisk = userWorkload.filter(u => u.totalShifts > 6 || u.nightShifts > 3);

    return {
      totalUsers: users.length,
      thisWeekShifts: thisWeekShifts.length,
      thisMonthShifts: thisMonthShifts.length,
      futureShifts: futureShifts.length,
      shiftTypeCount,
      userWorkload,
      coverageData,
      gaps,
      burnoutRisk,
      protectedShifts: shifts.filter(s => s.manuallyCreated).length,
    };
  }, [users, shifts]);

  const getWorkloadColor = (shifts: number) => {
    if (shifts >= 7) return 'bg-red-500';
    if (shifts >= 5) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getCoverageColor = (total: number) => {
    if (total === 0) return 'bg-red-100 text-red-700 border-red-300';
    if (total < 3) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={28} />
            Analytics Dashboard
          </h3>
          <p className="text-zinc-500 text-sm mt-1">Real-time insights and workload analysis</p>
        </div>
      </div>

      {/* Warnings */}
      {(analytics.gaps.length > 0 || analytics.burnoutRisk.length > 0) && (
        <div className="space-y-3">
          {analytics.gaps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-red-900">Coverage Gaps Detected</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {analytics.gaps.length} day(s) with incomplete coverage: {analytics.gaps.map(g => g.day).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
          {analytics.burnoutRisk.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-amber-900">Burnout Risk Alert</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {analytics.burnoutRisk.length} team member(s) with high workload in next 2 weeks
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-600" size={20} />
            <span className="text-xs font-semibold text-zinc-500 uppercase">Active Team</span>
          </div>
          <div className="text-3xl font-black text-blue-600">{analytics.totalUsers}</div>
          <div className="text-xs text-zinc-500 mt-1">Total members</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-emerald-600" size={20} />
            <span className="text-xs font-semibold text-zinc-500 uppercase">This Month</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">{analytics.thisMonthShifts}</div>
          <div className="text-xs text-zinc-500 mt-1">Total shifts</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-purple-600" size={20} />
            <span className="text-xs font-semibold text-zinc-500 uppercase">Scheduled</span>
          </div>
          <div className="text-3xl font-black text-purple-600">{analytics.futureShifts}</div>
          <div className="text-xs text-zinc-500 mt-1">Future shifts</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">🔒</span>
            <span className="text-xs font-semibold text-zinc-500 uppercase">Protected</span>
          </div>
          <div className="text-3xl font-black text-indigo-600">{analytics.protectedShifts}</div>
          <div className="text-xs text-zinc-500 mt-1">Manual shifts</div>
        </div>
      </div>

      {/* Shift Type Distribution */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-zinc-600" />
          Upcoming Shift Distribution
        </h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-zinc-700">Morning Shifts</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{analytics.shiftTypeCount[ShiftType.MORNING]}</span>
            </div>
            <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                style={{ width: `${(analytics.shiftTypeCount[ShiftType.MORNING] / analytics.futureShifts) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sunset size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-zinc-700">Evening Shifts</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{analytics.shiftTypeCount[ShiftType.EVENING]}</span>
            </div>
            <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                style={{ width: `${(analytics.shiftTypeCount[ShiftType.EVENING] / analytics.futureShifts) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon size={16} className="text-slate-600" />
                <span className="text-sm font-semibold text-zinc-700">Night Shifts</span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{analytics.shiftTypeCount[ShiftType.NIGHT]}</span>
            </div>
            <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-slate-400 to-slate-700 rounded-full transition-all"
                style={{ width: `${(analytics.shiftTypeCount[ShiftType.NIGHT] / analytics.futureShifts) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workload Heatmap - Next 7 Days */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h4 className="font-bold text-zinc-900 mb-4">7-Day Coverage Heatmap</h4>
        <div className="grid grid-cols-7 gap-2">
          {analytics.coverageData.map((day, idx) => (
            <div key={idx} className="text-center">
              <div className={`rounded-lg border p-3 ${getCoverageColor(day.total)}`}>
                <div className="text-xs font-semibold mb-1">{day.day}</div>
                <div className="text-2xl font-black mb-2">{day.dayNum}</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Sun size={10} className="text-amber-600" />
                    <span className="text-xs font-bold">{day.morning}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Sunset size={10} className="text-blue-600" />
                    <span className="text-xs font-bold">{day.evening}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Moon size={10} className="text-slate-600" />
                    <span className="text-xs font-bold">{day.night}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
            <span className="text-zinc-600">Full Coverage (3/3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
            <span className="text-zinc-600">Partial (1-2/3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <span className="text-zinc-600">No Coverage (0/3)</span>
          </div>
        </div>
      </div>

      {/* User Workload Table */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h4 className="font-bold text-zinc-900 mb-4">Team Workload (Next 14 Days)</h4>
        <div className="space-y-3">
          {analytics.userWorkload.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors">
              <img src={item.user.avatar} alt={item.user.name} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="font-semibold text-zinc-900">{item.user.name}</div>
                <div className="text-xs text-zinc-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Sun size={10} className="text-amber-600" /> {item.morningShifts}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sunset size={10} className="text-blue-600" /> {item.eveningShifts}
                  </span>
                  <span className="flex items-center gap-1">
                    <Moon size={10} className="text-slate-600" /> {item.nightShifts}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getWorkloadColor(item.totalShifts)}`}></div>
                <div className="text-right">
                  <div className="text-lg font-black text-zinc-900">{item.totalShifts}</div>
                  <div className="text-xs text-zinc-500">shifts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-zinc-600">Balanced (≤4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-zinc-600">Busy (5-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-zinc-600">Overloaded (7+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
