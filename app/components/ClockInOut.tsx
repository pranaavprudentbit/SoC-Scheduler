'use client';

import React, { useState, useEffect } from 'react';
import { Shift, ClockEntry, User } from '@/lib/types';
import { Clock, Play, Square, AlertCircle } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ClockInOutProps {
  shifts: Shift[];
  currentUser: User;
  upcomingShift?: Shift;
}

export const ClockInOut: React.FC<ClockInOutProps> = ({ shifts, currentUser, upcomingShift }) => {
  const [clockEntries, setClockEntries] = useState<ClockEntry[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekStats, setWeekStats] = useState({ hours: 0, overtime: 0, shifts: 0 });

  useEffect(() => {
    loadClockEntries();
    calculateWeekStats();
  }, [shifts, currentUser.id]);

  const loadClockEntries = async () => {
    try {
      const q = query(collection(db, 'clock_entries'), where('userId', '==', currentUser.id));
      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClockEntry));
      setClockEntries(entries);

      // Check if currently clocked in
      const activeEntry = entries.find(e => !e.clockOutTime);
      if (activeEntry) {
        setIsClockedIn(true);
        setClockInTime(activeEntry.clockInTime);
      }
    } catch (error) {
      console.error('Error loading clock entries:', error);
    }
  };

  const calculateWeekStats = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const userShifts = shifts.filter(
      s => s.userId === currentUser.id && new Date(s.date) >= weekStart
    );

    let totalHours = 0;
    clockEntries.forEach(entry => {
      if (entry.actualHours) totalHours += entry.actualHours;
    });

    const overtime = Math.max(0, totalHours - 40);

    setWeekStats({
      hours: Math.round(totalHours * 10) / 10,
      overtime: Math.round(overtime * 10) / 10,
      shifts: userShifts.length
    });
  };

  const handleClockIn = async () => {
    if (!upcomingShift) {
      alert('No upcoming shift found');
      return;
    }

    setLoading(true);
    try {
      const clockInTimeStr = new Date().toISOString();
      await addDoc(collection(db, 'clock_entries'), {
        shiftId: upcomingShift.id,
        userId: currentUser.id,
        clockInTime: clockInTimeStr,
        createdAt: clockInTimeStr
      });

      setIsClockedIn(true);
      setClockInTime(clockInTimeStr);
      await loadClockEntries();
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const activeEntry = clockEntries.find(e => !e.clockOutTime);
      if (!activeEntry) return;

      const clockOutTimeStr = new Date().toISOString();
      const clockInTime = new Date(activeEntry.clockInTime);
      const clockOutTime = new Date(clockOutTimeStr);
      const actualHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      await updateDoc(doc(db, 'clock_entries', activeEntry.id), {
        clockOutTime: clockOutTimeStr,
        actualHours: Math.round(actualHours * 100) / 100
      });

      setIsClockedIn(false);
      setClockInTime(null);
      await loadClockEntries();
      calculateWeekStats();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const getElapsedTime = () => {
    if (!clockInTime) return '00:00:00';
    const now = new Date();
    const clockIn = new Date(clockInTime);
    const elapsed = Math.floor((now.getTime() - clockIn.getTime()) / 1000);
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!isClockedIn) return;
    
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Time Tracking</h3>
        <p className="text-zinc-500 text-sm">Clock in/out for your shifts and track hours</p>
      </div>

      {/* Clock In/Out Card */}
      <div className={`rounded-2xl p-8 text-white shadow-xl ${
        isClockedIn 
          ? 'bg-gradient-to-br from-green-600 to-emerald-700' 
          : 'bg-gradient-to-br from-zinc-600 to-zinc-700'
      }`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-sm font-semibold opacity-90 uppercase tracking-wider mb-2">
              {isClockedIn ? 'Clocked In' : 'Clocked Out'}
            </div>
            <div className="text-5xl font-black font-mono mb-2">
              {isClockedIn ? elapsedTime : '00:00:00'}
            </div>
            {isClockedIn && clockInTime && (
              <div className="text-sm opacity-75">
                Started at {new Date(clockInTime).toLocaleTimeString()}
              </div>
            )}
          </div>
          <Clock className="opacity-20" size={64} />
        </div>

        {upcomingShift && (
          <div className="text-sm opacity-90 mb-4">
            {upcomingShift.type} Shift • {upcomingShift.lunchStart}-{upcomingShift.lunchEnd} Lunch
          </div>
        )}

        <div className="flex gap-3">
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={loading || !upcomingShift}
              className="flex-1 px-6 py-3 bg-white text-green-600 rounded-xl text-sm font-bold hover:bg-green-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Play size={18} />
              Clock In
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-white text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Square size={18} />
              Clock Out
            </button>
          )}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-600 uppercase font-semibold mb-2">This Week</div>
          <div className="text-2xl font-black text-blue-600">{weekStats.hours}h</div>
          <div className="text-xs text-zinc-500 mt-1">worked</div>
        </div>

        <div className={`rounded-xl p-4 ${
          weekStats.overtime > 0 
            ? 'bg-amber-50 border border-amber-200' 
            : 'bg-white border border-zinc-200'
        }`}>
          <div className="text-xs text-zinc-600 uppercase font-semibold mb-2">Overtime</div>
          <div className={`text-2xl font-black ${weekStats.overtime > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
            {weekStats.overtime > 0 ? `+${weekStats.overtime}h` : '0h'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{weekStats.overtime > 0 ? 'over 40h' : 'on track'}</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs text-zinc-600 uppercase font-semibold mb-2">Shifts</div>
          <div className="text-2xl font-black text-emerald-600">{weekStats.shifts}</div>
          <div className="text-xs text-zinc-500 mt-1">this week</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div>
        <h4 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">Recent Clock Entries</h4>
        <div className="space-y-2">
          {clockEntries.slice(-10).reverse().map(entry => {
            const clockIn = new Date(entry.clockInTime);
            const clockOut = entry.clockOutTime ? new Date(entry.clockOutTime) : null;
            
            return (
              <div key={entry.id} className="bg-white border border-zinc-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {clockIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {clockIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {clockOut && ` - ${clockOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                  {entry.actualHours && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-zinc-900">{entry.actualHours}h</div>
                      <div className="text-xs text-zinc-500">worked</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning */}
      {weekStats.overtime > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-900">Overtime Alert</p>
            <p className="text-sm text-amber-700 mt-1">You have {weekStats.overtime} hours of overtime this week. Take breaks and rest!</p>
          </div>
        </div>
      )}
    </div>
  );
};
