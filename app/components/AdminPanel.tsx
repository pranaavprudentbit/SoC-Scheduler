'use client';

import React, { useState } from 'react';
import { User, Shift, LeaveRequest } from '@/lib/types';
import { AlertTriangle, BrainCircuit, Users, CalendarDays, FileText, BarChart3, Settings } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { AdminCalendarShiftManager } from './AdminCalendarShiftManager';
import { AdminLeaveManagement } from './AdminLeaveManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BulkOperations } from './BulkOperations';
import { ShiftConfigPanel } from './ShiftConfigPanel';

interface AdminPanelProps {
  users: User[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  currentUser: User;
  setShifts: (shifts: Shift[]) => void;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, 
  shifts, 
  leaveRequests,
  currentUser,
  setShifts, 
  onRefresh 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'shifts' | 'bulk' | 'users' | 'leaves' | 'config'>('overview');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch shift configuration
      const { doc: docFunc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const configDoc = await getDoc(docFunc(db, 'system_config', 'shift_timings'));
      const shiftConfig = configDoc.exists() ? configDoc.data() : null;
      
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users, 
          startDate: today, 
          days: 7,
          shiftConfig 
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate schedule');
      
      const newShifts = await response.json();
      setShifts(newShifts);
      onRefresh();
    } catch (e) {
      setError("Failed to generate schedule.");
    } finally {
      setIsGenerating(false);
    }
  };

  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'PENDING').length;
  const manualShifts = shifts.filter(s => s.manuallyCreated).length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-2">Admin Dashboard</h2>
        <p className="text-zinc-500">Full control over schedules, users, and leave requests</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-4">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
            activeSection === 'overview'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <BrainCircuit size={16} />
          Overview
        </button>
        <button
          onClick={() => setActiveSection('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
            activeSection === 'analytics'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
        <button
          onClick={() => setActiveSection('shifts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
            activeSection === 'shifts'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <CalendarDays size={16} />
          Shifts
        </button>
        <button
          onClick={() => setActiveSection('bulk')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
            activeSection === 'bulk'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <BarChart3 size={16} />
          Bulk Ops
        </button>
        <button
          onClick={() => setActiveSection('leaves')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all relative ${
            activeSection === 'leaves'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <FileText size={16} />
          Leave Requests
          {pendingLeaves > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {pendingLeaves}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
            activeSection === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <Users size={16} />
          Users
        </button>
        <button
          onClick={() => setActiveSection('config')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold transition-all ${
            activeSection === 'config'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <Settings size={16} />
          Timings
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 border border-blue-500 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">AI Schedule Generator</h3>
              <p className="text-sm text-blue-100 mb-1">Automatically generate balanced schedules for the team</p>
              <p className="text-xs text-blue-200 mb-1">✓ Respects manual shifts (won't override 🔒 protected shifts)</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">3 workers/day</span>
                <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">5 shifts/week</span>
                <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">Smart rest</span>
                <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">Protected shifts</span>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-bold transition-all shadow-xl ${
                isGenerating 
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50 hover:shadow-2xl transform hover:scale-105'
              }`}
            >
              <BrainCircuit size={20} />
              <span className="hidden sm:inline">{isGenerating ? "Generating..." : "Generate Schedule"}</span>
              <span className="sm:hidden">Generate</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">{users.length}</div>
              <div className="text-xs text-zinc-500 mt-2 font-semibold uppercase tracking-wider">Team Members</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent">{shifts.length}</div>
              <div className="text-xs text-zinc-500 mt-2 font-semibold uppercase tracking-wider">Total Shifts</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-amber-600 to-amber-700 bg-clip-text text-transparent">{pendingLeaves}</div>
              <div className="text-xs text-zinc-500 mt-2 font-semibold uppercase tracking-wider">Pending Leaves</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-1 text-3xl sm:text-4xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {manualShifts}
                <span className="text-base">🔒</span>
              </div>
              <div className="text-xs text-zinc-500 mt-2 font-semibold uppercase tracking-wider">Protected Shifts</div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'analytics' && (
        <AnalyticsDashboard 
          users={users} 
          shifts={shifts} 
        />
      )}

      {activeSection === 'shifts' && (
        <AdminCalendarShiftManager 
          users={users} 
          shifts={shifts} 
          onRefresh={onRefresh} 
        />
      )}

      {activeSection === 'bulk' && (
        <BulkOperations 
          users={users} 
          shifts={shifts} 
          onRefresh={onRefresh} 
        />
      )}

      {activeSection === 'leaves' && (
        <AdminLeaveManagement
          users={users}
          leaveRequests={leaveRequests}
          currentUser={currentUser}
          onRefresh={onRefresh}
        />
      )}

      {activeSection === 'users' && (
        <UserManagement 
          users={users} 
          onRefresh={onRefresh} 
        />
      )}

      {activeSection === 'config' && (
        <ShiftConfigPanel />
      )}
    </div>
  );
};
