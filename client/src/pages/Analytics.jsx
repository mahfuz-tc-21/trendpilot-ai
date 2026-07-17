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
  Target
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
  AreaChart,
  Area
} from "recharts";
import dashboardService from "../services/dashboardService.js";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl text-[10px]">
        <p className="font-semibold text-zinc-150">{payload[0].name || "Occurrences"}</p>
        <p className="text-indigo-400 font-bold mt-0.5">
          Count: <span className="text-zinc-200">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const LINE_COLORS = ["#6366f1", "#10b981", "#f59e0b"];

export default function Analytics() {
  const navigate = useNavigate();

  const {
    data: report,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["analytics-data"],
    queryFn: dashboardService.getAnalytics
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

  const { facebook = {}, youtube = {}, blogs = {} } = report.platformPerformance || {};

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white font-heading flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-indigo-500" />
          Historical Analytics
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Deep-dive into aggregate crawl indicators, AI confidence score models, and growth opportunity spreads.
        </p>
      </div>

      {/* Row 1: Source Performance & Platform Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* A. Source Performance (Span 2) */}
        <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-400" />
            Source Performance Indicators
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-900 uppercase text-[9px] tracking-wider">
                  <th className="pb-3 font-bold">Source Name</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold text-center">Items</th>
                  <th className="pb-3 font-bold text-center">Avg Engagement</th>
                  <th className="pb-3 font-bold">Top Topic</th>
                  <th className="pb-3 font-bold text-right">Last Crawl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {report.sourcePerformance.map((s) => (
                  <tr key={s.id} className="text-zinc-300">
                    <td className="py-3 font-semibold">{s.name}</td>
                    <td className="py-3 font-medium uppercase text-[10px] text-zinc-500">{s.platform}</td>
                    <td className="py-3 text-center font-bold text-zinc-400">{s.totalItems}</td>
                    <td className="py-3 text-center font-bold text-indigo-455">{s.avgEngagement}</td>
                    <td className="py-3"><span className="bg-zinc-950/60 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-semibold text-zinc-300">{s.topTopic}</span></td>
                    <td className="py-3 text-right text-zinc-550">{s.lastCrawl ? new Date(s.lastCrawl).toLocaleDateString() : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* B. Platform Performance */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5 mb-3">
              <Activity className="h-4 w-4 text-emerald-400" />
              Platform Performance
            </h2>
            <div className="space-y-4 text-xs">
              {/* Facebook */}
              <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200 flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-blue-500" /> Facebook
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold">{facebook.posts || 0} posts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                  <div>Total Likes: <strong className="text-zinc-200">{(facebook.totalLikes || 0).toLocaleString()}</strong></div>
                  <div>Total Comm: <strong className="text-zinc-200">{(facebook.totalComments || 0).toLocaleString()}</strong></div>
                  <div>Total Share: <strong className="text-zinc-200">{(facebook.totalShares || 0).toLocaleString()}</strong></div>
                  <div>Avg Eng/Post: <strong className="text-indigo-400">{facebook.avgEngagement || 0}</strong></div>
                </div>
              </div>

              {/* YouTube */}
              <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200 flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-red-500" /> YouTube
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold">{youtube.videos || 0} videos</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                  <div>Total Views: <strong className="text-zinc-200">{(youtube.totalViews || 0).toLocaleString()}</strong></div>
                  <div>Total Likes: <strong className="text-zinc-200">{(youtube.totalLikes || 0).toLocaleString()}</strong></div>
                  <div>Total Comm: <strong className="text-zinc-200">{(youtube.totalComments || 0).toLocaleString()}</strong></div>
                  <div>Avg Views: <strong className="text-indigo-400">{(youtube.avgViews || 0).toLocaleString()}</strong></div>
                </div>
              </div>

              {/* Blogs */}
              <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" /> Blogs
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold">{blogs.articles || 0} articles</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                  <div>Avg Read Time: <strong className="text-zinc-200">{blogs.avgReadTime || "0 min"}</strong></div>
                  <div className="col-span-2">Publish Freq: <strong className="text-zinc-200">{blogs.publishFrequency || "N/A"}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Winner Card */}
          {report.overallWinner && (
            <div className="p-4 rounded-2xl bg-indigo-950/10 border border-indigo-900/30 text-left space-y-1 pt-3 mt-4">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Best Performing Platform</span>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-white flex items-center gap-1">
                  🥇 {report.overallWinner.platform}
                </span>
                <span className="text-[10px] text-emerald-450 font-bold">{report.overallWinner.growth}</span>
              </div>
              <p className="text-[10px] text-zinc-400">{report.overallWinner.highestEngagement}</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Crawl Timeline & Trend Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* C. Crawl Timeline */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Crawl Timeline Frequency (Historical Spread)
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCrawl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4f46e5", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="count" name="Crawled Items" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCrawl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* D. Trend Velocity */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-450" />
            Trend Velocity (Top Topic Mentions over 7 Days)
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.velocity?.data || []} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                {report.velocity?.topics?.map((topic, index) => (
                  <Line
                    key={topic}
                    type="monotone"
                    dataKey={topic}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2.5}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Keywords, Opportunities, and AI Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* E. Keyword Frequency */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Top Keywords Extracted
          </h2>
          {report.keywords?.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-8 text-center">No keywords extracted yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {report.keywords.map((kw) => (
                <span
                  key={kw.name}
                  className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-850 text-xs font-semibold text-zinc-300 flex items-center gap-1"
                >
                  <strong className="text-indigo-400">#</strong> {kw.name}
                  <span className="text-[9px] bg-zinc-900 border border-zinc-850 text-zinc-500 px-1 rounded font-bold ml-1">{kw.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* H. Opportunity Analysis (Aggregate Recommendation score brackets) */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-amber-500" />
            Opportunity Level Analytics
          </h2>
          <div className="space-y-3">
            {report.opportunityScores?.map((score) => (
              <div key={score.name} className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-1.5 text-xs text-left">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="font-semibold">{score.name}</span>
                  <span className="font-bold text-indigo-400">{score.value} Ideas</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${score.name.startsWith("High") ? "bg-indigo-600" : (score.name.startsWith("Medium") ? "bg-amber-500" : "bg-zinc-650")}`}
                    style={{ width: `${Math.min(100, (score.value / (report.aiProcessing?.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* G. AI Processing Analytics */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-emerald-450" />
            AI Processing Performance
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-950/40 p-3 border border-zinc-850 rounded-2xl">
              <span className="text-[9px] text-zinc-550 block font-bold uppercase">Success Requests</span>
              <span className="text-base font-black text-zinc-200">{report.aiProcessing?.success}</span>
            </div>
            <div className="bg-zinc-950/40 p-3 border border-zinc-850 rounded-2xl">
              <span className="text-[9px] text-zinc-550 block font-bold uppercase">Failed Summaries</span>
              <span className="text-base font-black text-rose-500">{report.aiProcessing?.failed}</span>
            </div>
            <div className="bg-zinc-950/40 p-3 border border-zinc-850 rounded-2xl">
              <span className="text-[9px] text-zinc-550 block font-bold uppercase">Pending Queue</span>
              <span className="text-base font-black text-amber-500">{report.aiProcessing?.pending}</span>
            </div>
            <div className="bg-zinc-950/40 p-3 border border-zinc-850 rounded-2xl">
              <span className="text-[9px] text-zinc-550 block font-bold uppercase">Avg API Latency</span>
              <span className="text-base font-black text-indigo-400">{report.aiProcessing?.avgTime}</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase text-center pt-2">
            Total Request Volume: <span className="text-zinc-300 font-black">{report.aiProcessing?.total}</span>
          </div>
        </div>
      </div>

      {/* Row 4: Highest Engagement Content & User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* F. Highest Engagement Content (Span 2) */}
        <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-orange-500" />
            Top 10 Highest Performing Content Items
          </h2>
          {report.highestEngagement?.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-8 text-center">No engagement scores calculated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-900 uppercase text-[9px] tracking-wider">
                    <th className="pb-3 font-bold">Content Title</th>
                    <th className="pb-3 font-bold">Source Name</th>
                    <th className="pb-3 font-bold">Platform</th>
                    <th className="pb-3 font-bold text-center">Likes/Reactions</th>
                    <th className="pb-3 font-bold text-right">Published</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {report.highestEngagement.map((item, idx) => (
                    <tr key={idx} className="text-zinc-300">
                      <td className="py-3 font-semibold max-w-sm truncate pr-4">{item.title}</td>
                      <td className="py-3 font-medium text-zinc-400">{item.source}</td>
                      <td className="py-3 uppercase text-[9px] font-extrabold">{item.platform}</td>
                      <td className="py-3 text-center font-bold text-emerald-450">{item.engagement}</td>
                      <td className="py-3 text-right text-zinc-500">{new Date(item.publishedDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* I. User Activity */}
        <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
              <User className="h-4 w-4 text-indigo-400" />
              Creator Account Indicators
            </h2>
            <div className="space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60">
                <span className="text-zinc-500 font-semibold">Sources Monitored</span>
                <span className="font-extrabold text-zinc-200">{report.userActivity?.sourcesAdded}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60">
                <span className="text-zinc-500 font-semibold">Competitors Tracked</span>
                <span className="font-extrabold text-zinc-200">{report.userActivity?.competitorsAdded}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-900/60">
                <span className="text-zinc-500 font-semibold">Crawl Schedules Run</span>
                <span className="font-extrabold text-zinc-200">{report.userActivity?.crawlsTriggered}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-500 font-semibold">AI Copy Outputs</span>
                <span className="font-extrabold text-zinc-200">{report.userActivity?.aiContentGenerated}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-550 pt-4 border-t border-zinc-900/80 text-center font-medium">
            Account Last Active: <strong className="text-zinc-400">{report.userActivity?.lastActive ? new Date(report.userActivity.lastActive).toLocaleString() : "Just now"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
