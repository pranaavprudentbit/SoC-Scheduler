'use client';

import React, { useMemo, useState } from 'react';
import { Shift, User, ShiftType, ShiftRecommendation } from '@/lib/types';
import { Zap, ThumbsUp, TrendingUp } from 'lucide-react';

interface ShiftRecommendationsProps {
  shifts: Shift[];
  currentUser: User;
  onAcceptShift?: (shiftId: string) => void;
}

export const ShiftRecommendations: React.FC<ShiftRecommendationsProps> = ({
  shifts,
  currentUser,

  onAcceptShift
}) => {
  const [accepted, setAccepted] = useState<string[]>([]);

  const recommendations = useMemo(() => {
    const today = new Date();
    const twoWeeksOut = new Date(today);
    twoWeeksOut.setDate(today.getDate() + 14);

    // Find unassigned shifts in next 2 weeks
    const unassignedShifts = shifts.filter(
      s => !s.userId && new Date(s.date) >= today && new Date(s.date) <= twoWeeksOut
    );

    return unassignedShifts
      .map(shift => {
        let matchScore = 50; // Base score
        let reason = '';

        // Check preferences
        const shiftDate = new Date(shift.date);
        const dayName = shiftDate.toLocaleDateString('en-US', { weekday: 'long' });

        if (currentUser.preferences.preferredShifts?.includes(shift.type)) {
          matchScore += 25;
          reason += `Matches your preferred shift type. `;
        }

        if (currentUser.preferences.preferredDays?.includes(dayName)) {
          matchScore += 15;
          reason += `On your preferred day. `;
        }

        // Check team need (understaffed = higher urgency)
        const dayShifts = shifts.filter(s => s.date === shift.date);
        const typeCount = dayShifts.filter(s => s.type === shift.type && s.userId).length;
        if (typeCount === 0) {
          matchScore += 20;
          reason += `Team needs coverage urgently. `;
        }

        // Check if user's availability allows it
        if (currentUser.preferences.unavailableDates?.includes(shift.date)) {
          matchScore -= 40;
          reason = 'You marked this date unavailable. ';
        }

        // Avoid back-to-back (same user)
        const prevShift = shifts.find(
          s => s.userId === currentUser.id && new Date(s.date).getTime() === new Date(shift.date).getTime() - 86400000
        );
        const nextShift = shifts.find(
          s => s.userId === currentUser.id && new Date(s.date).getTime() === new Date(shift.date).getTime() + 86400000
        );

        if (prevShift || nextShift) {
          matchScore -= 10;
          reason += `Adjacent to your existing shift. `;
        }

        const urgency =
          matchScore >= 80 ? 'HIGH' : matchScore >= 60 ? 'MEDIUM' : 'LOW';

        return {
          shiftId: shift.id,
          date: shift.date,
          type: shift.type,
          matchScore: Math.max(0, matchScore),
          reason: reason.trim() || 'Available shift',
          urgency
        } as ShiftRecommendation;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }, [shifts, currentUser]);

  const handleAccept = (shiftId: string) => {
    if (onAcceptShift) {
      onAcceptShift(shiftId);
      setAccepted([...accepted, shiftId]);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 border-amber-200';
      case 'LOW':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-zinc-50 border-zinc-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-blue-600';
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.NIGHT: return '🌙';
      case ShiftType.MORNING: return '☀️';
      case ShiftType.EVENING: return '🌆';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Shift Recommendations</h3>
        <p className="text-zinc-500 text-sm">AI-suggested shifts based on your preferences and team needs</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <Zap className="mx-auto text-zinc-300 mb-3" size={48} />
          <p className="text-zinc-500 font-medium">No recommendations available</p>
          <p className="text-zinc-400 text-sm mt-1">All shifts are covered!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map(rec => {
            const shift = shifts.find(s => s.id === rec.shiftId);
            if (!shift) return null;

            const isAccepted = accepted.includes(rec.shiftId);

            return (
              <div
                key={rec.shiftId}
                className={`rounded-xl p-5 border-2 transition-all ${getUrgencyColor(rec.urgency)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getShiftIcon(shift.type)}</div>
                    <div>
                      <div className="font-semibold text-zinc-900">{shift.type} Shift</div>
                      <div className="text-sm text-zinc-600 mt-1">
                        {new Date(shift.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {(() => {
                          const formatToAmPm = (time: string) => {
                            if (!time) return '';
                            const [hours, minutes] = time.split(':');
                            const h = parseInt(hours, 10);
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            const h12 = h % 12 || 12;
                            return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                          };
                          return `${formatToAmPm(shift.lunchStart)} - ${formatToAmPm(shift.lunchEnd)} lunch • ${formatToAmPm(shift.breakStart)} - ${formatToAmPm(shift.breakEnd)} break`;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-3xl font-black ${getScoreColor(rec.matchScore)}`}>
                      {rec.matchScore}
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">match</div>
                    <div className={`text-xs font-bold mt-2 px-2 py-1 rounded-full ${rec.urgency === 'HIGH' ? 'bg-red-200 text-red-800' :
                      rec.urgency === 'MEDIUM' ? 'bg-amber-200 text-amber-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                      {rec.urgency}
                    </div>
                  </div>
                </div>

                <div className="bg-black/5 rounded-lg p-3 mb-3">
                  <p className="text-sm text-zinc-700">{rec.reason}</p>
                </div>

                <button
                  onClick={() => handleAccept(rec.shiftId)}
                  disabled={isAccepted}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isAccepted
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {isAccepted ? (
                    <>
                      <ThumbsUp size={16} />
                      Shift Accepted
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} />
                      Accept Shift
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          <span className="font-bold">💡 Pro Tip:</span> Accept shifts with HIGH urgency to help your team and boost your reliability score!
        </p>
      </div>
    </div>
  );
};
