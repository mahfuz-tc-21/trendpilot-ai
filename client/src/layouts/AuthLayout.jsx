import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../services/authStore.js";
import { ArrowLeft, ShieldCheck } from "lucide-react";

/**
 * Layout wrapper for authentication pages (Login and Register).
 * Redirects to the homepage if the user is already authenticated.
 * Renders a centered layout with a top header navigation, background ambient blobs,
 * dot pattern grids, and a secured bottom footer matching the user's mockup.
 */
export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-950 py-12 px-4 select-none relative overflow-hidden">
      {/* Custom Styles Injection */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.6; transform: scale(1.1) translate(15px, -15px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 10s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Ambient background blur blobs */}
      <div className="absolute top-1/4 -left-32 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-3xl animate-pulse-glow -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-3xl animate-pulse-glow -z-10" />

      {/* SVG Dot Grids */}
      <div className="absolute top-[15%] left-[8%] opacity-35 -z-10 hidden lg:block">
        <svg width="60" height="60" className="text-zinc-800" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="10" cy="10" r="3.5" />
          <circle cx="35" cy="10" r="3.5" />
          <circle cx="60" cy="10" r="3.5" />
          <circle cx="85" cy="10" r="3.5" />
          <circle cx="10" cy="35" r="3.5" />
          <circle cx="35" cy="35" r="3.5" />
          <circle cx="60" cy="35" r="3.5" />
          <circle cx="85" cy="35" r="3.5" />
          <circle cx="10" cy="60" r="3.5" />
          <circle cx="35" cy="60" r="3.5" />
          <circle cx="60" cy="60" r="3.5" />
          <circle cx="85" cy="60" r="3.5" />
          <circle cx="10" cy="85" r="3.5" />
          <circle cx="35" cy="85" r="3.5" />
          <circle cx="60" cy="85" r="3.5" />
          <circle cx="85" cy="85" r="3.5" />
        </svg>
      </div>
      <div className="absolute bottom-[20%] right-[8%] opacity-35 -z-10 hidden lg:block">
        <svg width="60" height="60" className="text-zinc-800" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="10" cy="10" r="3.5" />
          <circle cx="35" cy="10" r="3.5" />
          <circle cx="60" cy="10" r="3.5" />
          <circle cx="85" cy="10" r="3.5" />
          <circle cx="10" cy="35" r="3.5" />
          <circle cx="35" cy="35" r="3.5" />
          <circle cx="60" cy="35" r="3.5" />
          <circle cx="85" cy="35" r="3.5" />
          <circle cx="10" cy="60" r="3.5" />
          <circle cx="35" cy="60" r="3.5" />
          <circle cx="60" cy="60" r="3.5" />
          <circle cx="85" cy="60" r="3.5" />
          <circle cx="10" cy="85" r="3.5" />
          <circle cx="35" cy="85" r="3.5" />
          <circle cx="60" cy="85" r="3.5" />
          <circle cx="85" cy="85" r="3.5" />
        </svg>
      </div>

      {/* Top Header Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between absolute top-0 left-0 right-0 z-20">
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-md shadow-indigo-500/25">
            <img src="/favicon/apple-touch-icon.png" alt="TrendPilot AI" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            TrendPilot AI
          </span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-450 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>

      {/* Centered card panel */}
      <div className="w-full max-w-[460px] mx-auto p-9 rounded-[2rem] border border-zinc-850 bg-zinc-900/20 backdrop-blur-2xl shadow-2xl relative z-10 animate-fade-in-up mt-16">
        <Outlet />
      </div>

      {/* Secured Bottom Footer */}
      <footer className="w-full max-w-md mx-auto mt-12 relative z-10">
        <div className="w-full flex items-center justify-center my-5 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-900" />
          </div>
          <div className="relative h-7 w-7 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-[10px] text-zinc-500">
            © 2026 TrendPilot AI
          </p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold font-sans">
            AI-Powered Content Intelligence for Creators & Teams
          </p>
        </div>
      </footer>
    </div>
  );
}
