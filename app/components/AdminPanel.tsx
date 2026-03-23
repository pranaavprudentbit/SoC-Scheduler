'use client';

import React, { useState, useEffect } from 'react';
import { User, Shift, LeaveRequest } from '@/lib/types';
import { AlertTriangle, LayoutDashboard, Users, CalendarDays, FileText, BarChart3, Settings, Activity, Zap } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { AdminCalendarShiftManager } from './AdminCalendarShiftManager';
import { AdminLeaveManagement } from './AdminLeaveManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ShiftConfigPanel } from './ShiftConfigPanel';
import { ActivityLog } from './ActivityLog';
import { TeamCoverageHeatmap } from './TeamCoverageHeatmap';

interface AdminPanelProps {
  users: User[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  shifts,
  leaveRequests,
  currentUser,
  onRefresh
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'shifts' | 'users' | 'leaves' | 'activity' | 'coverage' | 'config'>('overview');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'PENDING').length;

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
        <div className="bg-red-50 p-6 rounded-[2.5rem] border-2 border-red-100 shadow-lg shadow-red-50">
          <AlertTriangle size={48} className="text-red-500 mx-auto" strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Use a Computer</h2>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xs">
            This page is too big for your phone. Please use a computer.
          </p>
        </div>
        <div className="pt-4">
          <div className="px-4 py-2 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full">
            Status: Access Restricted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-2 pb-6 border-b border-zinc-200 text-center">
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">Dashboard</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Manage everything here</p>
      </div>

      {/* Navigation Tabs - Modern Segmented Control */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-6 border-b border-zinc-200">
        <div className="flex flex-wrap bg-zinc-100 p-1 rounded-2xl border border-zinc-200 justify-center gap-1">
          <button
            onClick={() => setActiveSection('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'overview'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <LayoutDashboard size={16} strokeWidth={activeSection === 'overview' ? 2.5 : 2} />
            Overview
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'analytics'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <BarChart3 size={16} strokeWidth={activeSection === 'analytics' ? 2.5 : 2} />
            Analytics
          </button>

          <button
            onClick={() => setActiveSection('shifts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'shifts'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <CalendarDays size={16} strokeWidth={activeSection === 'shifts' ? 2.5 : 2} />
            Shifts
          </button>


          <button
            onClick={() => setActiveSection('leaves')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black relative transition-all duration-300 ${activeSection === 'leaves'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <FileText size={16} strokeWidth={activeSection === 'leaves' ? 2.5 : 2} />
            Leaves
            {pendingLeaves > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {pendingLeaves}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'users'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <Users size={16} strokeWidth={activeSection === 'users' ? 2.5 : 2} />
            Users
          </button>

          <button
            onClick={() => setActiveSection('coverage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'coverage'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <Zap size={16} strokeWidth={activeSection === 'coverage' ? 2.5 : 2} />
            Coverage
          </button>


          <button
            onClick={() => setActiveSection('activity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'activity'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <Activity size={16} strokeWidth={activeSection === 'activity' ? 2.5 : 2} />
            Logs
          </button>

          <button
            onClick={() => setActiveSection('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === 'config'
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200'
              : 'text-zinc-500 hover:text-zinc-900'
              }`}
          >
            <Settings size={16} strokeWidth={activeSection === 'config' ? 2.5 : 2} />
            Timings
          </button>
        </div>
      </div>



      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-zinc-700 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
              <Zap size={120} className="text-blue-500" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">SOC Operations Management</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-lg">Manage team deployments, monitor coverage distributions, and refine operational configurations from this centralized command centre.</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl">Triple Staffing Enabled</span>
              </div>
            </div>
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
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">{Math.round((shifts.length / (users.length * 5)) * 100)}%</div>
              <div className="text-xs text-zinc-500 mt-2 font-semibold uppercase tracking-wider">Utilization</div>
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

      {activeSection === 'activity' && (
        <ActivityLog currentUser={currentUser} />
      )}

      {activeSection === 'coverage' && (
        <TeamCoverageHeatmap shifts={shifts} />
      )}

    </div>
  );
};
