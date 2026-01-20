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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Tactical Reliability Readout - Mobile Optimized */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-white relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
          <Award size={180} />
        </div>

        <div className="relative">
          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Reliability Rating</h4>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-6xl sm:text-8xl font-black tracking-tighter tabular-nums leading-none">
              {personalMetrics.reliabilityScore}
            </span>
            <span className="text-xl font-black text-blue-400 uppercase tracking-widest">%</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                {personalMetrics.reliabilityScore >= 90 ? 'Elite Tier' :
                  personalMetrics.reliabilityScore >= 75 ? 'Superior' :
                    'Active'}
              </span>
            </div>
            <div className="sm:hidden text-left flex items-center gap-2">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Team Avg</span>
              <span className="text-sm font-black text-white/80">{teamAvg.reliability}%</span>
            </div>
          </div>
        </div>

        <div className="mt-8 relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000 ease-out"
            style={{ width: `${personalMetrics.reliabilityScore}%` }}
          />
        </div>
      </div>

      {/* Grid: Key Strat-Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Sorties', value: personalMetrics.shiftsCompleted, sub: `Avg: ${teamAvg.shiftsCompleted}`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Hours', value: personalMetrics.totalHours, sub: 'Cycle Total', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Swap Alpha', value: `${personalMetrics.swapsAccepted}/${personalMetrics.swapsOffered}`, sub: 'Success Rate', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Status', value: personalMetrics.reliabilityScore > teamAvg.reliability ? 'POSITIVE' : 'NOMINAL', sub: 'Delta Analysis', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm group hover:shadow-md transition-all">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-4`}>
              <item.icon size={18} strokeWidth={3} />
            </div>
            <div className="text-[8px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{item.label}</div>
            <div className={`text-lg sm:text-2xl font-black ${item.color} tracking-tight`}>{item.value}</div>
            <div className="text-[8px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter opacity-70">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Strategic Badges Achievement */}
      {badges.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 sm:p-8 overflow-hidden">
          <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
            <span className="w-4 sm:w-8 h-[1px] bg-zinc-200"></span>
            Operational Merits
            <span className="w-4 sm:w-8 h-[1px] bg-zinc-200"></span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map(badge => (
              <div
                key={badge}
                className="bg-zinc-50 border border-zinc-100 rounded-[2rem] p-4 text-center transition-all hover:bg-white hover:border-amber-200 group"
              >
                <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{getBadgeIcon(badge)}</div>
                <div className="text-[9px] font-black text-zinc-900 uppercase tracking-widest leading-none">{badge}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployment Delta Matrix - Simplified for Mobile */}
      <div className="bg-zinc-50/50 border border-zinc-200 rounded-[2.5rem] p-6 sm:p-8">
        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Strategic Delta</h4>
        <div className="space-y-6">
          {[
            { label: 'Reliability', color: 'bg-blue-600', val: personalMetrics.reliabilityScore, sub: `SEL: ${personalMetrics.reliabilityScore}% // AVG: ${teamAvg.reliability}%` },
            { label: 'Volume', color: 'bg-emerald-600', val: Math.min(100, (personalMetrics.shiftsCompleted / Math.max(teamAvg.shiftsCompleted + 5, 1)) * 100), sub: `SEL: ${personalMetrics.shiftsCompleted} // AVG: ${teamAvg.shiftsCompleted}` }
          ].map((bar, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                <span className="text-zinc-900">{bar.label}</span>
                <span className="text-zinc-400">{bar.sub}</span>
              </div>
              <div className="bg-zinc-200/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`${bar.color} h-full transition-all duration-1000 ease-out`}
                  style={{ width: `${bar.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Feed */}
      <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
          <Zap size={80} strokeWidth={3} />
        </div>
        <div className="flex items-start gap-4 relative">
          <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm shadow-inner group-hover:rotate-12 transition-transform">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">Operational Intel</h5>
            <p className="text-xs font-bold leading-relaxed tracking-tight group-hover:translate-x-1 transition-transform">
              Enhance team reliability by prioritizing swap fulfillment and 100% attendance during cycles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
