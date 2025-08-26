"use client";

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'pending' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getStyles = () => {
    const base = 'flex items-center gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 max-w-md';
    const visibility = isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2';

    switch (toast.type) {
      case 'success':
        return `${base} ${visibility} bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200`;
      case 'error':
        return `${base} ${visibility} bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200`;
      case 'pending':
        return `${base} ${visibility} bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200`;
      case 'info':
        return `${base} ${visibility} bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200`;
      default:
        return `${base} ${visibility} bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200`;
    }
  };

  return (
    <div className={getStyles()}>
      <span className="text-xl flex-shrink-0">{getIcon()}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{toast.title}</div>
        {toast.message && (
          <div className="text-sm opacity-90 mt-1">{toast.message}</div>
        )}
      </div>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="ml-2 text-lg opacity-60 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Toast Context and Hook

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience hooks for different toast types
export function useTransactionToast() {
  const { addToast, updateToast, removeToast } = useToast();

  const showPendingToast = useCallback(
    (title: string, message?: string) => {
      return addToast({
        type: 'pending',
        title,
        message,
        duration: Infinity, // Don't auto-remove pending toasts
      });
    },
    [addToast]
  );

  const showSuccessToast = useCallback(
    (title: string, message?: string, action?: Toast['action']) => {
      return addToast({
        type: 'success',
        title,
        message,
        action,
        duration: 5000,
      });
    },
    [addToast]
  );

  const showErrorToast = useCallback(
    (title: string, message?: string, action?: Toast['action']) => {
      return addToast({
        type: 'error',
        title,
        message,
        action,
        duration: 7000, // Show errors longer
      });
    },
    [addToast]
  );

  const updateToSuccess = useCallback(
    (id: string, title: string, message?: string, action?: Toast['action']) => {
      updateToast(id, {
        type: 'success',
        title,
        message,
        action,
        duration: 5000,
      });
    },
    [updateToast]
  );

  const updateToError = useCallback(
    (id: string, title: string, message?: string, action?: Toast['action']) => {
      updateToast(id, {
        type: 'error',
        title,
        message,
        action,
        duration: 7000,
      });
    },
    [updateToast]
  );

  return {
    showPendingToast,
    showSuccessToast,
    showErrorToast,
    updateToSuccess,
    updateToError,
    removeToast,
  };
}
