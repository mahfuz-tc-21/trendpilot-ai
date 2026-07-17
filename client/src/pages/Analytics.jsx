import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Cpu,
  Sparkles,
  FileText,
  Clock,
  ThumbsUp,
  MessageSquare,
  Share2,
  Calendar,
  AlertTriangle,
  User,
  Zap,
  Target,
  Filter,
  Eye,
  RefreshCw,
  Award
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie
} from "recharts";
import dashboardService from "../services/dashboardService.js";
import api from "../services/api.js";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl text-[10px] text-left">
        <p className="font-semibold text-zinc-150">{payload[0].name || "Metric"}</p>
        <p className="text-indigo-400 font-bold mt-0.5">
          Count: <span className="text-zinc-200">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ["#1877f2", "#ff0000", "#10b981", "#6366f1"];
const LINE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];

export default function Analytics() {
  const navigate = useNavigate();

  // Filters State
  const [dateRange, setDateRange] = useState("30");
  const [platform, setPlatform] = useState("");
  const [source, setSource] = useState("");
  const [contentType, setContentType] = useState("");
  const [competitor, setCompetitor] = useState("");

  // Calculate startDate based on dateRange selection
  const getFiltersPayload = () => {
    const payload = {};
    if (dateRange && dateRange !== "all") {
      const start = new Date();
      start.setDate(start.getDate() - parseInt(dateRange));
      payload.startDate = start.toISOString();
      payload.endDate = new Date().toISOString();
    }
    if (platform) payload.platform = platform;
    if (source) payload.source = source;
    if (contentType) payload.contentType = contentType;
    if (competitor) payload.competitor = competitor;
    return payload;
  };

  // Queries
  const {
    data: report,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["analytics-data", dateRange, platform, source, contentType, competitor],
    queryFn: () => dashboardService.getAnalytics(getFiltersPayload())
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["sources-list"],
    queryFn: async () => {
      const res = await api.get("/api/sources");
      return res.data.data;
    }
  });

  const { data: competitors = [] } = useQuery({
    queryKey: ["competitors-list"],
    queryFn: async () => {
      const res = await api.get("/api/competitors");
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Cpu className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-xs text-zinc-500 font-medium">Aggregating historical timelines, processing scores, and compiling metrics...</span>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="p-12 text-center border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-zinc-200">Failed to Compile Analytics</h3>
        <p className="text-xs text-zinc-500 leading-relaxed text-center">
          Add active channels and ingest crawled records to run SaaS historical timelines.
        </p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded-xl text-zinc-350 hover:border-zinc-700">
          Retry Query
        </button>
      </div>
    );
  }

  const hasNoData = !report.sourcePerformance || report.sourcePerformance.length === 0;

  if (hasNoData) {
    return (
      <div className="space-y-8 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white font-heading">Historical Analytics</h1>
          <p className="text-zinc-400 mt-2 text-sm">Analyze processing velocity, opportunities, and platform efficiency.</p>
        </div>

        <div className="p-16 text-center border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 max-w-xl mx-auto">
          <BarChart3 className="h-12 w-12 text-zinc-700 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-zinc-300">No Analytics Compiled</h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
            Analytical trends require crawled sources in MongoDB. Ingest articles or competitor posts to build timelines and velocity maps.
          </p>
          <div className="pt-2">
            <button onClick={() => navigate("/sources")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-500/10 transition-colors">
              Configure Sources
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white font-heading flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-indigo-500" />
          Historical Analytics & BI
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Deep-dive into aggregate crawl indicators, AI confidence score models, and growth opportunity spreads.
        </p>
      </div>

      {/* 10. Analytics Summary */}
      {report.summaryText && (
        <div className="p-5 rounded-3xl border border-indigo-900/30 bg-gradient-to-r from-indigo-950/20 via-indigo-950/5 to-transparent flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex-shrink-0 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">AI Platform Intelligence Summary</h4>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">{report.summaryText}</p>
          </div>
        </div>
      )}

      {/* 11. Interactive Filters */}
      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider pb-3 border-b border-zinc-900/30">
          <Filter className="h-4 w-4 text-indigo-400" />
          Filter Intelligence Metrics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Date range select */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-850 bg-zinc-950 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Platform select */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-850 bg-zinc-950 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="">All Platforms</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
              <option value="blog">Blog</option>
              <option value="website">Website</option>
            </select>
          </div>

          {/* Source select */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-850 bg-zinc-950 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Content type select */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-850 bg-zinc-950 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="">All Formats</option>
              <option value="Facebook Post">Facebook Post</option>
              <option value="LinkedIn Post">LinkedIn Post</option>
              <option value="Blog Article">Blog Article</option>
              <option value="YouTube Script">YouTube Script</option>
              <option value="Carousel Post">Carousel Post</option>
              <option value="Twitter Thread">Twitter Thread</option>
            </select>
          </div>

          {/* Competitor select */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Competitor</label>
            <select
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-850 bg-zinc-950 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="">All Competitors</option>
              {competitors.map((c) => (
                <option key={c._id} value={c._id}>{c.brandName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 1: Source Performance & Platform Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Source Performance */}
        <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-400" />
            Source Performance Report
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-900 uppercase text-[9px] tracking-wider">
                  <th className="pb-3 font-bold">Source Name</th>
                  <th className="pb-3 font-bold text-center">Items</th>
                  <th className="pb-3 font-bold text-center">Success Rate</th>
                  <th className="pb-3 font-bold text-center">Avg Engagement</th>
                  <th className="pb-3 font-bold text-center">Top Topic</th>
                  <th className="pb-3 font-bold text-center">Failed Crawls</th>
                  <th className="pb-3 font-bold text-right">Last Crawl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {report.sourcePerformance.map((s) => (
                  <tr key={s.id} className="text-zinc-300">
                    <td className="py-3 font-semibold text-zinc-200">
                      {s.name}
                      <span className="block text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">{s.platform}</span>
                    </td>
                    <td className="py-3 text-center font-bold text-zinc-400">{s.totalItems}</td>
                    <td className="py-3 text-center font-extrabold text-emerald-450">{s.successRate}</td>
                    <td className="py-3 text-center font-bold text-indigo-455">{s.avgEngagement}</td>
                    <td className="py-3 text-center"><span className="bg-zinc-950/60 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-semibold text-zinc-300">{s.topTopic}</span></td>
                    <td className="py-3 text-center font-bold text-rose-500">{s.failedCrawls}</td>
                    <td className="py-3 text-right text-zinc-550">{s.lastCrawl ? new Date(s.lastCrawl).toLocaleDateString() : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Platform Contribution */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-400" />
              Platform Contribution
            </h2>
            <div className="h-44 w-full flex items-center justify-center relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={report.platformContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {report.platformContribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Volume</span>
                <span className="text-xs font-bold text-zinc-200">Share %</span>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {report.platformContribution.map((p, idx) => (
                <div key={p.name} className="flex justify-between items-center py-1.5 border-b border-zinc-900 last:border-0 text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                    <span className="font-semibold text-zinc-300">{p.name}</span>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="text-zinc-200 font-bold">{p.value}%</span> ({p.totalItems} items)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Crawl Timeline & Topic Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Crawl Activity Timeline */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Crawl Activity Timeline (Last 30 Days)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="crawledItems" name="Crawled Items" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="successfulCrawls" name="Successful Syncs" stroke="#10b981" strokeWidth={1.5} />
                <Line type="monotone" dataKey="failedCrawls" name="Failed Syncs" stroke="#ef4444" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Trending Topic Growth */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-450" />
            Trending Topic Growth
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.topicGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="topic" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="weeklyGrowth" name="Weekly growth %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagementGrowth" name="Engagement growth %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Keywords, High Opp, and Content Production */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 5. Top Keywords */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Keyword Cluster Performance
          </h2>
          <div className="space-y-3">
            {report.keywords?.slice(0, 5).map((kw) => (
              <div key={kw.keyword} className="p-3.5 border border-zinc-850 bg-zinc-950/40 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <strong className="text-zinc-200">#{kw.keyword}</strong>
                  <span className="block text-[8px] text-zinc-550 uppercase tracking-wider mt-0.5">{kw.platforms}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-indigo-400 block">{kw.frequency} mentions</span>
                  <span className="text-[9px] text-zinc-500">{kw.sourcesCount} sources</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. High Opportunity Topics */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-amber-500" />
            High Opportunity Topics
          </h2>
          <div className="space-y-3">
            {report.highOpportunity?.slice(0, 3).map((item) => (
              <div key={item.topic} className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-850 text-xs space-y-2 text-left">
                <div className="flex justify-between items-center text-zinc-450">
                  <span className="font-bold text-zinc-200">{item.topic}</span>
                  <span className="font-black text-indigo-400">Score {item.opportunityScore}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500 border-t border-zinc-900/60 pt-2 font-bold uppercase">
                  <div>Comp: <span className="text-emerald-450 font-extrabold">{item.competition}</span></div>
                  <div>Demand: <span className="text-indigo-400 font-extrabold">{item.demand}</span></div>
                  <div>Platform: <span className="text-zinc-300 font-extrabold">{item.recommendedPlatform}</span></div>
                  <div>Format: <span className="text-zinc-300 font-extrabold">{item.recommendedFormat}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Content Production Analytics */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-emerald-450" />
            Content Production Analytics
          </h2>
          <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-400 text-left">
            <div className="bg-zinc-950/40 p-2.5 border border-zinc-850 rounded-2xl">
              <span>Facebook Posts:</span> <strong className="text-zinc-200 font-bold block text-xs mt-0.5">{report.productionAnalytics?.facebook}</strong>
            </div>
            <div className="bg-zinc-950/40 p-2.5 border border-zinc-850 rounded-2xl">
              <span>LinkedIn Posts:</span> <strong className="text-zinc-200 font-bold block text-xs mt-0.5">{report.productionAnalytics?.linkedin}</strong>
            </div>
            <div className="bg-zinc-950/40 p-2.5 border border-zinc-850 rounded-2xl">
              <span>Blogs:</span> <strong className="text-zinc-200 font-bold block text-xs mt-0.5">{report.productionAnalytics?.blogs}</strong>
            </div>
            <div className="bg-zinc-950/40 p-2.5 border border-zinc-850 rounded-2xl">
              <span>YouTube Scripts:</span> <strong className="text-zinc-200 font-bold block text-xs mt-0.5">{report.productionAnalytics?.youtube}</strong>
            </div>
            <div className="bg-zinc-950/40 p-2.5 border border-zinc-850 rounded-2xl">
              <span>Carousels:</span> <strong className="text-zinc-200 font-bold block text-xs mt-0.5">{report.productionAnalytics?.carousel}</strong>
            </div>
            <div className="bg-zinc-950/40 p-2.5 border border-zinc-850 rounded-2xl">
              <span>Twitter Threads:</span> <strong className="text-zinc-200 font-bold block text-xs mt-0.5">{report.productionAnalytics?.twitter}</strong>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-zinc-900/80 pt-3 text-[8px] text-zinc-550 text-center uppercase tracking-wider font-extrabold">
            <div>Today: <span className="text-zinc-300 font-black block text-[10px] mt-0.5">{report.productionAnalytics?.today}</span></div>
            <div>This Week: <span className="text-zinc-300 font-black block text-[10px] mt-0.5">{report.productionAnalytics?.week}</span></div>
            <div>This Month: <span className="text-zinc-300 font-black block text-[10px] mt-0.5">{report.productionAnalytics?.month}</span></div>
          </div>
        </div>
      </div>

      {/* Row 4: Top Performing Content & Creator Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 8. Top Performing Content */}
        <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-orange-500 animate-pulse" />
            Top Performing Content Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-900 uppercase text-[9px] tracking-wider">
                  <th className="pb-3 font-bold">Content Title</th>
                  <th className="pb-3 font-bold">Source</th>
                  <th className="pb-3 font-bold text-center">Likes/Reactions</th>
                  <th className="pb-3 font-bold text-center">Opp Score</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {report.topPerformingContent?.map((item) => (
                  <tr key={item.id} className="text-zinc-300">
                    <td className="py-3 font-semibold max-w-xs truncate pr-4 text-zinc-200">
                      {item.title}
                      <span className="block text-[8px] text-zinc-550 uppercase tracking-widest mt-0.5">{item.platform}</span>
                    </td>
                    <td className="py-3 font-medium text-zinc-400">{item.source}</td>
                    <td className="py-3 text-center font-black text-emerald-450">{item.engagement}</td>
                    <td className="py-3 text-center font-bold text-indigo-400">{item.opportunityScore}</td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            navigate("/studio", {
                              state: {
                                mode: "custom-topic",
                                topic: item.title,
                                instructions: `Generate a post similar to: "${item.title}"`
                              }
                            });
                          }}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-bold text-zinc-300 rounded-lg cursor-pointer transition-colors"
                        >
                          Similar
                        </button>
                        <button
                          onClick={() => {
                            navigate("/studio", {
                              state: {
                                mode: "competitor-post",
                                competitorPostId: item.id,
                                instructions: `Create content to outperform this competitor post: "${item.title}"`
                              }
                            });
                          }}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg cursor-pointer transition-colors"
                        >
                          Beat This
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 9. Creator Productivity */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
              <User className="h-4 w-4 text-indigo-400" />
              Creator Productivity Overview
            </h2>
            <div className="space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60 text-zinc-400">
                <span className="font-semibold">Saved Drafts</span>
                <span className="font-extrabold text-zinc-200">{report.creatorProductivity?.savedDrafts}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60 text-zinc-400">
                <span className="font-semibold">Generated Copy Templates</span>
                <span className="font-extrabold text-zinc-200">{report.creatorProductivity?.generatedContent}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60 text-zinc-400">
                <span className="font-semibold">Average AI Opportunity Score</span>
                <span className="font-extrabold text-zinc-200">{report.creatorProductivity?.avgAIScore}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60 text-zinc-400">
                <span className="font-semibold">Best Performing Channel</span>
                <span className="font-extrabold text-emerald-450">{report.creatorProductivity?.bestPlatform}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60 text-zinc-400">
                <span className="font-semibold">Most Used Format</span>
                <span className="font-extrabold text-indigo-400 max-w-[120px] truncate block text-right">{report.creatorProductivity?.mostUsedFormat}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-zinc-400">
                <span className="font-semibold">Average Weekly Output</span>
                <span className="font-extrabold text-zinc-200">{report.creatorProductivity?.avgWeeklyOutput} files</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-550 pt-4 border-t border-zinc-900/80 text-center font-medium">
            Creator Account Last Active: <strong className="text-zinc-400">{report.userActivity?.lastActive ? new Date(report.userActivity.lastActive).toLocaleString() : "Just now"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
