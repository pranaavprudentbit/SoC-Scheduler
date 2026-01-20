'use client';

import React, { useState } from 'react';
import { User, LeaveRequest } from '@/lib/types';
import { Calendar, Clock, Check, X, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

interface LeaveRequestPanelProps {
  currentUser: User;
  leaveRequests: LeaveRequest[];
  onRefresh: () => void;
}

export const LeaveRequestPanel: React.FC<LeaveRequestPanelProps> = ({
  currentUser,
  leaveRequests,
  onRefresh
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.reason.trim()) {
      return;
    }

    try {
      await addDoc(collection(db, 'leave_requests'), {
        userId: currentUser.id,
        date: formData.date,
        reason: formData.reason.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      setFormData({ date: '', reason: '' });
      setIsCreating(false);
      onRefresh();
    } catch (error) {
      console.error('Error submitting leave request:', error);
    }
  };

  const userRequests = leaveRequests.filter(lr => lr.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'APPROVED': return <Check size={14} />;
      case 'REJECTED': return <X size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Tactical Initiation Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Recess Configuration</h4>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Manage deployment exemption requests</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`flex-shrink-0 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 ${isCreating
            ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 shadow-none'
            : 'bg-zinc-900 text-white hover:bg-black'
            }`}
        >
          {isCreating ? (
            <>
              <X size={14} strokeWidth={3} /> Abort Request
            </>
          ) : (
            <>
              <Calendar size={14} strokeWidth={3} /> Initiate Exemption
            </>
          )}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-zinc-900 rounded-[2.5rem] p-6 sm:p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <AlertCircle size={140} />
          </div>

          <div className="relative">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-8 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              New Exemption Protocol
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 font-black">Temporal Selection</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-6 py-4 rounded-3xl font-black outline-none focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 focus:bg-white transition-all uppercase tracking-widest text-xs"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 font-black">Operational Rationale</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide detailed justification for deployment recess..."
                  rows={1}
                  className="w-full bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-6 py-4 rounded-3xl font-bold outline-none focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 focus:bg-white transition-all resize-none text-sm leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-8 py-4 text-xs font-black text-zinc-400 hover:text-red-600 uppercase tracking-[0.2em] transition-colors"
              >
                Cancel Entry
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:scale-[1.02] active:scale-95"
              >
                Transmit Protocol
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Exemption Records Chain */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
          Historical Recess Chain ({userRequests.length})
        </h4>

        {userRequests.length === 0 ? (
          <div className="py-24 text-center bg-zinc-50/50 border-2 border-dashed border-zinc-100 rounded-[3rem]">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-zinc-200 mb-6 shadow-sm">
              <Calendar size={40} />
            </div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Exemption Log Empty</p>
            <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase tracking-tight">Personnel maintaining 100% deployment capability</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {userRequests.map((request, idx) => (
              <div
                key={request.id}
                className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-7 hover:shadow-xl hover:shadow-zinc-100 transition-all group animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="bg-zinc-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                        {new Date(request.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border-2 ${request.status === 'PENDING' ? 'border-amber-100 bg-amber-50 text-amber-700' :
                        request.status === 'APPROVED' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                          'border-red-100 bg-red-50 text-red-700'
                        }`}>
                        {getStatusIcon(request.status)}
                        {request.status.toUpperCase()}
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-700 font-medium leading-relaxed mb-4">
                      {request.reason}
                    </p>
                    <div className="flex items-center gap-4 border-t border-zinc-100 pt-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-zinc-300" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Logged {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="sm:hidden w-full h-[2px] bg-amber-50 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-amber-400 animate-pulse w-1/2 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
