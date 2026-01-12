'use client';

import React, { useState, useEffect } from 'react';
import { User, Shift, SwapRequest, ShiftType } from '@/lib/types';
import { RefreshCw, Plus, X, Check, Calendar, Clock, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';

interface SwapMarketplaceProps {
  currentUser: User;
  users: User[];
  shifts: Shift[];
  onRefresh: () => void;
}

export const SwapMarketplace: React.FC<SwapMarketplaceProps> = ({ 
  currentUser, 
  users, 
  shifts, 
  onRefresh 
}) => {
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'myRequests' | 'myOffers'>('available');

  const myShifts = shifts.filter(s => s.userId === currentUser.id && s.date >= new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSwapRequests();
  }, []);

  const fetchSwapRequests = async () => {
    try {
      const swapsRef = collection(db, 'swap_requests');
      const snapshot = await getDocs(swapsRef);
      const swaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SwapRequest));
      setSwapRequests(swaps);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSwap = async () => {
    if (!selectedShift) {
      return;
    }

    try {
      const shift = shifts.find(s => s.id === selectedShift);
      if (!shift) return;

      await addDoc(collection(db, 'swap_requests'), {
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        targetShiftId: shift.id,
        targetShiftDate: shift.date,
        targetShiftType: shift.type,
        status: 'PENDING',
        reason: reason || 'No reason provided',
        createdAt: new Date().toISOString(),
      });

      setShowCreateModal(false);
      setSelectedShift('');
      setReason('');
      fetchSwapRequests();
    } catch (error) {
      console.error('Error creating swap request:', error);
    }
  };

  const handleAcceptSwap = async (swapRequest: SwapRequest) => {
    if (!confirm('Accept this swap? You will take over their shift.')) return;

    try {
      const targetShift = shifts.find(s => s.id === swapRequest.targetShiftId);
      if (!targetShift) {
        return;
      }

      // Update the shift to the current user
      await updateDoc(doc(db, 'shifts', targetShift.id), {
        userId: currentUser.id,
      });

      // Update swap request status
      await updateDoc(doc(db, 'swap_requests', swapRequest.id), {
        status: 'ACCEPTED',
        respondedBy: currentUser.id,
        recipientId: currentUser.id,
        respondedAt: new Date().toISOString(),
      });

      fetchSwapRequests();
      onRefresh();
    } catch (error) {
      console.error('Error accepting swap:', error);
    }
  };

  const handleCancelSwap = async (swapId: string) => {
    if (!confirm('Cancel this swap request?')) return;

    try {
      await deleteDoc(doc(db, 'swap_requests', swapId));
      fetchSwapRequests();
    } catch (error) {
      console.error('Error cancelling swap:', error);
    }
  };

  const getShiftIcon = (type: ShiftType) => {
    const icons = {
      [ShiftType.MORNING]: '☀️',
      [ShiftType.EVENING]: '🌆',
      [ShiftType.NIGHT]: '🌙',
    };
    return icons[type];
  };

  const getShiftColor = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return 'bg-amber-50 border-amber-200 text-amber-900';
      case ShiftType.EVENING: return 'bg-blue-50 border-blue-200 text-blue-900';
      case ShiftType.NIGHT: return 'bg-slate-100 border-slate-300 text-slate-900';
    }
  };

  const availableSwaps = swapRequests.filter(
    s => s.status === 'PENDING' && s.requesterId !== currentUser.id
  );

  const myRequests = swapRequests.filter(
    s => s.requesterId === currentUser.id
  );

  const getMatchScore = (swap: SwapRequest): string => {
    // Simple matching logic
    const myPrefs = currentUser.preferences;
    const swapDate = new Date(swap.targetShiftDate);
    const dayName = swapDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    let score = 50; // Base score
    
    if (myPrefs.preferredShifts?.includes(swap.targetShiftType)) score += 30;
    if (myPrefs.preferredDays?.includes(dayName)) score += 20;
    
    if (score >= 80) return '🔥 Great Match';
    if (score >= 60) return '✨ Good Match';
    return '👌 Okay Match';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <RefreshCw className="text-blue-600" size={24} />
            Swap Marketplace
          </h3>
          <p className="text-zinc-500 text-sm mt-1">Trade shifts with your teammates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={18} />
          Post Swap Request
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="text-blue-600 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How Swap Marketplace Works</h4>
            <p className="text-xs text-blue-700">
              Post your shifts to swap, browse available requests, and accept swaps that work for you. All swaps are instant once accepted.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'available'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Available Swaps ({availableSwaps.length})
        </button>
        <button
          onClick={() => setActiveTab('myRequests')}
          className={`px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'myRequests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableSwaps.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
              <RefreshCw className="mx-auto text-zinc-300 mb-3" size={48} />
              <p className="text-zinc-500 font-medium">No swap requests available</p>
              <p className="text-zinc-400 text-sm mt-1">Be the first to post one!</p>
            </div>
          ) : (
            availableSwaps.map(swap => {
              const requester = users.find(u => u.id === swap.requesterId);
              if (!requester) return null;

              return (
                <div key={swap.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <img src={requester.avatar} alt={requester.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-zinc-900">{requester.name}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {getMatchScore(swap)}
                        </span>
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getShiftColor(swap.targetShiftType)} mb-3`}>
                        <span className="text-lg">{getShiftIcon(swap.targetShiftType)}</span>
                        <div>
                          <div className="text-sm font-bold">{swap.targetShiftType} Shift</div>
                          <div className="text-xs">
                            {new Date(swap.targetShiftDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>

                      {swap.reason && (
                        <div className="flex items-start gap-2 text-sm text-zinc-600 mb-3">
                          <MessageSquare size={14} className="mt-0.5 text-zinc-400" />
                          <span className="italic">"{swap.reason}"</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock size={12} />
                        Posted {new Date(swap.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptSwap(swap)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      <Check size={16} />
                      Accept
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'myRequests' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
              <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
              <p className="text-zinc-500 font-medium">No swap requests posted</p>
              <p className="text-zinc-400 text-sm mt-1">Click "Post Swap Request" to get started</p>
            </div>
          ) : (
            myRequests.map(swap => {
              const getStatusBadge = () => {
                switch (swap.status) {
                  case 'PENDING':
                    return <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">Pending</span>;
                  case 'ACCEPTED':
                    const acceptor = users.find(u => u.id === swap.respondedBy);
                    return <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Accepted by {acceptor?.name}</span>;
                  case 'REJECTED':
                    return <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">Rejected</span>;
                }
              };

              return (
                <div key={swap.id} className="bg-white border border-zinc-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {getStatusBadge()}
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getShiftColor(swap.targetShiftType)} mb-3`}>
                        <span className="text-lg">{getShiftIcon(swap.targetShiftType)}</span>
                        <div>
                          <div className="text-sm font-bold">{swap.targetShiftType} Shift</div>
                          <div className="text-xs">
                            {new Date(swap.targetShiftDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>

                      {swap.reason && (
                        <div className="flex items-start gap-2 text-sm text-zinc-600 mb-2">
                          <MessageSquare size={14} className="mt-0.5 text-zinc-400" />
                          <span className="italic">"{swap.reason}"</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock size={12} />
                        Posted {new Date(swap.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>

                    {swap.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelSwap(swap.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Swap Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h4 className="text-xl font-bold text-zinc-900 mb-4">Post Swap Request</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Select Your Shift to Swap</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a shift...</option>
                  {myShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.type} - {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why do you want to swap this shift?"
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedShift('');
                    setReason('');
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSwap}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Post Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
