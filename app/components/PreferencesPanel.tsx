'use client';

import React, { useState } from 'react';
import { User, ShiftType } from '@/lib/types';
import { Save, Clock, Calendar, X, Plus, Moon, Sun, Sunset } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

interface PreferencesPanelProps {
  currentUser: User;
  onUpdate: (user: User) => void;
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ currentUser, onUpdate }) => {
  const [prefs, setPrefs] = useState(currentUser.preferences);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');

  const toggleShiftType = (type: ShiftType) => {
    const current = prefs.preferredShifts;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setPrefs({ ...prefs, preferredShifts: updated });
  };

  const addBlackoutDate = () => {
    if (newDate && !prefs.unavailableDates.includes(newDate)) {
      setPrefs({...prefs, unavailableDates: [...prefs.unavailableDates, newDate]});
      setNewDate('');
    }
  };

  const removeBlackoutDate = (date: string) => {
    setPrefs({...prefs, unavailableDates: prefs.unavailableDates.filter(d => d !== date)});
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        preferredDays: prefs.preferredDays,
        preferredShifts: prefs.preferredShifts,
        unavailableDates: prefs.unavailableDates,
        updatedAt: new Date().toISOString()
      });

      onUpdate({ ...currentUser, preferences: prefs });
    } catch (error: any) {
      console.error('Failed to update preferences', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftIcon = (type: ShiftType) => {
    switch(type) {
      case ShiftType.MORNING: return <Sun size={20} />;
      case ShiftType.EVENING: return <Sunset size={20} />;
      case ShiftType.NIGHT: return <Moon size={20} />;
    }
  };

  const getShiftTime = (type: ShiftType) => {
    switch(type) {
      case ShiftType.MORNING: return '9:00 AM - 6:00 PM';
      case ShiftType.EVENING: return '5:00 PM - 2:00 AM';
      case ShiftType.NIGHT: return '1:00 AM - 10:00 AM';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 mb-1">Preferences</h2>
          <p className="text-zinc-500">Optional preferences - admins will consider them when generating schedules</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl ${
              loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
        >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="space-y-8">
        {/* Preferred Shifts */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-zinc-900">Preferred Shifts</h3>
          </div>
          <p className="text-zinc-500 mb-6 text-sm">Select the shifts you prefer to work. The AI scheduler will prioritize these when generating your schedule.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => (
                <button
                    key={type}
                    onClick={() => toggleShiftType(type)}
                    className={`p-6 rounded-xl text-left border-2 transition-all ${
                        prefs.preferredShifts.includes(type)
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${prefs.preferredShifts.includes(type) ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'}`}>
                        {getShiftIcon(type)}
                      </div>
                      {prefs.preferredShifts.includes(type) && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h4 className={`font-bold text-lg mb-1 ${prefs.preferredShifts.includes(type) ? 'text-blue-900' : 'text-zinc-900'}`}>
                      {type}
                    </h4>
                    <p className={`text-sm ${prefs.preferredShifts.includes(type) ? 'text-blue-600' : 'text-zinc-500'}`}>
                      {getShiftTime(type)}
                    </p>
                </button>
            ))}
          </div>
          
          {prefs.preferredShifts.length === 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">💡 No preferences selected. The scheduler will assign you any available shift.</p>
            </div>
          )}
        </div>

        {/* Blackout Dates */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-red-600" size={24} />
            <h3 className="text-xl font-bold text-zinc-900">Blackout Dates</h3>
          </div>
          <p className="text-zinc-500 mb-6 text-sm">Add dates when you are unavailable. You will not be scheduled on these days.</p>
          
          <div className="flex gap-3 mb-6">
            <input 
                type="date" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 bg-zinc-50 border border-zinc-300 text-zinc-900 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                min={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={addBlackoutDate}
              disabled={!newDate}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              <Plus size={18} /> Add Date
            </button>
          </div>
          
          {prefs.unavailableDates.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Your Blackout Dates ({prefs.unavailableDates.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prefs.unavailableDates.sort().map(date => (
                      <div 
                        key={date} 
                        className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl group hover:bg-red-100 transition-colors"
                      >
                        <span className="font-medium">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <button
                          onClick={() => removeBlackoutDate(date)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-200 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-zinc-50 border border-zinc-200 border-dashed rounded-xl text-center">
              <p className="text-zinc-400 text-sm">No blackout dates set. Add dates above when you're unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
