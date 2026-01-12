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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Leave Requests</h2>
          <p className="text-zinc-500 text-sm mt-1">Request time off and track your leave status</p>
        </div>
        
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Calendar size={16} />
          {isCreating ? 'Cancel' : 'Request Leave'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-zinc-900">New Leave Request</h3>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request..."
              rows={3}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {userRequests.length === 0 ? (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-xl">
            <Calendar className="mx-auto text-zinc-300 mb-3" size={40} />
            <p className="text-zinc-500 text-sm">No leave requests yet</p>
            <p className="text-zinc-400 text-xs mt-1">Click "Request Leave" to submit a new request</p>
          </div>
        ) : (
          userRequests.map(request => (
            <div
              key={request.id}
              className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {new Date(request.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{request.reason}</p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Requested {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
