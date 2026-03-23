'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <XCircle className="text-rose-500" size={20} />,
    warning: <AlertCircle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgStyles = {
    success: 'bg-emerald-50/90 border-emerald-100 shadow-emerald-500/10',
    error: 'bg-rose-50/90 border-rose-100 shadow-rose-500/10',
    warning: 'bg-amber-50/90 border-amber-100 shadow-amber-500/10',
    info: 'bg-blue-50/90 border-blue-100 shadow-blue-500/10',
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 pr-10 rounded-2xl border backdrop-blur-md shadow-2xl 
        pointer-events-auto transition-all duration-300 transform
        ${isExiting ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}
        ${bgStyles[type]}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="text-sm font-bold text-zinc-900 leading-tight">{message}</p>
      <button
        onClick={handleClose}
        className="absolute top-1/2 -right-1 -translate-y-1/2 p-2 hover:bg-black/5 rounded-full transition-colors mr-2"
        aria-label="Close"
      >
        <X size={14} className="text-zinc-400" />
      </button>
      
      {/* Self-destruct indicator */}
      <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-[5000ms] w-0" />
    </div>
  );
};
