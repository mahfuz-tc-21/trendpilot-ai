import { useState, useEffect } from "react";
import { Settings, Shield, User, Clock, Bell, Globe } from "lucide-react";
import { useAuthStore } from "../services/authStore.js";

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [emailAlerts, setEmailAlerts] = useState(true);

  const [apiKeyInput, setApiKeyInput] = useState(user?.geminiApiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(false);

  const [languageInput, setLanguageInput] = useState(user?.language || "bn");
  const [updatingLanguage, setUpdatingLanguage] = useState(false);

  useEffect(() => {
    if (user?.geminiApiKey !== undefined) {
      setApiKeyInput(user.geminiApiKey);
    }
  }, [user]);

  useEffect(() => {
    if (user?.language !== undefined) {
      setLanguageInput(user.language);
    }
  }, [user]);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setUpdatingKey(true);
    try {
      await updateProfile({ geminiApiKey: apiKeyInput });
      alert("Gemini API Key updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to save API key");
    } finally {
      setUpdatingKey(false);
    }
  };

  const handleSaveLanguage = async (e) => {
    e.preventDefault();
    setUpdatingLanguage(true);
    try {
      await updateProfile({ language: languageInput });
      alert("Language preference updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to save language preference");
    } finally {
      setUpdatingLanguage(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (systemTheme === "light") {
        root.classList.add("light");
      }
    } else if (newTheme === "light") {
      root.classList.add("light");
    }
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
          <Settings className="h-8 w-8 text-indigo-500" />
          Settings Panel
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Manage your TrendPilot user configurations, alert intervals, and background ingestion scheduler details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Side: General Profile Info */}
        <div className="md:col-span-2 space-y-6">
          {/* User profile card */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800">
              <User className="h-4.5 w-4.5 text-indigo-400" />
              Creator Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Full Name</span>
                <p className="text-zinc-200 font-semibold">{user?.name || "John Doe"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Email Address</span>
                <p className="text-zinc-200 font-semibold">{user?.email || "creator@trendpilot.ai"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">System Role</span>
                <p className="text-zinc-200 font-semibold capitalize">{user?.role || "Creator"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs">Account Status</span>
                <p className="text-emerald-400 font-bold uppercase tracking-wide text-xs">Verified Active</p>
              </div>
            </div>
          </div>

          {/* Gemini API Key Configuration */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Shield className="h-4.5 w-4.5 text-indigo-400" />
              Google Gemini Configuration
            </h2>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Your Custom Gemini API Key
                </label>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Provide your own Gemini 2.5 Flash API Key to override default rate limits and customize quota details.
                </p>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full h-10 px-3 pr-12 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs font-semibold"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingKey}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-colors cursor-pointer"
                >
                  {updatingKey ? "Saving Key..." : "Save API Key"}
                </button>
              </div>
            </form>
          </div>
          {/* Language Preference Configuration */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-5 text-left">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Globe className="h-4.5 w-4.5 text-indigo-400" />
              Content Language Preference
            </h2>

            <form onSubmit={handleSaveLanguage} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Output Generation Language
                </label>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Select your primary language for AI summaries, content briefs, social media copy, and creator studio posts.
                </p>
                <select
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-150 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="bn">Bangla (বাংলা)</option>
                  <option value="en">English (English)</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingLanguage}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-colors cursor-pointer"
                >
                  {updatingLanguage ? "Saving Preference..." : "Save Preference"}
                </button>
              </div>
            </form>
          </div>

          {/* Scheduler Settings */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              Background Ingestion Scheduler
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 max-w-sm">
                <span className="text-xs font-bold text-zinc-200">Enable Automated Sync (Every 4h)</span>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Toggle node-cron scan tasks across active channels. Keep disabled to save Gemini API credits during demo runs.
                </p>
              </div>
              <button
                onClick={() => setSchedulerEnabled(!schedulerEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                  schedulerEnabled ? "bg-indigo-600" : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    schedulerEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-5">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Bell className="h-4.5 w-4.5 text-indigo-400" />
              Notification Settings
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 max-w-sm">
                <span className="text-xs font-bold text-zinc-200">Weekly Email Summary Reports</span>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Receive curated trending phrases and high-performing opportunity score alerts directly in your inbox.
                </p>
              </div>
              <button
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                  emailAlerts ? "bg-indigo-600" : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    emailAlerts ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Security & System Settings */}
        <div className="space-y-6">
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 text-left">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              Aesthetics & Theme
            </h3>

            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Color Theme</span>
              <div className="grid grid-cols-3 gap-2">
                {["dark", "light", "system"].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`py-2 px-3 text-[10px] font-bold rounded-lg uppercase tracking-wider border transition-all cursor-pointer ${
                      theme === t
                        ? "border-indigo-500 bg-indigo-500/10 text-white font-semibold"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
