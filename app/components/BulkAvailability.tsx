'use client';

import React, { useState, useMemo } from 'react';
import { User, UserAvailability } from '@/lib/types';
import { Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface BulkAvailabilityProps {
  currentUser: User;
  onRefresh: () => void;
}

export const BulkAvailability: React.FC<BulkAvailabilityProps> = ({ currentUser, onRefresh }) => {
  const [unavailableDates, setUnavailableDates] = useState<UserAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    blockWeek: false
  });

  // Load user's unavailable dates
  React.useEffect(() => {
    loadUnavailableDates();
  }, []);

  const loadUnavailableDates = async () => {
    try {
      const q = query(collection(db, 'user_availability'), where('userId', '==', currentUser.id));
      const snapshot = await getDocs(q);
      const dates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setUnavailableDates(dates);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleBlockDates = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please select both dates');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      // Add a date entry for each day in range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        await addDoc(collection(db, 'user_availability'), {
          userId: currentUser.id,
          date: dateStr,
          available: false,
          reason: formData.reason || 'Unavailable',
          createdAt: new Date().toISOString()
        });
      }

      setFormData({ startDate: '', endDate: '', reason: '', blockWeek: false });
      setShowModal(false);
      await loadUnavailableDates();
      onRefresh();
    } catch (error) {
      console.error('Error blocking dates:', error);
      alert('Failed to block dates');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    if (!confirm('Remove this unavailability block?')) return;

    try {
      await deleteDoc(doc(db, 'user_availability', id));
      await loadUnavailableDates();
      onRefresh();
    } catch (error) {
      console.error('Error removing block:', error);
    }
  };

  const quickAvailability = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      daysBlocked: unavailableDates.filter(
        d => d.date >= weekStart.toISOString().split('T')[0] && d.date <= weekEnd.toISOString().split('T')[0]
      ).length
    };
  }, [unavailableDates]);

  const nextWeekUnavailable = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStart = new Date(nextWeek);
    nextWeekStart.setDate(nextWeek.getDate() - nextWeek.getDay() + 1);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    return unavailableDates.filter(
      d => d.date >= nextWeekStart.toISOString().split('T')[0] && d.date <= nextWeekEnd.toISOString().split('T')[0]
    ).length;
  };

  const groupedByReason = useMemo(() => {
    const grouped: Record<string, UserAvailability[]> = {};
    unavailableDates.forEach(date => {
      const reason = date.reason || 'Other';
      if (!grouped[reason]) grouped[reason] = [];
      grouped[reason].push(date);
    });
    return grouped;
  }, [unavailableDates]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Availability & Time Off</h3>
        <p className="text-zinc-500 text-sm">Block dates when you're unavailable (vacation, sick leave, etc.)</p>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">This Week</span>
            <Calendar className="text-zinc-400" size={18} />
          </div>
          <div className="text-2xl font-black text-zinc-900">{quickAvailability.daysBlocked} days</div>
          <div className="text-xs text-zinc-500 mt-2">unavailable</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">Next Week</span>
            <Calendar className="text-zinc-400" size={18} />
          </div>
          <div className="text-2xl font-black text-zinc-900">{nextWeekUnavailable()} days</div>
          <div className="text-xs text-zinc-500 mt-2">unavailable</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase">Total Blocks</span>
            <AlertCircle className="text-amber-600" size={18} />
          </div>
          <div className="text-2xl font-black text-amber-600">{unavailableDates.length}</div>
          <div className="text-xs text-zinc-500 mt-2">dates blocked</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        <Calendar size={18} />
        Block Dates
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h4 className="text-xl font-bold text-zinc-900 mb-4">Block Unavailability</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Reason</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockDates}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Blocking...' : 'Block'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped List */}
      <div className="space-y-6">
        {Object.entries(groupedByReason).length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={48} />
            <p className="text-zinc-600 font-medium">You're available all the time!</p>
            <p className="text-zinc-400 text-sm mt-1">Block dates when you need time off</p>
          </div>
        ) : (
          Object.entries(groupedByReason).map(([reason, dates]) => (
            <div key={reason}>
              <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                {reason} ({dates.length} days)
              </h4>
              <div className="space-y-2">
                {dates.sort((a, b) => a.date.localeCompare(b.date)).map(availability => (
                  <div
                    key={availability.id}
                    className="flex items-center justify-between bg-white border border-zinc-200 p-4 rounded-lg hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="font-semibold text-sm text-zinc-900">
                        {new Date(availability.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => availability.id && handleRemoveBlock(availability.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          <span className="font-bold">ℹ️ Note:</span> When you block dates, the admin will not assign you any shifts on those days.
        </p>
      </div>
    </div>
  );
};
