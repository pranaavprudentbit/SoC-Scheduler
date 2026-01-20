'use client';

import React, { useState, useMemo } from 'react';
import { User, Shift, SwapRequest } from '@/lib/types';
import { Award, TrendingUp, Target, Users, Zap } from 'lucide-react';

interface PerformanceDashboardProps {
  currentUser: User;
  shifts: Shift[];
  swaps: SwapRequest[];
  users: User[];
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  currentUser,
  shifts,
  swaps,
  users
}) => {
  const [teamAvg, setTeamAvg] = useState({ reliability: 0, shiftsCompleted: 0 });
  const [badges, setBadges] = useState<string[]>([]);

  // Calculate personal metrics
  const personalMetrics = useMemo(() => {
    const userShifts = shifts.filter(s => s.userId === currentUser.id);
    const pastShifts = userShifts.filter(s => s.date < new Date().toISOString().split('T')[0]);
    const shiftsCompleted = pastShifts.length;
    const totalHours = shiftsCompleted * 8;

    const userSwaps = swaps.filter(s => s.requesterId === currentUser.id);
    const swapsOffered = userSwaps.length;
    const swapsAccepted = userSwaps.filter(s => s.status === 'ACCEPTED').length;

    // Reliability: based on shifts completed + swap acceptance rate
    const reliabilityScore = Math.min(
      100,
      (shiftsCompleted / 50) * 60 + (swapsAccepted / Math.max(swapsOffered, 1)) * 40
    );

    return {
      shiftsCompleted,
      totalHours,
      swapsOffered,
      swapsAccepted,
      reliabilityScore: Math.round(reliabilityScore),
      cancellations: 0 // Would come from leave records
    };
  }, [shifts, swaps, currentUser.id]);

  // Calculate team averages
  useMemo(() => {
    const allUserShifts = shifts.filter(s => s.date < new Date().toISOString().split('T')[0]);
    const userCount = new Set(allUserShifts.map(s => s.userId)).size;
    const avgShiftsCompleted = userCount > 0 ? allUserShifts.length / userCount : 0;

    const allUserSwaps = swaps;
    const usersWithSwaps = new Set(allUserSwaps.map(s => s.requesterId)).size;
    const avgReliability = usersWithSwaps > 0
      ? (allUserSwaps.filter(s => s.status === 'ACCEPTED').length / Math.max(allUserSwaps.length, 1)) * 100
      : 0;

    setTeamAvg({
      reliability: Math.round(avgReliability),
      shiftsCompleted: Math.round(avgShiftsCompleted)
    });
  }, [shifts, swaps]);

  // Award badges
  useMemo(() => {
    const earnedBadges: string[] = [];

    if (personalMetrics.reliabilityScore >= 90) earnedBadges.push('Reliable');
    if (personalMetrics.shiftsCompleted >= 50) earnedBadges.push('Dedicated');
    if (personalMetrics.swapsAccepted >= 10) earnedBadges.push('Team Player');
    if (personalMetrics.cancellations === 0 && personalMetrics.shiftsCompleted >= 10) earnedBadges.push('Perfect Attendance');

    setBadges(earnedBadges);
  }, [personalMetrics]);

  const getBadgeIcon = (badge: string) => {
    const icons: Record<string, string> = {
      'Reliable': '⭐',
      'Dedicated': '🔥',
      'Team Player': '🤝',
      'Perfect Attendance': '✨'
    };
    return icons[badge] || '🏆';
  };

  return (
    <div className="space-y-8">
      {/* Reliability Score - Big Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-3">Reliability Score</div>
            <div className="text-6xl font-black mb-2">{personalMetrics.reliabilityScore}</div>
            <div className="text-sm opacity-90">
              {personalMetrics.reliabilityScore >= 90
                ? 'Exceptional performer'
                : personalMetrics.reliabilityScore >= 75
                  ? 'Strong contributor'
                  : personalMetrics.reliabilityScore >= 50
                    ? 'Consistent performer'
                    : 'Build your reliability'}
            </div>
          </div>
          <Award className="text-blue-200" size={64} />
        </div>

        {/* Progress Bar */}
        <div className="mt-6 bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${personalMetrics.reliabilityScore}%` }}
          ></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">Shifts Completed</span>
            <Target className="text-blue-600" size={20} />
          </div>
          <div className="text-3xl font-black text-blue-600">{personalMetrics.shiftsCompleted}</div>
          <div className="text-xs text-zinc-500 mt-2">vs team avg: {teamAvg.shiftsCompleted}</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">Total Hours</span>
            <Zap className="text-emerald-600" size={20} />
          </div>
          <div className="text-3xl font-black text-emerald-600">{personalMetrics.totalHours}</div>
          <div className="text-xs text-zinc-500 mt-2">{(personalMetrics.totalHours / 40).toFixed(1)} weeks</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">Swaps Accepted</span>
            <TrendingUp className="text-amber-600" size={20} />
          </div>
          <div className="text-3xl font-black text-amber-600">
            {personalMetrics.swapsAccepted}/{personalMetrics.swapsOffered}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {personalMetrics.swapsOffered > 0
              ? Math.round((personalMetrics.swapsAccepted / personalMetrics.swapsOffered) * 100)
              : 0}% acceptance
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">Team Comparison</span>
            <Users className="text-purple-600" size={20} />
          </div>
          <div className="text-3xl font-black text-purple-600">
            {personalMetrics.reliabilityScore > teamAvg.reliability ? '📈' : personalMetrics.reliabilityScore < teamAvg.reliability ? '📉' : '➡️'}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {personalMetrics.reliabilityScore > teamAvg.reliability
              ? 'Above average'
              : personalMetrics.reliabilityScore < teamAvg.reliability
                ? 'Below average'
                : 'At average'}
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Award size={16} />
            Your Badges ({badges.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map(badge => (
              <div
                key={badge}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 text-center"
              >
                <div className="text-4xl mb-2">{getBadgeIcon(badge)}</div>
                <div className="text-sm font-bold text-zinc-900">{badge}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison with Team */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-zinc-900 mb-4">How You Compare</h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">Reliability Score</span>
              <span className="text-sm font-bold text-zinc-900">
                {personalMetrics.reliabilityScore} vs {teamAvg.reliability}
              </span>
            </div>
            <div className="bg-white rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${(personalMetrics.reliabilityScore / 100) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">Shifts Completed</span>
              <span className="text-sm font-bold text-zinc-900">
                {personalMetrics.shiftsCompleted} vs {teamAvg.shiftsCompleted}
              </span>
            </div>
            <div className="bg-white rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full"
                style={{
                  width: `${Math.min(
                    100,
                    (personalMetrics.shiftsCompleted / (teamAvg.shiftsCompleted + 10)) * 100
                  )}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-900 font-medium">
          💡 <span className="font-bold">Pro Tip:</span> Accept more shift swaps and maintain perfect attendance to boost your reliability score!
        </p>
      </div>
    </div>
  );
};
