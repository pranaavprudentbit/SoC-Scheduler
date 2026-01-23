'use client';

import React, { useMemo } from 'react';
import { Shift, ShiftType, CoverageStatus } from '@/lib/types';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeamCoverageHeatmapProps {
  shifts: Shift[];
}

export const TeamCoverageHeatmap: React.FC<TeamCoverageHeatmapProps> = ({ shifts }) => {
  // Calculate coverage for next 14 days
  const coverageData = useMemo(() => {
    const today = new Date();
    const data: CoverageStatus[] = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayShifts = shifts.filter(s => s.date === dateStr);
      const morningCount = dayShifts.filter(s => s.type === ShiftType.MORNING).length;
      const eveningCount = dayShifts.filter(s => s.type === ShiftType.EVENING).length;
      const nightCount = dayShifts.filter(s => s.type === ShiftType.NIGHT).length;

      // Each shift type should have exactly 1 person
      [
        { type: ShiftType.MORNING, count: morningCount },
        { type: ShiftType.EVENING, count: eveningCount },
        { type: ShiftType.NIGHT, count: nightCount }
      ].forEach(({ type, count }) => {
        const status = count === 0 ? 'UNDERSTAFFED' : count === 1 ? 'OK' : 'OVERSTAFFED';
        data.push({
          date: dateStr,
          shiftType: type,
          assignedCount: count,
          requiredCount: 1,
          status: status as any
        });
      });
    }

    return data;
  }, [shifts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNDERSTAFFED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'OK':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'OVERSTAFFED':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UNDERSTAFFED':
        return <AlertTriangle size={16} />;
      case 'OK':
        return <CheckCircle2 size={16} />;
      case 'OVERSTAFFED':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const getShiftLabel = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return '☀️ Morning';
      case ShiftType.EVENING: return '🌆 Evening';
      case ShiftType.NIGHT: return '🌙 Night';
    }
  };

  const understaffedCount = coverageData.filter(c => c.status === 'UNDERSTAFFED').length;
  const okCount = coverageData.filter(c => c.status === 'OK').length;
  const overstaffedCount = coverageData.filter(c => c.status === 'OVERSTAFFED').length;

  const groupedByDate = useMemo(() => {
    const grouped: Record<string, CoverageStatus[]> = {};
    coverageData.forEach(item => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });
    return grouped;
  }, [coverageData]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Team Coverage Heatmap</h3>
        <p className="text-zinc-500 text-sm">See team coverage for the next 2 weeks</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600" size={18} />
            <span className="text-xs font-semibold text-red-900 uppercase">Understaffed</span>
          </div>
          <div className="text-2xl font-black text-red-600">{understaffedCount}</div>
          <div className="text-xs text-red-700 mt-1">shifts need coverage</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="text-emerald-600" size={18} />
            <span className="text-xs font-semibold text-emerald-900 uppercase">Adequate</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{okCount}</div>
          <div className="text-xs text-emerald-700 mt-1">shifts covered</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-amber-600" size={18} />
            <span className="text-xs font-semibold text-amber-900 uppercase">Overstaffed</span>
          </div>
          <div className="text-2xl font-black text-amber-600">{overstaffedCount}</div>
          <div className="text-xs text-amber-700 mt-1">shifts with extras</div>
        </div>
      </div>

      {/* Heatmap Calendar */}
      <div className="space-y-4">
        {Object.entries(groupedByDate).map(([date, dayData]) => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <div
              key={date}
              className={`rounded-xl p-4 border-2 ${isToday ? 'border-blue-400 bg-blue-50' : 'border-zinc-200 bg-white'
                }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`font-semibold text-sm ${isToday ? 'text-blue-900' : 'text-zinc-900'}`}>
                  {dayName}, {dateDisplay}
                </div>
                {isToday && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Today</span>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {dayData.map(coverage => (
                  <div
                    key={`${coverage.date}-${coverage.shiftType}`}
                    className={`p-3 rounded-lg border flex flex-col items-center text-center ${getStatusColor(coverage.status)}`}
                  >
                    <div className="mb-1">{getStatusIcon(coverage.status)}</div>
                    <div className="text-xs font-semibold mb-2">{getShiftLabel(coverage.shiftType)}</div>
                    <div className="text-lg font-black">{coverage.assignedCount}/{coverage.requiredCount}</div>
                    <div className="text-xs mt-1 capitalize">{coverage.status.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
        <h4 className="text-sm font-semibold text-zinc-900 mb-3">Legend</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-red-600 text-2xl mb-1">🔴</div>
            <div className="text-xs text-zinc-700">
              <span className="font-semibold">Understaffed</span>
              <p className="text-zinc-500">0 assigned</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-emerald-600 text-2xl mb-1">🟢</div>
            <div className="text-xs text-zinc-700">
              <span className="font-semibold">Adequate</span>
              <p className="text-zinc-500">1 assigned</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-amber-600 text-2xl mb-1">🟡</div>
            <div className="text-xs text-zinc-700">
              <span className="font-semibold">Overstaffed</span>
              <p className="text-zinc-500">2+ assigned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      {understaffedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-900">
            <span className="font-bold">⚠️ Alert:</span> {understaffedCount} shift{understaffedCount > 1 ? 's' : ''} need coverage! Consider offering to swap or volunteering.
          </p>
        </div>
      )}
    </div>
  );
};
