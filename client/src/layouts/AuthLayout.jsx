import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../services/authStore.js";

/**
 * Layout wrapper for authentication pages (Login and Register).
 * Redirects to the homepage if the user is already authenticated.
 */
export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 select-none">
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full bg-indigo-600/5 blur-3xl -z-10" />

      {/* Background dark grid mockup */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-20" />

      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md shadow-2xl">
        <Outlet />
      </div>
    </div>
  );
}
