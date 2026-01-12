'use client';

import React, { useState } from 'react';
import { User, Shift, SwapRequest, ShiftType } from '@/lib/types';
import { ArrowLeftRight, Check, X, Calendar, Clock, User as UserIcon, Sun, Sunset, Moon, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

interface SwapMarketProps {
  currentUser: User;
  shifts: Shift[];
  swaps: SwapRequest[];
  setSwaps: (swaps: SwapRequest[]) => void;
  setShifts: (shifts: Shift[]) => void;
  users: User[];
  onRefresh: () => void;
}

export const SwapMarket: React.FC<SwapMarketProps> = ({
  currentUser,
  shifts,
  swaps,
  setSwaps,
  setShifts,
  users,
  onRefresh
}) => {
  const [selectedShift, setSelectedShift] = useState<string>('');

  const myShifts = shifts.filter(s => s.userId === currentUser.id && new Date(s.date) >= new Date());
  const incomingRequests = swaps.filter(
    s => s.status === 'PENDING' && (s.recipientId === currentUser.id || (!s.recipientId && s.requesterId !== currentUser.id))
  );

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: 
        return <Sun className="text-amber-600" size={16} />;
      case ShiftType.EVENING: 
        return <Sunset className="text-blue-600" size={16} />;
      case ShiftType.NIGHT: 
        return <Moon className="text-slate-200" size={16} />;
    }
  };

  const getShiftColor = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: 
        return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-900';
      case ShiftType.EVENING: 
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-900';
      case ShiftType.NIGHT: 
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white';
    }
  };

  const getShiftTime = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return '9AM - 6PM';
      case ShiftType.EVENING: return '5PM - 2AM';
      case ShiftType.NIGHT: return '1AM - 10AM';
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedShift) return;
    
    try {
      const docRef = await addDoc(collection(db, 'swap_requests'), {
        requesterId: currentUser.id,
        shiftId: selectedShift,
        status: 'PENDING',
        acceptedBy: null,
        createdAt: new Date().toISOString(),
      });

      const newSwap: SwapRequest = {
        id: docRef.id,
        requesterId: currentUser.id,
        targetShiftId: selectedShift,
        targetShiftDate: shifts.find(s => s.id === selectedShift)?.date || '',
        targetShiftType: shifts.find(s => s.id === selectedShift)?.type || ShiftType.MORNING,
        recipientId: undefined,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      setSwaps([...swaps, newSwap]);
      setSelectedShift('');
    } catch (error: any) {
      console.error('Failed to create swap', error);
    }
  };

  const handleAction = async (swap: SwapRequest, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      // Update swap request status
      const swapRef = doc(db, 'swap_requests', swap.id);
      await updateDoc(swapRef, {
        status: action,
        acceptedBy: action === 'ACCEPTED' ? currentUser.id : null,
        updatedAt: new Date().toISOString(),
      });

      // If accepted, update the shift owner
      if (action === 'ACCEPTED') {
        const shiftRef = doc(db, 'shifts', swap.targetShiftId);
        await updateDoc(shiftRef, {
          userId: currentUser.id,
        });

        // Update local state
        const newShifts = shifts.map(s => 
          s.id === swap.targetShiftId ? { ...s, userId: currentUser.id } : s
        );
        setShifts(newShifts);
      }

      // Update local swaps state
      const updatedSwaps = swaps.map(s => 
        s.id === swap.id ? { ...s, status: action } : s
      );
      
      // Refresh all data from server
      onRefresh();
      setSwaps(updatedSwaps);
    } catch (error: any) {
      console.error('Failed to process swap', error);
    }
  };

  return (
    <div className="max-w-6xl space-y-10">
      {/* Offer Shift Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl border border-blue-100 p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-xl">
            <RefreshCw className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Offer a Shift</h2>
            <p className="text-zinc-600">Put your shift up for swapping</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
          {myShifts.length > 0 ? (
            <>
              <label className="block text-sm font-semibold text-zinc-700 mb-3">Select Your Shift</label>
              <div className="flex gap-3">
                <select 
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-300 text-zinc-900 px-5 py-4 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-sm font-medium"
                >
                  <option value="">Choose a shift to offer...</option>
                  {myShifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {s.type} • {getShiftTime(s.type)}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleCreateRequest}
                  disabled={!selectedShift}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-zinc-200 disabled:to-zinc-200 disabled:text-zinc-400 text-white px-10 py-4 rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <ArrowLeftRight size={18} />
                  Post Swap
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
              <p className="text-zinc-500 font-medium">No upcoming shifts available to swap</p>
            </div>
          )}
        </div>

        {/* Your Active Requests */}
        {swaps.filter(s => s.requesterId === currentUser.id && s.status === 'PENDING').length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-zinc-700 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              Your Active Requests
            </h3>
            <div className="space-y-2">
              {swaps.filter(s => s.requesterId === currentUser.id && s.status === 'PENDING').map(swap => {
                const shift = shifts.find(sh => sh.id === swap.targetShiftId);
                if (!shift) return null;
                
                return (
                  <div key={swap.id} className={`flex justify-between items-center px-4 py-3 rounded-xl border ${getShiftColor(shift.type)}`}>
                    <div className="flex items-center gap-3">
                      {getShiftIcon(shift.type)}
                      <span className="text-sm font-semibold">
                        {new Date(shift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {shift.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-full">PENDING</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Marketplace Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
            <UserIcon className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Shift Marketplace</h2>
            <p className="text-zinc-600">Pick up shifts from your teammates</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.length > 0 ? incomingRequests.map(swap => {
                const shift = shifts.find(s => s.id === swap.targetShiftId);
                const requester = users.find(u => u.id === swap.requesterId);
                if (!shift || !requester) return null;

                return (
                    <div key={swap.id} className="group bg-white border-2 border-zinc-200 rounded-2xl p-6 transition-all hover:border-blue-300 hover:shadow-xl">
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="relative">
                              <img src={requester.avatar} alt="" className="w-12 h-12 rounded-full ring-2 ring-white shadow-md" />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                                <RefreshCw className="text-white" size={10} />
                              </div>
                            </div>
                            <div>
                                <p className="text-base font-bold text-zinc-900">{requester.name}</p>
                                <p className="text-xs text-zinc-500 font-medium">Looking to swap shift</p>
                            </div>
                        </div>
                        
                        {/* Shift Details Card */}
                        <div className={`mb-5 px-4 py-4 rounded-xl border-2 ${getShiftColor(shift.type)}`}>
                            <div className="flex items-center gap-3 mb-2">
                                {getShiftIcon(shift.type)}
                                <span className="text-sm font-bold">{shift.type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
                                <Calendar size={12} />
                                <span>{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold opacity-80 mt-1">
                                <Clock size={12} />
                                <span>{getShiftTime(shift.type)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button 
                              onClick={() => handleAction(swap, 'ACCEPTED')} 
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                              <Check size={18} />
                              Accept
                            </button>
                            <button 
                              onClick={() => handleAction(swap, 'REJECTED')} 
                              className="flex-1 bg-white border-2 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 text-zinc-700 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <X size={18} />
                              Decline
                            </button>
                        </div>
                    </div>
                );
            }) : (
                <div className="col-span-2 text-center py-16 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border-2 border-dashed border-zinc-200">
                    <ArrowLeftRight className="mx-auto text-zinc-300 mb-4" size={56} />
                    <p className="text-zinc-400 font-semibold text-lg">No swap requests available</p>
                    <p className="text-zinc-400 text-sm mt-1">Check back later for opportunities</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
