'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-red-600" size={24} />,
          button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
          bg: 'bg-red-50'
        };
      case 'info':
        return {
          icon: <AlertTriangle className="text-blue-600" size={24} />,
          button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
          bg: 'bg-blue-50'
        };
      default:
        return {
          icon: <AlertTriangle className="text-amber-600" size={24} />,
          button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          bg: 'bg-amber-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${styles.bg}`}>
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                {title}
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                {message}
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-zinc-50 flex items-center justify-end gap-3 px-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
