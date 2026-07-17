import { useToastStore } from "../services/toastStore.js";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

/**
 * Beautiful, floating toast container placed fixed at the bottom-right.
 * Listens to the global useToastStore and animates entrance and transitions.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-100 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl border flex items-start gap-3 shadow-lg transition-all duration-300 animate-fade-in-up ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : toast.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-455"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          {toast.type === "info" && (
            <Info className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs font-semibold leading-relaxed text-left">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-500 hover:text-zinc-300 cursor-pointer flex-shrink-0"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
