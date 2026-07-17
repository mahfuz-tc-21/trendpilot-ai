import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Globe,
  CheckCircle,
  FileText,
  Lightbulb,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Facebook,
  Video,
  Flame,
  ShieldCheck,
  Heart,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import dashboardService from "../services/dashboardService.js";
import { useAuthStore } from "../services/authStore.js";
import api from "../services/api.js";

const COLORS = ["#1877f2", "#ff0000", "#10b981", "#6366f1"];

// Custom Tooltip for Recharts Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl text-[10px]">
        <p className="font-semibold text-zinc-150">{payload[0].name}</p>
        <p className="text-indigo-400 font-bold mt-0.5">{payload[0].value}% Distribution</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: db,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: dashboardService.getStats
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/scan");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    }
  });

  const { user } = useAuthStore();

  const handleManualScan = () => {
    if (!user?.geminiApiKey) {
      alert("⚠️ Gemini API Key is missing! Please configure your Google Gemini API Key in Settings first to run scans.");
      navigate("/settings");
      return;
    }
    scanMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-xs text-zinc-500 font-medium">Analyzing database, parsing clusters, and syncing metrics...</span>
      </div>
    );
  }

  if (isError || !db) {
    return (
      <div className="p-12 text-center border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-zinc-200">Failed to Sync Dashboard</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Ensure MongoDB is connected and backend servers are running properly.
        </p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded-xl text-zinc-350 hover:border-zinc-700">
          Retry Sync
        </button>
      </div>
    );
  }

  const kpis = db.kpis || {};
  const hasNoData = kpis.totalSources === 0;

  if (hasNoData) {
    return (
      <div className="space-y-8 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white font-heading">Operational Dashboard</h1>
          <p className="text-zinc-400 mt-2 text-sm">Overview of active crawls, trends, and content intelligence.</p>
        </div>

        <div className="p-16 text-center border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 max-w-xl mx-auto">
          <Globe className="h-12 w-12 text-zinc-700 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-zinc-300">No Data Ingested Yet</h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
            You currently have 0 active content sources or competitor pages. Add sources to initiate scans, calculate topics, and compile trend scores.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button onClick={() => navigate("/sources")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-500/10 transition-colors">
              Add Sources
            </button>
            <button onClick={() => navigate("/competitors")} className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-xs font-bold text-zinc-350 rounded-xl transition-colors">
              Add Competitors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Welcome & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white font-heading">Operational Dashboard</h1>
          <p className="text-zinc-400 mt-2 text-sm">Overview of active crawls, trends, and content intelligence.</p>
        </div>
        <button
          onClick={handleManualScan}
          disabled={scanMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/15 font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {scanMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning Feeds...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Scan Feeds Now
            </>
          )}
        </button>
      </div>

      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 flex flex-col justify-between h-28 hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Sources</span>
            <Globe className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{kpis.totalSources || 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 flex flex-col justify-between h-28 hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{kpis.activeSources || 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 flex flex-col justify-between h-28 hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Crawled Items</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{kpis.totalContent || 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 flex flex-col justify-between h-28 hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Ideas Generated</span>
            <Lightbulb className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{kpis.totalRecommendations || 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/10 p-5 flex flex-col justify-between h-28 hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Processed Today</span>
            <Clock className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{kpis.processedToday || 0}</div>
        </div>
      </div>

      {/* Grid widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Top Trending (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* A. Top Trending Topics */}
          <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900/40">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                Top Trending Topics
              </h2>
              <button onClick={() => navigate("/trends")} className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-0.5">
                Full Details <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {db.topTrends?.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6">No trends calculated yet.</p>
            ) : (
              <div className="space-y-3">
                {db.topTrends.map((t) => (
                  <div
                    key={t.topic}
                    onClick={() => navigate(`/trends?topic=${encodeURIComponent(t.topic)}`)}
                    className="p-4 rounded-2xl border border-zinc-850 bg-zinc-950/40 hover:border-indigo-500/50 hover:bg-zinc-900/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{t.topic}</p>
                      <div className="flex gap-3 text-[10px] text-zinc-500 mt-1">
                        <span>{t.mentions} Mentions</span>
                        <span>•</span>
                        <span>{t.sourcesCount} Contributing Sources</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-450">{t.weeklyGrowth}</span>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Score: <strong className="text-indigo-400">{t.trendScore}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* C. Latest AI Recommendations */}
          <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Latest AI Content Recommendations
            </h2>
            {db.recentRecommendations?.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6">No recommendations calculated yet.</p>
            ) : (
              <div className="space-y-3">
                {db.recentRecommendations.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-zinc-850 bg-zinc-950/40 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-zinc-200 leading-snug">{r.topic}</h4>
                      <div className="flex gap-2 text-[9px] text-zinc-550">
                        <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold border border-indigo-500/10">{r.platform}</span>
                        <span>Generated {new Date(r.generatedTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-550 block font-bold uppercase">Opp Score</span>
                        <span className="text-sm font-black text-indigo-400">{r.opportunityScore}</span>
                      </div>
                      <button onClick={() => navigate("/recommendations")} className="h-7 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:border-zinc-700">
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Crawler Health, Distribution, Generated Outputs */}
        <div className="space-y-8">


          {/* E. Platform Distribution */}
          <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-indigo-400" />
              Platform Distribution
            </h2>
            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={db.platformDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {db.platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Source Mix</span>
                <span className="text-xs font-bold text-zinc-200">Channels</span>
              </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-semibold text-zinc-400 border-t border-zinc-900 pt-3.5">
              {db.platformDistribution.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span>{p.name}: <strong className="text-zinc-200">{p.value}%</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* F. Recent Scrapes */}
          <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-400" />
              Recent Scrapes
            </h2>
            {db.recentScrapes?.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6">No recent crawls recorded.</p>
            ) : (
              <div className="space-y-3">
                {db.recentScrapes.map((item) => {
                  const Icon = item.platform === "facebook" ? Facebook : (item.platform === "youtube" ? Video : Globe);
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/content/${item.id}`)}
                      className="p-4 rounded-2xl border border-zinc-850 bg-zinc-950/40 hover:border-indigo-500/50 hover:bg-zinc-900/20 transition-all flex items-center justify-between gap-4 cursor-pointer text-left"
                    >
                      <div className="space-y-1 truncate">
                        <p className="text-xs font-bold text-zinc-200 truncate leading-snug">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-555">
                          <Icon className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                          <span className="font-semibold text-zinc-400">{item.sourceName}</span>
                          <span>•</span>
                          <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          item.processedStatus === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                            : item.processedStatus === "failed"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                              : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                        }`}>
                          {item.processedStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
