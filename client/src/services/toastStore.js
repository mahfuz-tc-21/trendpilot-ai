import { create } from "zustand";

/**
 * Lightweight, global Zustand store for displaying premium toast notifications.
 * Supports "success", "error", and "info" notification types.
 */
export const useToastStore = create((set) => ({
  toasts: [],
  showToast: (message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));
