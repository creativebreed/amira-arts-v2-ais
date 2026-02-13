"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  error: <AlertTriangle size={18} />,
};

const styleMap = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  warning: 'bg-amber-50 border-[#D4145A] text-amber-900',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
  error: 'bg-red-50 border-red-400 text-red-800',
};

const iconColorMap = {
  success: 'text-emerald-500',
  warning: 'text-[#D4145A]',
  info: 'text-blue-500',
  error: 'text-red-500',
};

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastData; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`pointer-events-auto flex items-start gap-3 px-5 py-4 border-l-4 rounded-lg shadow-xl ${styleMap[toast.type]}`}
    >
      <span className={`mt-0.5 shrink-0 ${iconColorMap[toast.type]}`}>{iconMap[toast.type]}</span>
      <p className="text-sm font-medium leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

export default Toast;
