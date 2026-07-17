import { ShieldAlert, Settings, X, ZapOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ApiLimitModal({ isOpen, onClose, errorMessage }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isRateLimit = errorMessage?.toLowerCase().includes("quota") || 
                      errorMessage?.toLowerCase().includes("429") || 
                      errorMessage?.toLowerCase().includes("limit") || 
                      errorMessage?.toLowerCase().includes("exhausted");

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md border border-zinc-800 bg-zinc-900 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
          {isRateLimit ? (
            <ZapOff className="h-7 w-7 text-amber-500" />
          ) : (
            <ShieldAlert className="h-7 w-7 text-amber-500" />
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white font-heading">
            {isRateLimit ? "API Limit Reached ⚠️" : "API Connection Error ⚠️"}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed text-center px-2">
            {isRateLimit
              ? "You have exceeded the free tier quota of your Google Gemini API Key. Google restricts free keys to a maximum of 15 requests per minute and 20 requests per day."
              : errorMessage || "An unexpected error occurred while communicating with the Google Gemini API."}
          </p>
        </div>

        {/* Suggestion / Details */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl text-[11px] text-zinc-400 text-left leading-relaxed">
          <span className="font-bold text-white block mb-1">Recommendations:</span>
          <div className="space-y-1">
            <p>• Wait a few minutes or hours for your free tier quota to reset.</p>
            <p>• Upgrade your key to a pay-as-you-go plan in Google AI Studio.</p>
            <p>• Provide a fresh, custom Gemini API key in your account settings.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-zinc-300 dark:border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              navigate("/settings");
            }}
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            Configure Key
          </button>
        </div>
      </div>
    </div>
  );
}
