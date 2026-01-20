'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, Settings, RefreshCw, LogOut, FileText, Menu, X, TrendingUp, CheckCircle2, MessageSquare, Zap, Activity } from 'lucide-react';
import { User } from '@/lib/types';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  users: User[];
  setCurrentUser: (user: User) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  users: _users,
  setCurrentUser: _setCurrentUser
}) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  // Main navigation - simplified to 4 core tabs
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'calendar', icon: Calendar, label: 'Schedule' },
    { id: 'swaps', icon: RefreshCw, label: 'Swaps' },
    { id: 'preferences', icon: Settings, label: 'Settings' },
  ];

  // Admin-only tabs - simplified to 1 admin hub
  if (currentUser.isAdmin) {
    navItems.push(
      { id: 'admin', icon: Users, label: 'Admin' }
    );
  }

  const handleNavClick = (itemId: string) => {
    setActiveTab(itemId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-18 flex items-center justify-between px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        {/* Brand */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center justify-center bg-zinc-900 px-3 py-2 rounded-lg shadow-sm">
            <img
              src="/textlogo-light.webp"
              alt="SoC Scheduler"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>
          <div className="h-8 w-px bg-zinc-200 hidden sm:block"></div>
        </div>

        {/* Desktop & Tablet Navigation - Hidden on Small Mobile */}
        <div className="hidden sm:flex items-center justify-center gap-1 overflow-x-auto flex-1 mx-4 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAdminItem = item.id === 'admin';
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 text-xs transition-all rounded-lg font-semibold flex items-center gap-1.5 flex-shrink-0 ${isAdminItem
                  ? activeTab === item.id
                    ? 'text-white bg-red-600 shadow-sm'
                    : 'text-red-600 bg-red-50 hover:bg-red-100'
                  : activeTab === item.id
                    ? 'text-white bg-blue-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex text-zinc-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-blue-50 object-cover"
            />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Only visible on smallest screens */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-zinc-200 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.filter(item => item.id !== 'admin').map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSpecial = item.id === 'admin';

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex flex-col items-center justify-center w-full relative group"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive
                  ? isSpecial ? 'bg-red-50 text-red-600 scale-110' : 'bg-blue-50 text-blue-600 scale-110'
                  : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight transition-colors duration-300 ${isActive
                  ? isSpecial ? 'text-red-600' : 'text-blue-600'
                  : 'text-zinc-500'
                  }`}>
                  {item.label}
                </span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <div className={`absolute -top-1 w-1 h-1 rounded-full ${isSpecial ? 'bg-red-600' : 'bg-blue-600'} animate-pulse`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

