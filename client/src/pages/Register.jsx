import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../services/authStore.js";
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";

// Form validation schema using Zod
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long")
});

export default function Register() {
  const { register: registerUser, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const onSubmit = async (data) => {
    try {
      const success = await registerUser(data.name, data.email, data.password);
      if (success) {
        navigate("/login");
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      {/* Centered Logo & Brand Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-transform duration-300 hover:scale-105">
            <img src="/favicon/apple-touch-icon.png" alt="TrendPilot AI" className="h-11 w-11 object-cover rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 font-heading">
            Create account 🚀
          </h1>
          <p className="text-xs text-zinc-450">
            Sign up to continue to your TrendPilot AI dashboard
          </p>
        </div>
      </div>

      {/* Global Store Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-355">
            Full name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-550">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Enter your name"
              disabled={isLoading}
              className={`w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-zinc-900/40 border text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition-colors ${
                errors.name ? "border-rose-500" : "border-zinc-800"
              }`}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-rose-500 text-[10px] mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-355">
            Email address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-550">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="Enter your email"
              disabled={isLoading}
              className={`w-full h-10.5 pl-10 pr-3.5 rounded-xl bg-zinc-900/40 border text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition-colors ${
                errors.email ? "border-rose-500" : "border-zinc-800"
              }`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-rose-500 text-[10px] mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-355">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-550">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              disabled={isLoading}
              className={`w-full h-10.5 pl-10 pr-10 rounded-xl bg-zinc-900/40 border text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition-colors ${
                errors.password ? "border-rose-500" : "border-zinc-800"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-rose-500 text-[10px] mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/10 transition-all duration-200 mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account <ArrowRight className="h-4.5 w-4.5" />
            </>
          )}
        </button>
      </form>

      {/* Or Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-900" />
        </div>
        <span className="relative px-3 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          OR
        </span>
      </div>

      {/* Continue with Google */}
      <button
        type="button"
        disabled
        className="w-full h-10.5 bg-zinc-900/10 hover:bg-zinc-900/20 border border-zinc-800 text-zinc-300 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2.5 cursor-not-allowed"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
            <path d="M12,20.6c2.6,0 4.78,-0.86 6.38,-2.33l-3.3,-2.57c-0.91,0.61 -2.08,0.97 -3.08,0.97 -2.37,0 -4.38,-1.6 -5.1,-3.75H3.5v2.66C5.09,18.8 8.35,20.6 12,20.6z" fill="#34A853" />
            <path d="M6.9,12.92c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7 0,-0.59 0.1,-1.16 0.28,-1.7V6.86H3.5C2.88,8.1 2.5,9.51 2.5,11c0,1.49 0.38,2.9 1,4.14l3.4,-2.22z" fill="#FBBC05" />
            <path d="M12,6.4c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.78,3.46 14.6,2.5 12,2.5c-3.65,0 -6.91,1.8 -8.5,4.36L6.9,9.52C7.62,7.37 9.63,6.4 12,6.4z" fill="#EA4335" />
          </g>
        </svg>
        Continue with Google
      </button>

      {/* Footer Info */}
      <div className="text-center pt-2">
        <p className="text-xs text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-350 hover:underline font-bold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
