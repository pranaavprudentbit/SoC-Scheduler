'use client';

import React, { useState } from 'react';
import { User, Shift, ShiftType } from '@/lib/types';
import { Copy, Trash2, RefreshCw, Users as UsersIcon, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';

interface BulkOperationsProps {
  users: User[];
  shifts: Shift[];
  onRefresh: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({ 
  users, 
  shifts, 
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [sourceWeek, setSourceWeek] = useState('');
  const [targetWeek, setTargetWeek] = useState('');
  const [fromUser, setFromUser] = useState('');
  const [toUser, setToUser] = useState('');

  // Get list of weeks with shifts
  const getWeeks = () => {
    const weeks = new Set<string>();
    shifts.forEach(shift => {
      const date = new Date(shift.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
      weeks.add(weekStart.toISOString().split('T')[0]);
    });
    return Array.from(weeks).sort();
  };

  const weeks = getWeeks();

  const handleCopyWeek = async () => {
    if (!sourceWeek || !targetWeek) {
      return;
    }

    setLoading(true);
    try {
      const sourceDate = new Date(sourceWeek);
      const targetDate = new Date(targetWeek);
      const daysDiff = Math.floor((targetDate.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get all shifts from source week
      const sourceShifts = shifts.filter(s => {
        const shiftDate = new Date(s.date);
        return shiftDate >= sourceDate && shiftDate < new Date(sourceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      });

      // Create copies with adjusted dates
      for (const shift of sourceShifts) {
        const newDate = new Date(shift.date);
        newDate.setDate(newDate.getDate() + daysDiff);
        const newDateStr = newDate.toISOString().split('T')[0];

        // Check if shift already exists
        const exists = shifts.some(s => s.date === newDateStr && s.userId === shift.userId && s.type === shift.type);
        if (!exists) {
          await addDoc(collection(db, 'shifts'), {
            date: newDateStr,
            shift: shift.type,
            userId: shift.userId,
            lunchStart: shift.lunchStart,
            lunchEnd: shift.lunchEnd,
            breakStart: shift.breakStart,
            breakEnd: shift.breakEnd,
            manuallyCreated: true, // Mark as manually created
            createdAt: new Date().toISOString(),
          });
        }
      }

      setShowCopyModal(false);
      setSourceWeek('');
      setTargetWeek('');
      onRefresh();
    } catch (error) {
      console.error('Error copying week:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMassReassign = async () => {
    if (!fromUser || !toUser) {
      return;
    }

    if (fromUser === toUser) {
      return;
    }

    const futureShifts = shifts.filter(s => s.userId === fromUser && s.date >= new Date().toISOString().split('T')[0]);
    
    if (!confirm(`Reassign ${futureShifts.length} future shifts from ${users.find(u => u.id === fromUser)?.name} to ${users.find(u => u.id === toUser)?.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      for (const shift of futureShifts) {
        await updateDoc(doc(db, 'shifts', shift.id), {
          userId: toUser,
          manuallyCreated: true,
        });
      }

      setShowReassignModal(false);
      setFromUser('');
      setToUser('');
      onRefresh();
    } catch (error) {
      console.error('Error reassigning shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFutureShifts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const futureShifts = shifts.filter(s => s.date >= today);

    if (!confirm(`Delete ALL ${futureShifts.length} future shifts? This cannot be undone!`)) {
      return;
    }

    setLoading(true);
    try {
      for (const shift of futureShifts) {
        await deleteDoc(doc(db, 'shifts', shift.id));
      }

      onRefresh();
    } catch (error) {
      console.error('Error clearing shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Bulk Operations</h3>
        <p className="text-zinc-500 text-sm">Powerful tools for managing shifts in bulk</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Use with caution</h4>
            <p className="text-xs text-amber-700 mt-1">
              Bulk operations affect multiple shifts at once and cannot be easily undone. All bulk-created shifts are marked as protected.
            </p>
          </div>
        </div>
      </div>

      {/* Operation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Copy Week */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Copy className="text-blue-600" size={24} />
            </div>
            <h4 className="font-bold text-zinc-900">Copy Week</h4>
          </div>
          <p className="text-sm text-zinc-600 mb-4">Duplicate an entire week's schedule to another week. Perfect for repeating patterns.</p>
          <button
            onClick={() => setShowCopyModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Copy Week
          </button>
        </div>

        {/* Mass Reassign */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="text-purple-600" size={24} />
            </div>
            <h4 className="font-bold text-zinc-900">Mass Reassign</h4>
          </div>
          <p className="text-sm text-zinc-600 mb-4">Reassign all future shifts from one user to another in one go.</p>
          <button
            onClick={() => setShowReassignModal(true)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Reassign Shifts
          </button>
        </div>

        {/* Clear Future */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h4 className="font-bold text-zinc-900">Clear Future</h4>
          </div>
          <p className="text-sm text-zinc-600 mb-4">Delete all future shifts to start fresh. Cannot be undone!</p>
          <button
            onClick={handleClearFutureShifts}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Clear All Future
          </button>
        </div>
      </div>

      {/* Copy Week Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h4 className="text-xl font-bold text-zinc-900 mb-4">Copy Week Schedule</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">From Week (Monday)</label>
                <select
                  value={sourceWeek}
                  onChange={(e) => setSourceWeek(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source week...</option>
                  {weeks.map(week => (
                    <option key={week} value={week}>
                      Week of {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">To Week (Monday)</label>
                <input
                  type="date"
                  value={targetWeek}
                  onChange={(e) => setTargetWeek(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCopyModal(false);
                    setSourceWeek('');
                    setTargetWeek('');
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyWeek}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Copying...' : 'Copy Week'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mass Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h4 className="text-xl font-bold text-zinc-900 mb-4">Mass Reassign Shifts</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">From User</label>
                <select
                  value={fromUser}
                  onChange={(e) => setFromUser(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">To User</label>
                <select
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {fromUser && (
                <div className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">
                  {shifts.filter(s => s.userId === fromUser && s.date >= new Date().toISOString().split('T')[0]).length} future shifts will be reassigned
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setFromUser('');
                    setToUser('');
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMassReassign}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Reassigning...' : 'Reassign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
