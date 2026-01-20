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
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-18 flex items-center justify-between px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        {/* Brand */}
        {/* Brand */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center justify-center bg-zinc-900 px-3 py-2 rounded-lg shadow-sm">
            <img
              src="/textlogo-light.webp"
              alt="SoC Scheduler"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>
          <div className="h-10 w-px bg-black hidden sm:block"></div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center justify-center gap-1 overflow-x-auto flex-1 mx-4 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAdminItem = item.id === 'admin';
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-2 py-1.5 text-xs transition-all rounded-lg font-medium flex items-center gap-1.5 flex-shrink-0 ${isAdminItem
                  ? activeTab === item.id
                    ? 'text-white bg-gradient-to-r from-red-600 to-red-700 shadow-md ring-2 ring-red-200'
                    : 'text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200'
                  : activeTab === item.id
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
          <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>

          <button
            onClick={handleLogout}
            className="hidden sm:flex text-zinc-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-zinc-600 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-100 rounded-lg"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* User Avatar - Desktop */}
          <div className="hidden sm:flex items-center gap-2 pl-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full ring-2 ring-blue-100"
            />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 sm:top-18 left-0 right-0 bg-white border-b border-zinc-200 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isAdminItem = item.id === 'admin';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full px-4 py-3 text-sm transition-all rounded-xl font-semibold flex items-center gap-3 ${isAdminItem
                      ? activeTab === item.id
                        ? 'text-white bg-gradient-to-r from-red-600 to-red-700 shadow-lg ring-2 ring-red-200'
                        : 'text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200'
                      : activeTab === item.id
                        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}

              <div className="h-px bg-zinc-200 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-sm transition-all rounded-xl font-semibold flex items-center gap-3 text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
