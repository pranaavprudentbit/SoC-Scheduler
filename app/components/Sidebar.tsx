'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, Settings, RefreshCw, ShieldCheck, LogOut, FileText, Menu, X, TrendingUp, CheckCircle2, MessageSquare, Clock, Zap, Download } from 'lucide-react';
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

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'calendar', icon: Calendar, label: 'Schedule' },
    { id: 'clock', icon: Clock, label: 'Clock' },
    { id: 'history', icon: TrendingUp, label: 'History' },
    { id: 'performance', icon: CheckCircle2, label: 'Performance' },
    { id: 'notes', icon: MessageSquare, label: 'Notes' },
    { id: 'availability', icon: Calendar, label: 'Availability' },
    { id: 'coverage', icon: Zap, label: 'Coverage' },
    { id: 'recommendations', icon: TrendingUp, label: 'Suggestions' },
    { id: 'swaps', icon: RefreshCw, label: 'Swaps' },
    { id: 'leaves', icon: FileText, label: 'Leaves' },
    { id: 'preferences', icon: Settings, label: 'Settings' },
  ];

  if (currentUser.isAdmin) {
    navItems.push({ id: 'admin', icon: Users, label: 'Team' });
  }

  const handleNavClick = (itemId: string) => {
    setActiveTab(itemId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-18 flex items-center justify-between px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center rounded-xl shadow-lg">
             <ShieldCheck className="text-white" size={18} />
          </div>
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">SoC Scheduler</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 text-sm transition-all rounded-xl font-semibold flex items-center gap-2 ${
                  activeTab === item.id
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full px-4 py-3 text-sm transition-all rounded-xl font-semibold flex items-center gap-3 ${
                      activeTab === item.id
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
