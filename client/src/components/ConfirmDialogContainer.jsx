import { useConfirmStore } from "../services/confirmStore.js";
import { X, AlertTriangle, HelpCircle } from "lucide-react";

/**
 * Global overlay dialog wrapper listening to the useConfirmStore.
 * Provides a highly polished, responsive modal popup with dark-mode/light-mode overrides.
 */
export default function ConfirmDialogContainer() {
  const { isOpen, title, description, confirmLabel, confirmType, onConfirm, onCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Dialog Card */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full border flex items-center justify-center flex-shrink-0 ${
                confirmType === "danger"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              }`}
            >
              {confirmType === "danger" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <HelpCircle className="h-5 w-5" />
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white font-heading text-left">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Description */}
        <p className="text-sm text-zinc-400 leading-relaxed text-left">
          {description}
        </p>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors cursor-pointer ${
              confirmType === "danger"
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/10"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/10"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
