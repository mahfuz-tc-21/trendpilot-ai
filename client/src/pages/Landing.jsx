import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../services/authStore.js";
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  Globe,
  Search,
  Users,
  CheckCircle2,
  Zap,
  Brain,
  Calendar,
  AlertCircle,
  Instagram,
  Chrome,
  Flame,
  RefreshCw,
  Moon,
  Sun,
  LayoutDashboard,
  MessageSquare,
  Bell,
  Lock,
  Languages,
  Facebook,
  Youtube,
  Save,
  History,
  Download,
  Trash2,
  ShieldAlert
} from "lucide-react";

export default function Landing() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [sandboxTopic, setSandboxTopic] = useState("");
  const [sandboxState, setSandboxState] = useState("idle"); // idle, loading, result
  const [loadingStep, setLoadingStep] = useState(0);
  const { isAuthenticated } = useAuthStore();

  // Toggle Theme helper
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Simulated AI analysis sequence
  const handleSandboxSubmit = (e) => {
    e.preventDefault();
    if (!sandboxTopic.trim()) return;

    setSandboxState("loading");
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 2) {
          clearInterval(interval);
          setTimeout(() => setSandboxState("result"), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const steps = [
    "Running Playwright scrollers & Cheerio HTML parser...",
    "Querying Gemini models to compute competitor explanation holes...",
    "Extracting Opportunity Scores & generating 19-asset blueprints..."
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans transition-colors duration-300 overflow-hidden relative">
      {/* Custom Styles Injection for Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.8; transform: scale(1.05) translate(10px, -10px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hover-lift {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.4s ease;
        }
        .hover-lift:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.12);
        }
        .hover-lift-subtle {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .hover-lift-subtle:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.1);
        }
      `}</style>

      {/* Background Gradients & Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] -z-10" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl -z-10 animate-pulse-glow" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-3xl -z-10 animate-pulse-glow" />

      {/* Navigation Header */}
      <nav className="border-b border-zinc-800/40 backdrop-blur-md sticky top-0 z-50 transition-colors bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-md shadow-indigo-500/25">
                  <img src="/favicon/apple-touch-icon.png" alt="TrendPilot AI" className="w-full h-full object-cover rounded-lg" />
                </div>
                <span className="text-xl font-bold tracking-tight font-heading bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  TrendPilot AI
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
                <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
                <a href="#problem" className="hover:text-indigo-400 transition-colors">The Challenge</a>
                <a href="#sandbox" className="hover:text-indigo-400 transition-colors">AI Sandbox</a>
                <a href="#roadmap" className="hover:text-indigo-400 transition-colors">Roadmap</a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-900/50 transition-all text-zinc-400 cursor-pointer"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold hover:text-indigo-400 text-zinc-400 transition-colors px-3 py-2 cursor-pointer"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6 shadow-inner">
          <Zap className="h-3.5 w-3.5" />
          Next-Gen AI Content Strategy
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight font-heading leading-tight max-w-4xl mx-auto text-zinc-100">
          Find the Gaps. <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-400 bg-clip-text text-transparent">
            Pilot Your Content.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Stop manually scouring competitor pages, RSS feeds, and channels. Let TrendPilot AI analyze the gaps and recommend your next viral content strategy.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <a
            href="#sandbox"
            className="w-full sm:w-auto px-8 py-3.5 border border-zinc-800 hover:bg-zinc-900/40 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-zinc-300"
          >
            Try AI Sandbox
          </a>
        </div>

        {/* Dashboard Mockup Representation */}
        <div className="mt-16 md:mt-20 border border-zinc-800/80 rounded-2xl bg-zinc-900/30 backdrop-blur-md p-2 md:p-3 shadow-2xl relative animate-float">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60 pointer-events-none rounded-2xl" />
          <div className="border border-zinc-800/40 rounded-xl overflow-hidden bg-zinc-950 text-left text-xs text-zinc-500 shadow-inner">
            {/* Mock Dashboard Top Bar */}
            <div className="h-10 border-b border-zinc-900 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-4 font-mono font-medium text-zinc-650">trendpilot-app://dashboard</span>
              </div>
              <div className="flex h-6 items-center gap-2.5 border border-zinc-900 rounded-lg px-2 text-zinc-500 bg-zinc-900/20">
                <TrendingUp className="h-3 w-3 text-indigo-500" />
                <span>AI Efficiency: 94.2%</span>
              </div>
            </div>

            {/* Mock Dashboard Content Grid */}
            <div className="flex min-h-[260px] md:min-h-[350px]">
              {/* Mock Sidebar */}
              <div className="w-36 md:w-44 border-r border-zinc-900 p-3 hidden sm:flex flex-col gap-2">
                <div className="h-7 bg-indigo-600/10 text-indigo-455 font-semibold px-2 rounded-lg flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Overview
                </div>
                <div className="h-7 hover:bg-zinc-900 px-2 rounded-lg flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Trends
                </div>
                <div className="h-7 hover:bg-zinc-900 px-2 rounded-lg flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5" /> AI Recommendation
                </div>
                <div className="h-7 hover:bg-zinc-900 px-2 rounded-lg flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Schedule
                </div>
              </div>

              {/* Mock Dashboard Feed */}
              <div className="flex-1 p-4 md:p-6 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-150">AI Gap Recommendations</h3>
                    <p className="text-[10px] text-zinc-500">Uncovered high-demand, low-competition angles.</p>
                  </div>
                  <div className="h-6 px-2 rounded-md bg-zinc-900 flex items-center text-[10px] text-zinc-400">
                    Last sync: Just now
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Mock Card 1 */}
                  <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950 shadow-sm relative group hover:border-zinc-800 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold text-[9px] uppercase">Tech & AI</span>
                      <span className="font-semibold text-emerald-400 text-[10px] flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> 98% Match
                      </span>
                    </div>
                    <h4 className="font-semibold text-zinc-200 text-xs mb-1.5 line-clamp-1">
                      Why AI Agent Systems fail in enterprise deployments
                    </h4>
                    <p className="text-[10px] text-zinc-550 line-clamp-2 leading-relaxed mb-3">
                      Competitors are writing simple intro guides. Real developers are searching for specific production integration failures.
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-zinc-600 border-t border-zinc-900 pt-2.5">
                      <span>Source: Competitor RSS Gaps</span>
                      <span className="text-indigo-400 font-semibold flex items-center gap-0.5 font-sans">Studio <ArrowRight className="h-2 w-2" /></span>
                    </div>
                  </div>

                  {/* Mock Card 2 */}
                  <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950 shadow-sm relative group hover:border-zinc-800 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[9px] uppercase">Marketing</span>
                      <span className="font-semibold text-emerald-400 text-[10px] flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> 91% Match
                      </span>
                    </div>
                    <h4 className="font-semibold text-zinc-200 text-xs mb-1.5 line-clamp-1">
                      How short-form videos hack the newer algorithms
                    </h4>
                    <p className="text-[10px] text-zinc-550 line-clamp-2 leading-relaxed mb-3">
                      Data shows a 45% increase in searches for hooks structure, but only 3 blogs have analyzed it this week.
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-zinc-600 border-t border-zinc-900 pt-2.5">
                      <span>Source: Youtube Scraping Gaps</span>
                      <span className="text-indigo-400 font-semibold flex items-center gap-0.5 font-sans">Studio <ArrowRight className="h-2 w-2" /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section id="problem" className="py-20 border-t border-zinc-900/60 bg-zinc-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase">The Challenge</h2>
            <p className="text-3xl sm:text-4xl font-extrabold font-heading text-zinc-100">
              The tedious manual research routine<br/>is holding you back.
            </p>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Modern creators and marketing teams spend hours manually scouring blogs, RSS feeds, YouTube channels, and competitor Facebook pages to identify what topics are trending, what their competitors are posting, and what angles are performing best.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-455 flex items-center justify-center mb-6">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold font-heading mb-3 text-zinc-100">Tedious Manual Scraping</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Hours spent jumping from browser tabs to spreadsheets, scraping competitor updates, social accounts, and feeds manually.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-455 flex items-center justify-center mb-6">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold font-heading mb-3 text-zinc-100">Delayed Publishing Times</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                By the time you compile competitor content patterns, draft structure plans, and write, the trend has already peaked.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-455 flex items-center justify-center mb-6">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold font-heading mb-3 text-zinc-100">Gut-Feeling Choices</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Lacking automated data-driven gap analysis, choices are made on instincts rather than concrete market deficiencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section id="sandbox" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-indigo-500/20 rounded-3xl bg-zinc-900/20 p-8 md:p-12 relative overflow-hidden hover-lift-subtle">
          <div className="absolute inset-0 bg-radial-gradient from-indigo-500/5 to-transparent pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Info and Input */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase">AI Simulator Sandbox</h2>
              <h3 className="text-3xl font-extrabold font-heading leading-tight text-zinc-100">
                Experience TrendPilot AI instantly.
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Enter a topic or niche of interest below to run a simulated AI Gap Analysis, mimicking how TrendPilot scans competition feeds to retrieve hidden potential.
              </p>

              <form onSubmit={handleSandboxSubmit} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g., Next.js, Marketing, Crypto, Productivity"
                  value={sandboxTopic}
                  onChange={(e) => setSandboxTopic(e.target.value)}
                  disabled={sandboxState === "loading"}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-zinc-955 border border-zinc-800 focus:outline-none focus:border-indigo-500 text-sm font-medium transition-colors"
                />
                <button
                  type="submit"
                  disabled={sandboxState === "loading" || !sandboxTopic.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.97]"
                >
                  {sandboxState === "loading" ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    "Analyze"
                  )}
                </button>
              </form>
            </div>

            {/* Simulated Report Viewport */}
            <div className="min-h-[280px] border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl relative flex flex-col justify-center">
              {sandboxState === "idle" && (
                <div className="text-center space-y-4">
                  <Search className="h-10 w-10 text-zinc-700 mx-auto" />
                  <p className="text-zinc-555 text-sm font-medium">
                    Enter a topic to generate a simulated gap analysis report.
                  </p>
                </div>
              )}

              {sandboxState === "loading" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="font-semibold text-sm text-zinc-300">Running Pilot Scraper...</span>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`text-xs flex items-center gap-2 transition-opacity duration-300 ${
                          loadingStep >= idx ? "opacity-100 text-indigo-400" : "opacity-30 text-zinc-650"
                        }`}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${loadingStep > idx ? "text-emerald-400" : "text-indigo-400"}`} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sandboxState === "result" && (
                <div className="space-y-5 animate-fade-in-up text-left">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-150 capitalize">Report: &quot;{sandboxTopic}&quot;</h4>
                      <p className="text-[10px] text-zinc-500">Uncovered high popularity & missing content angles.</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px] uppercase">
                      Analysis Success
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Trend Score</div>
                      <div className="text-xl font-black text-indigo-400 mt-1">94.8 / 100</div>
                    </div>
                    <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Competitor Gaps</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">High Potential</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Recommended AI Angle:</div>
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 text-xs rounded-xl text-zinc-200 font-medium">
                      🚀 &quot;Why most tutorials on <span className="font-bold text-indigo-400 capitalize">{sandboxTopic}</span> miss the hardest integration pitfalls: a developer guide.&quot;
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Projected engagement boost: <strong className="text-emerald-400">{`+136%`}</strong></span>
                    <Link to="/register" className="font-bold text-indigo-400 hover:underline flex items-center gap-0.5">
                      Explore AI Studio <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Production Features Grid - Categorized */}
      <section id="features" className="py-20 border-t border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase">Features</h2>
            <p className="text-3xl sm:text-4xl font-extrabold font-heading text-zinc-100">
              A Complete Content Intelligence Suite
            </p>
            <p className="text-zinc-400 text-sm sm:text-base">
              Explore the robust features already running in TrendPilot AI, designed to fully automate competitor tracking, trend analysis, and document drafting.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category 1: Multi-Channel Scraper Pipeline */}
            <div className="p-8 border border-zinc-900 bg-zinc-900/10 rounded-3xl space-y-6 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-500">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-zinc-100">Multi-Channel Ingestion</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect and scan dynamic web sources in real-time, removing the tedious tab-scouring routine forever.
              </p>
              <ul className="space-y-3.5 text-xs text-zinc-550 font-medium">
                <li className="flex items-start gap-2.5">
                  <Chrome className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Cheerio Website & RSS Scraper:</strong> Programmatically pulls articles and XML feeds to build your custom reading list database.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Youtube className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>YouTube Channel Scraper:</strong> Syncs competitor video uploads, views, metrics, and details automatically using the YouTube Data API.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Facebook className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Playwright Facebook Crawler:</strong> Bypasses login gateways, clicks &ldquo;See more&rdquo; text links, parses post engagements, and captures debug views.</span>
                </li>
              </ul>
            </div>

            {/* Category 2: AI Trend & Competitive Intelligence */}
            <div className="p-8 border border-zinc-900 bg-zinc-900/10 rounded-3xl space-y-6 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-500">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-zinc-100">AI Intelligence Core</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Programmatically analyze data gaps and competitor tactics to isolate matching opportunities that perform.
              </p>
              <ul className="space-y-3.5 text-xs text-zinc-550 font-medium">
                <li className="flex items-start gap-2.5">
                  <TrendingUp className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Opportunity & Gap Analysis:</strong> Generates dynamic opportunity scores, details competitor weaknesses, and maps what users are actively searching.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Flame className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Beat Competitor Strategist:</strong> Compares active competitors head-to-head to draft higher-converting hooks, thumbnails, and CTAs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>&ldquo;Generate Everything&rdquo; Engine:</strong> Compile a comprehensive, structured bundle of 19 assets (social posts, emails, scripts, blogs) in a single click.</span>
                </li>
              </ul>
            </div>

            {/* Category 3: Collaborative AI Content Workspace */}
            <div className="p-8 border border-zinc-900 bg-zinc-900/10 rounded-3xl space-y-6 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-zinc-100">AI Content Workspace</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Save time using a persistent ChatGPT-style editor that keeps edits inline instead of generating duplicate documents.
              </p>
              <ul className="space-y-3.5 text-xs text-zinc-550 font-medium">
                <li className="flex items-start gap-2.5">
                  <Save className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Real-time Auto-Save:</strong> Keeps drafts secure on a 2-second debounced runner with active &ldquo;Last Saved&rdquo; timestamp badges.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <History className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Version Control Subsystem:</strong> View version snapshots (v1, v2, v3) side-by-side and restore files back to any checkpoint instantly.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Refinement Chat Persistence:</strong> Links the entire iterative chat instructions history to your active drafts for seamless editing.</span>
                </li>
              </ul>
            </div>

            {/* Category 4: Enterprise Hub & Operations */}
            <div className="p-8 border border-zinc-900 bg-zinc-900/10 rounded-3xl space-y-6 hover-lift">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-500">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-zinc-100">Management & Isolation</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Scale your workflows secure in a tenant-isolated SaaS hub with complete asset controls and options.
              </p>
              <ul className="space-y-3.5 text-xs text-zinc-550 font-medium">
                <li className="flex items-start gap-2.5">
                  <Languages className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Multilingual Output Engine:</strong> Full translation controls to generate outputs in natural Bangla/Banglish and English.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Trash2 className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Workspace History Hub:</strong> Robust search, pagination, Favorites filter, document duplicates, and Trash Bin recovery.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Download className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                  <span><strong>Universal File Exports:</strong> Export your generated assets as Markdown, PDF, plain text (TXT), or copy instantly to your clipboard.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Future Scope / Roadmap Section */}
      <section id="roadmap" className="py-20 border-t border-zinc-900/60 bg-zinc-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-indigo-400 uppercase">Future Scope</h2>
            <p className="text-3xl sm:text-4xl font-extrabold font-heading text-zinc-100">
              Future Roadmap
            </p>
            <p className="text-zinc-400 text-sm sm:text-base">
              See what we are designing and building next to expand <br/>TrendPilot AI into a universal creator dashboard.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
            {/* Item 1 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <Chrome className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Google Trends Integration</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q3 2026</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Connect search volume indices to track and match competitor keywords with actual search interest.
              </p>
            </div>

            {/* Item 2 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Reddit Trend Analysis</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q3 2026</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Monitor organic discussions and subreddits to capture user complaints and questions before they reach blogs.
              </p>
            </div>

            {/* Item 3 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <Instagram className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Instagram Scraper</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q4 2026</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Track Instagram reels, post captions, and growth metrics programmatically using headless scraper systems.
              </p>
            </div>

            {/* Item 4 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">AI Content Calendar</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q4 2026</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Drag-and-drop schedule planner displaying active scripts, drafts, and posting pipelines dynamically.
              </p>
            </div>

            {/* Item 5 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Team Collaboration</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q1 2027</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Collaborative team workspaces supporting multiple authors under isolated tenant organizations.
              </p>
            </div>

            {/* Item 6 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <Bell className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Email & Telegram Notifications</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q1 2027</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Receive instant notifications when competitor posts spike or keyword opportunity scores increase.
              </p>
            </div>

            {/* Item 7 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <Brain className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Performance Prediction Using Ai</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q2 2027</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Predict post performance and reach estimates before assets go live using fine-tuned predictive models.
              </p>
            </div>

            {/* Item 8 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Social Media Analytics Integration</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q2 2027</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Connect channels directly to pull post engagement dashboards and feed recommendations back into AI models.
              </p>
            </div>

            {/* Item 9 */}
            <div className="p-5.5 border border-zinc-900 bg-zinc-955/40 rounded-xl shadow-sm hover-lift-subtle">
              <div className="flex items-center gap-3 mb-4.5">
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-150">Admin Control Dashboard</h4>
                <span className="ml-auto text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">Q3 2027</span>
              </div>
              <p className="text-xs text-zinc-555 leading-relaxed">
                Track global analytics, manage users, set API quotas, and tune fine-tuned parameters from a central administrator panel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative max-w-7xl mx-auto text-center px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-3xl -z-10 animate-pulse-glow" />
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-zinc-100">
          Ready to discover your next viral content gap?
        </h2>
        <p className="mt-3.5 text-zinc-555 text-xs sm:text-sm max-w-xl mx-auto">
          Start leveraging automated content recommendations today.<br/> Sign up for a free plan—no credit card required.
        </p>
        <div className="mt-7">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
          >
            {isAuthenticated ? "Go to Dashboard" : "Create Your Account"}
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded overflow-hidden">
              <img src="/favicon/apple-touch-icon.png" alt="TrendPilot AI" className="w-full h-full object-cover rounded" />
            </div>
            <span className="font-bold text-zinc-500 font-heading">TrendPilot AI</span>
          </div>
          <p>© 2026 TrendPilot AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
