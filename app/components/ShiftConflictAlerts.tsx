'use client';

import React, { useState, useMemo } from 'react';
import { Shift, User } from '@/lib/types';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ShiftConflictAlertsProps {
  shifts: Shift[];
  currentUser: User;
  potentialShift?: Shift;
  onConflictCheck?: (conflicts: string[]) => void;
}

export const ShiftConflictAlerts: React.FC<ShiftConflictAlertsProps> = ({
  shifts,
  currentUser,
  potentialShift,
  onConflictCheck
}) => {
  const [showDetails, setShowDetails] = useState(true);

  const conflicts = useMemo(() => {
    const issues: string[] = [];

    if (!potentialShift) return issues;

    const shiftDate = new Date(potentialShift.date);
    const userShifts = shifts.filter(s => s.userId === currentUser.id);

    // Check 1: Unavailable on this date
    if (currentUser.preferences.unavailableDates?.includes(potentialShift.date)) {
      issues.push('❌ You marked this date as unavailable');
    }

    // Check 2: Shift preference mismatch
    if (
      currentUser.preferences.preferredShifts &&
      currentUser.preferences.preferredShifts.length > 0 &&
      !currentUser.preferences.preferredShifts.includes(potentialShift.type)
    ) {
      issues.push(`⚠️ You prefer ${currentUser.preferences.preferredShifts.join(', ')} shifts, not ${potentialShift.type}`);
    }

    // Check 3: Day preference mismatch
    const dayName = shiftDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (
      currentUser.preferences.preferredDays &&
      currentUser.preferences.preferredDays.length > 0 &&
      !currentUser.preferences.preferredDays.includes(dayName)
    ) {
      issues.push(`⚠️ You prefer to work on ${currentUser.preferences.preferredDays.join(', ')}, not ${dayName}`);
    }

    // Check 4: Back-to-back shifts
    const prevDate = new Date(shiftDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    const nextDate = new Date(shiftDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const hasPrevShift = userShifts.some(s => s.date === prevDateStr);
    const hasNextShift = userShifts.some(s => s.date === nextDateStr);

    if (hasPrevShift && hasNextShift) {
      issues.push('🚨 You already work both the day before and after this shift');
    } else if (hasPrevShift) {
      issues.push('⚠️ You already work the day before this shift (back-to-back)');
    } else if (hasNextShift) {
      issues.push('⚠️ You already work the day after this shift (back-to-back)');
    }

    // Check 5: Over 5 shifts per week (our limit)
    const weekStart = new Date(shiftDate);
    weekStart.setDate(shiftDate.getDate() - shiftDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const shiftsThisWeek = userShifts.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= weekStart && sDate <= weekEnd;
    }).length;

    if (shiftsThisWeek >= 5) {
      issues.push(`📊 You already have ${shiftsThisWeek} shifts this week (5 is the max)`);
    }

    // Check 6: Already assigned to same shift type on same date (rare but possible)
    const alreadyAssigned = userShifts.some(
      s => s.date === potentialShift.date && s.type === potentialShift.type
    );
    if (alreadyAssigned) {
      issues.push('🔴 You are already assigned to a shift on this date');
    }

    return issues;
  }, [potentialShift, currentUser, shifts]);

  React.useEffect(() => {
    if (onConflictCheck) {
      onConflictCheck(conflicts);
    }
  }, [conflicts, onConflictCheck]);

  if (!potentialShift) {
    return null;
  }

  const severity = conflicts.length > 2 ? 'high' : conflicts.length > 0 ? 'medium' : 'none';

  return (
    <div className="space-y-4">
      {conflicts.length > 0 && (
        <div
          className={`rounded-xl p-4 border-2 ${
            severity === 'high'
              ? 'bg-red-50 border-red-300'
              : severity === 'medium'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-blue-50 border-blue-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {severity === 'high' ? (
              <AlertTriangle className="text-red-600 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-amber-600 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${
                severity === 'high' ? 'text-red-900' : 'text-amber-900'
              }`}>
                {severity === 'high' ? 'Scheduling Conflicts' : 'Scheduling Warnings'}
              </h4>

              {showDetails && (
                <ul className="space-y-1">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx} className={`text-sm ${
                      severity === 'high' ? 'text-red-800' : 'text-amber-800'
                    }`}>
                      {conflict}
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-xs font-semibold mt-2 underline ${
                  severity === 'high' ? 'text-red-700 hover:text-red-900' : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {conflicts.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start gap-3">
          <div className="text-2xl mt-0.5">✅</div>
          <div>
            <h4 className="font-semibold text-emerald-900">No Conflicts</h4>
            <p className="text-sm text-emerald-800 mt-1">This shift aligns with your preferences and schedule.</p>
          </div>
        </div>
      )}

      {severity === 'high' && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-900">
            ⚠️ Are you sure you want to accept this shift? There are significant conflicts.
          </p>
        </div>
      )}
    </div>
  );
};
