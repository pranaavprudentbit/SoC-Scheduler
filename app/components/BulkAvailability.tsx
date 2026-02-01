'use client';

import React, { useState, useMemo } from 'react';
import { User, UserAvailability } from '@/lib/types';
import { Calendar, AlertCircle, CheckCircle2, X, Plus } from 'lucide-react';
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

      // Log activity
      await import('@/lib/logger').then(m => m.logActivity(
        currentUser.id,
        currentUser.name,
        'Unavailable',
        `Blocked ${formData.startDate} to ${formData.endDate} (${formData.reason || 'No reason'})`,
        'AVAILABILITY_CHANGE'
      ));

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

      // Log activity
      await import('@/lib/logger').then(m => m.logActivity(
        currentUser.id,
        currentUser.name,
        'Available',
        'Removed unavailability block',
        'AVAILABILITY_CHANGE'
      ));

    } catch (error) {
      console.error('Error removing block:', error);
    }
  };

  const activeBlocksCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return unavailableDates.filter(d => d.date >= today).length;
  }, [unavailableDates]);

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Strategic Availability Metrices */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Days Restricted', value: activeBlocksCount, sub: 'Future Active Blocks', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Full Log', value: unavailableDates.length, sub: 'Total Record Count', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' }
        ].map((item, idx) => (
          <div key={idx} className={`bg-white border rounded-[2.5rem] p-6 shadow-sm transition-all hover:shadow-md ${item.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${item.color}`}>{item.label}</span>
              <div className={`p-2 rounded-xl bg-white shadow-sm ${item.color}`}>
                <item.icon size={16} strokeWidth={3} />
              </div>
            </div>
            <div className="text-4xl font-black text-zinc-900 tracking-tighter tabular-nums">{item.value}</div>
            <div className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-tighter">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Deployment Restriction Initiation */}
      <button
        onClick={() => setShowModal(true)}
        className="group relative w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-2xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Plus size={20} strokeWidth={4} />
        Generate Restriction Block
      </button>

      {/* Strategic Restriction Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-8 sm:p-10 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Calendar size={200} />
            </div>

            <div className="relative">
              <h4 className="text-2xl font-black text-zinc-900 tracking-tight mb-8 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                Block Configuration
              </h4>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Initiation Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-6 py-4 rounded-2xl font-black text-xs outline-none focus:border-blue-600 focus:bg-white transition-all uppercase tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Termination Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-6 py-4 rounded-2xl font-black text-xs outline-none focus:border-blue-600 focus:bg-white transition-all uppercase tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Exemption Rationale</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-6 py-4 rounded-2xl font-black text-xs outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">SELECT PARAMETER...</option>
                    <option value="Vacation">ANNUAL LEAVE</option>
                    <option value="Sick Leave">MEDICAL EXEMPTION</option>
                    <option value="Personal">PERSONAL CYCLE</option>
                    <option value="Other">OTHER PROTOCOL</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    Abort Entry
                  </button>
                  <button
                    onClick={handleBlockDates}
                    disabled={loading}
                    className="bg-zinc-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:bg-zinc-100 disabled:text-zinc-300"
                  >
                    {loading ? 'SYNCHRONIZING...' : 'COMMIT BLOCK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restriction Log Chain */}
      <div className="space-y-8">
        {Object.entries(groupedByReason).length === 0 ? (
          <div className="py-24 text-center bg-zinc-50/50 border-2 border-dashed border-zinc-100 rounded-[3rem]">
            <CheckCircle2 className="mx-auto text-emerald-300 mb-6" size={56} />
            <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Operational Readiness 100%</p>
            <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase tracking-tight">Deployment path clear of restrictions</p>
          </div>
        ) : (
          Object.entries(groupedByReason).map(([reason, dates]) => (
            <div key={reason} className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-4 px-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertCircle size={16} strokeWidth={3} />
                </div>
                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">
                  {reason.toUpperCase()} <span className="text-zinc-400 ml-2 font-bold">// {dates.length} LOGS</span>
                </h4>
                <div className="flex-1 h-[1px] bg-zinc-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dates.sort((a, b) => a.date.localeCompare(b.date)).map(availability => (
                  <div
                    key={availability.id}
                    className="flex items-center justify-between bg-white border border-zinc-200 p-5 rounded-[1.5rem] hover:shadow-xl hover:shadow-zinc-100 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex flex-col items-center justify-center font-black text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <span className="text-[10px] leading-none mb-0.5">{new Date(availability.date).toLocaleDateString('en-US', { day: '2-digit' })}</span>
                        <span className="text-[8px] leading-none uppercase">{new Date(availability.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">
                        {new Date(availability.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                    </div>
                    <button
                      onClick={() => availability.id && handleRemoveBlock(availability.id)}
                      className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
