import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./services/authStore.js";
import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Sources from "./pages/Sources.jsx";
import Trends from "./pages/Trends.jsx";
import ContentLibrary from "./pages/ContentLibrary.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import ContentDetails from "./pages/ContentDetails.jsx";
import AIStudio from "./pages/AIStudio.jsx";
import AIHistory from "./pages/AIHistory.jsx";
import YTStudio from "./pages/YTStudio.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import Competitors from "./pages/Competitors.jsx";
import Trash from "./pages/Trash.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import ConfirmDialogContainer from "./components/ConfirmDialogContainer.jsx";

/**
 * Main application component configuring React Router paths.
 */
export default function App() {
  const { checkAuth } = useAuthStore();

  // Verify token validation on mount
  useEffect(() => {
    checkAuth();

    // Initialize Theme on application mount
    const storedTheme = localStorage.getItem("theme") || "dark";
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (storedTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (systemTheme === "light") {
        root.classList.add("light");
      }
    } else if (storedTheme === "light") {
      root.classList.add("light");
    }
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Authentication Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Public Landing Page Route */}
        <Route path="/" element={<Landing />} />

        {/* Protected Core Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Overview Dashboard View */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/library" element={<ContentLibrary />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/studio" element={<AIStudio />} />
            <Route path="/ai-history" element={<AIHistory />} />
            <Route path="/youtube-studio" element={<YTStudio />} />
            <Route path="/content/:id" element={<ContentDetails />} />
            {/* Source Management View */}
            <Route path="/sources" element={<Sources />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trash" element={<Trash />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer />
      <ConfirmDialogContainer />
    </BrowserRouter>
  );
}
