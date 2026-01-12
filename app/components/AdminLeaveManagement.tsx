'use client';

import React from 'react';
import { User, LeaveRequest } from '@/lib/types';
import { Check, X, Calendar, Clock } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { updateDoc, doc } from 'firebase/firestore';

interface AdminLeaveManagementProps {
  users: User[];
  leaveRequests: LeaveRequest[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminLeaveManagement: React.FC<AdminLeaveManagementProps> = ({ 
  users, 
  leaveRequests,
  currentUser,
  onRefresh
}) => {
  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const request = leaveRequests.find(lr => lr.id === requestId);
      if (!request) return;

      const requestUser = getUserById(request.userId);
      
      const requestRef = doc(db, 'leave_requests', requestId);
      await updateDoc(requestRef, {
        status,
        reviewedBy: currentUser.id,
        reviewedAt: new Date().toISOString(),
      });

      onRefresh();
    } catch (error) {
      console.error('Error reviewing leave request:', error);
    }
  };

  const pendingRequests = leaveRequests
    .filter(lr => lr.status === 'PENDING')
    .sort((a, b) => a.date.localeCompare(b.date));

  const reviewedRequests = leaveRequests
    .filter(lr => lr.status !== 'PENDING')
    .sort((a, b) => b.reviewedAt?.localeCompare(a.reviewedAt || '') || 0)
    .slice(0, 10);

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 mb-1">Leave Requests</h3>
        <p className="text-zinc-500 text-sm">Review and manage team leave requests</p>
      </div>

      {/* Pending Requests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-amber-600" size={18} />
          <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
            Pending Approval ({pendingRequests.length})
          </h4>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 bg-white border border-zinc-200 rounded-xl">
            <Check className="mx-auto text-zinc-300 mb-2" size={32} />
            <p className="text-zinc-500 text-sm">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(request => {
              const user = getUserById(request.userId);
              return (
                <div
                  key={request.id}
                  className="bg-white border-2 border-amber-200 rounded-xl p-5 hover:border-amber-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={user?.avatar || `https://picsum.photos/seed/${request.userId}/200`}
                        alt={user?.name}
                        className="w-12 h-12 rounded-full border-2 border-zinc-200"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-zinc-900">{user?.name}</span>
                          <span className="text-xs text-zinc-400">•</span>
                          <span className="text-sm font-medium text-zinc-700">
                            {new Date(request.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed mb-2">{request.reason}</p>
                        <p className="text-xs text-zinc-400">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReview(request.id, 'APPROVED')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
                        title="Approve"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(request.id, 'REJECTED')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
                        title="Reject"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Reviewed */}
      {reviewedRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-zinc-500" size={18} />
            <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
              Recently Reviewed
            </h4>
          </div>

          <div className="space-y-2">
            {reviewedRequests.map(request => {
              const user = getUserById(request.userId);
              const reviewer = request.reviewedBy ? getUserById(request.reviewedBy) : null;
              
              return (
                <div
                  key={request.id}
                  className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.avatar || `https://picsum.photos/seed/${request.userId}/200`}
                        alt={user?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-zinc-900 text-sm">{user?.name}</span>
                          <span className="text-xs text-zinc-400">•</span>
                          <span className="text-xs text-zinc-600">
                            {new Date(request.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1">{request.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                        {request.status === 'APPROVED' ? <Check size={12} /> : <X size={12} />}
                        {request.status}
                      </span>
                      {reviewer && (
                        <span className="text-xs text-zinc-400">by {reviewer.name.split(' ')[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
