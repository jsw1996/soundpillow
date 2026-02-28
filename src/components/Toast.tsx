import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

/**
 * Show a toast notification from anywhere in the app.
 */
export function showToast(message: string, type: Toast['type'] = 'success') {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
}

/**
 * Toast container component — render once at the app root.
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 2500);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <div className="fixed top-12 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`px-5 py-2.5 rounded-2xl backdrop-blur-xl shadow-lg text-sm font-semibold pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-primary/90 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-white/15 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
