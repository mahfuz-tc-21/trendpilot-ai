import { create } from "zustand";

/**
 * Global Zustand store for displaying custom confirmation dialogs.
 * Centralizes UI confirmation states without polluting pages with local boolean flags.
 */
export const useConfirmStore = create((set) => ({
  isOpen: false,
  title: "Confirm Action",
  description: "Are you sure you want to proceed? This action cannot be undone.",
  confirmLabel: "Proceed",
  confirmType: "danger", // danger, primary
  onConfirm: null,
  onCancel: null,

  showConfirm: ({
    title,
    description,
    confirmLabel,
    confirmType = "danger",
    onConfirm,
    onCancel
  }) => {
    set({
      isOpen: true,
      title: title || "Confirm Action",
      description: description || "Are you sure you want to proceed? This action cannot be undone.",
      confirmLabel: confirmLabel || "Proceed",
      confirmType,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        set({ isOpen: false });
      },
      onCancel: () => {
        if (onCancel) onCancel();
        set({ isOpen: false });
      }
    });
  },

  closeConfirm: () => {
    set({ isOpen: false });
  }
}));
