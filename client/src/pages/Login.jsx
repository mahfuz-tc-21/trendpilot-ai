import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../services/authStore.js";
import { AlertCircle, Loader2 } from "lucide-react";

// Form validation schema using Zod
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long")
});

export default function Login() {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (data) => {
    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate("/dashboard");
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 mb-2">
          TP
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-heading">Welcome back</h1>
        <p className="text-xs text-zinc-500">
          Enter your credentials to access your TrendPilot dashboard.
        </p>
      </div>

      {/* Global Store Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            disabled={isLoading}
            className={`w-full h-10 px-3 rounded-xl bg-zinc-900/80 border text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors ${errors.email ? "border-rose-500" : "border-zinc-800"
              }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-rose-500 text-[10px] mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Password
            </label>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            className={`w-full h-10 px-3 rounded-xl bg-zinc-900/80 border text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors ${errors.password ? "border-rose-500" : "border-zinc-800"
              }`}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-rose-500 text-[10px] mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/10 transition-all duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
