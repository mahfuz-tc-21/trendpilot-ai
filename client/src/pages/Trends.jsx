import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Flame,
  ArrowUpRight,
  Search,
  Activity,
  Sparkles,
  FileText,
  ArrowRight,
  Video,
  AlertCircle,
  Compass,
  Target,
  Layers,
  Zap,
  RefreshCw,
  Award,
  Share2,
  Calendar,
  X,
  PlayCircle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dashboardService from "../services/dashboardService.js";

export default function Trends() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTopic = searchParams.get("topic") || "";
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [generating, setGenerating] = useState(false);
  const [generatedPackage, setGeneratedPackage] = useState(null);
  const [beatingCompetitor, setBeatingCompetitor] = useState(null);
  const [competitorStrategy, setCompetitorStrategy] = useState(null);

  // 1. Fetch calculated trending topics list from database aggregation
  const { data: trendingTopics = [], isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ["trending-topics"],
    queryFn: dashboardService.getTrendingTopics
  });

  // Set first topic as active if none selected
  useEffect(() => {
    if (trendingTopics.length > 0 && !selectedTopic) {
      setSearchParams({ topic: trendingTopics[0].topic });
    }
  }, [trendingTopics, selectedTopic, setSearchParams]);

  // 2. Fetch detailed trend intelligence for the selected topic
  const { data: trendDetailRes, isLoading: detailLoading, refetch: refetchDetail } = useQuery({
    queryKey: ["trend-detail", selectedTopic],
    queryFn: () => dashboardService.getTrendDetail(selectedTopic),
    enabled: !!selectedTopic
  });

  const detailSuccess = trendDetailRes?.success !== false;
  const trendDetail = detailSuccess ? trendDetailRes?.data : null;
  const emptyMessage = trendDetailRes?.success === false ? trendDetailRes?.message : null;

  // Filter topics list by search input
  const filteredTopics = trendingTopics.filter((t) =>
    t.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTopicInfo = trendingTopics.find(
    (t) => t.topic.toLowerCase() === selectedTopic.toLowerCase()
  );

  // Trigger package generation
  const handleGenerateEverything = async () => {
    if (!selectedTopic) return;
    setGenerating(true);
    setGeneratedPackage(null);
    try {
      const result = await dashboardService.generateTrendPackage(selectedTopic);
      setGeneratedPackage(result);
    } catch (err) {
      alert(err.message || "Failed to generate creator package");
    } finally {
      setGenerating(false);
    }
  };

  // Trigger competitor beating strategy
  const handleBeatCompetitor = async (competitorName) => {
    setBeatingCompetitor(competitorName);
    setCompetitorStrategy(null);
    try {
      const strategyText = await dashboardService.beatCompetitorStrategy(competitorName, selectedTopic);
      setCompetitorStrategy(strategyText);
    } catch (err) {
      alert(err.message || "Failed to compile competitor beat blueprint");
      setBeatingCompetitor(null);
    }
  };

  return (
    <div className="space-y-8 text-zinc-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-indigo-500" />
            Trend Intelligence
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Leverage computed data patterns, analyze content gaps, and outperform competitors.
          </p>
        </div>
        <button
          onClick={() => {
            refetchList();
            if (selectedTopic) refetchDetail();
          }}
          className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold hover:border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer text-zinc-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Intelligence
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Trending list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
              Database Computed Trends
            </h2>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-3.5 w-3.5 text-zinc-500" />
              </span>
              <input
                type="text"
                placeholder="Search calculated trends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-950 border border-zinc-850 text-xs placeholder-zinc-650 focus:outline-none focus:border-zinc-700 text-zinc-300"
              />
            </div>

            {/* List */}
            {listLoading ? (
              <div className="py-12 flex justify-center">
                <Activity className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-850 rounded-xl">
                No computed trends found. Ingest active channels to run summaries and compile trends.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredTopics.map((t) => (
                  <div
                    key={t.topic}
                    onClick={() => {
                      setSearchParams({ topic: t.topic });
                      setGeneratedPackage(null);
                      setBeatingCompetitor(null);
                      setCompetitorStrategy(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${selectedTopic.toLowerCase() === t.topic.toLowerCase()
                        ? "border-indigo-500/80 bg-indigo-500/5"
                        : "border-zinc-850 bg-zinc-950/20 hover:border-zinc-800"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-zinc-100 text-xs tracking-wide">{t.topic}</span>
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 flex-shrink-0">
                        <ArrowUpRight className="h-3 w-3" />
                        {t.weeklyGrowth}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-900">
                      <div className="flex gap-1.5 flex-wrap">
                        <span>{t.articlesCount} Articles</span>
                        <span>•</span>
                        <span>{t.videosCount} Videos</span>
                        <span>•</span>
                        <span>{t.fbCount} FB Posts</span>
                      </div>
                      <span className="font-extrabold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded">
                        Score {t.trendScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Intelligence & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedTopic ? (
            <div className="p-16 text-center border border-dashed border-zinc-850 bg-zinc-900/5 rounded-2xl text-zinc-500 text-sm">
              Select an exploding database trend on the left to view deep insights.
            </div>
          ) : detailLoading ? (
            <div className="p-24 text-center border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-4">
              <Activity className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
              <p className="text-zinc-500 text-xs">Compiling competitor mentions, gap ratios, and loading Gemini intelligence...</p>
            </div>
          ) : !detailSuccess ? (
            <div className="p-12 text-center border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-3">
              <AlertCircle className="h-8 w-8 text-zinc-650 mx-auto" />
              <h3 className="font-bold text-zinc-350 text-sm">No Crawl Matches</h3>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                {emptyMessage || "No crawled competitor posts or library summaries exist in MongoDB for this trend query. Ingest active feeds to analyze."}
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Trend Detail Card Header */}
              <div className="p-6 border border-zinc-850 bg-zinc-900/15 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                      Trend Intelligence Report
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">{selectedTopic}</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center bg-zinc-950 border border-zinc-850 px-4 py-2 rounded-xl">
                      <div className="text-[9px] text-zinc-500 font-semibold uppercase">Trend Score</div>
                      <div className="text-base font-extrabold text-indigo-400 mt-0.5">{activeTopicInfo?.trendScore || 85}</div>
                    </div>
                    <div className="text-center bg-zinc-950 border border-zinc-850 px-4 py-2 rounded-xl">
                      <div className="text-[9px] text-zinc-500 font-semibold uppercase">Weekly Growth</div>
                      <div className="text-base font-extrabold text-emerald-400 mt-0.5">{activeTopicInfo?.weeklyGrowth || "+12%"}</div>
                    </div>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed border-t border-zinc-850 pt-4">
                  {trendDetail.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {trendDetail.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-850 px-2 py-0.5 rounded-lg">
                      #{kw}
                    </span>
                  ))}
                  {trendDetail.hashtags.map((ht) => (
                    <span key={ht} className="text-[10px] font-bold bg-zinc-900/50 text-indigo-400/90 border border-indigo-500/10 px-2 py-0.5 rounded-lg">
                      #{ht}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-850 overflow-x-auto gap-2">
                {[
                  { id: "overview", label: "Overview & Growth" },
                  { id: "gap", label: "Gap Analysis" },
                  { id: "competitors", label: "Competitor Intel" },
                  { id: "library", label: "Matching Crawls" },
                  { id: "ai", label: "Creator Ideas" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setBeatingCompetitor(null);
                      setCompetitorStrategy(null);
                    }}
                    className={`h-10 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === tab.id
                        ? "border-indigo-500 text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab View Contents */}
              <div className="space-y-6">
                {/* 1. Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Recharts growth timeline */}
                    <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                        Crawl Chronology & Post Frequency (Last 7 Days)
                      </h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendDetail.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "11px" }}
                              itemStyle={{ color: "#a5b4fc" }}
                            />
                            <Area type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-indigo-400" />
                          Why It is Growing
                        </h4>
                        <p className="text-xs text-zinc-350 leading-relaxed">{trendDetail.whyGrowing}</p>
                      </div>
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-emerald-400" />
                          Growth Reasons
                        </h4>
                        <p className="text-xs text-zinc-350 leading-relaxed">{trendDetail.growthReason}</p>
                      </div>
                    </div>

                    {/* Best Formats */}
                    <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-3">
                      <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Recommended Formats</h4>
                      <div className="flex flex-wrap gap-2">
                        {trendDetail.bestFormats.map((f) => (
                          <span key={f} className="px-3 py-1 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 font-semibold">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Gap Analysis Tab */}
                {activeTab === "gap" && (
                  <div className="space-y-6">
                    {/* Opportunity Score info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl text-center space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Opportunity Score</div>
                        <div className="text-3xl font-black text-indigo-400">{trendDetail.opportunityAnalysis.score} <span className="text-xs text-zinc-500">/ 100</span></div>
                      </div>
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl text-center space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Estimated Competition</div>
                        <div className="text-xl font-bold text-zinc-200 mt-1">{trendDetail.opportunityAnalysis.competition}</div>
                      </div>
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl text-center space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Audience Interest</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{trendDetail.opportunityAnalysis.interest}</div>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-850 bg-indigo-500/5 rounded-2xl space-y-2">
                      <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" />
                        AI Growth Recommendation
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                        &ldquo;{trendDetail.opportunityAnalysis.recommendation}&rdquo;
                      </p>
                    </div>

                    {/* Gap analysis matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">Competitors Covered</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.covered}</p>
                      </div>
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">What Competitors Missed</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.missed}</p>
                      </div>
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">What Users Are Asking</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.userQuestions}</p>
                      </div>
                      <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">Topics Left Unexplained</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.unexplained}</p>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-2">
                      <h4 className="text-[10px] text-zinc-500 font-bold uppercase">Suggested Unique Angles</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.suggestedAngles}</p>
                    </div>
                  </div>
                )}

                {/* 3. Competitors Tab */}
                {activeTab === "competitors" && (
                  <div className="space-y-6">
                    {beatingCompetitor && (
                      <div className="p-5 border border-zinc-800 bg-zinc-950 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Zap className="h-4 w-4 animate-bounce" />
                            Beating Strategy: {beatingCompetitor}
                          </h4>
                          <button
                            onClick={() => {
                              setBeatingCompetitor(null);
                              setCompetitorStrategy(null);
                            }}
                            className="text-zinc-500 hover:text-zinc-350 cursor-pointer"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>
                        {!competitorStrategy ? (
                          <div className="py-12 flex flex-col items-center gap-2">
                            <Activity className="h-6 w-6 animate-spin text-indigo-500" />
                            <span className="text-xs text-zinc-500">Drafting higher conversion hooks and CTAs...</span>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-350 leading-relaxed whitespace-pre-wrap font-sans text-left max-h-96 overflow-y-auto pr-1">
                            {competitorStrategy}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Competitors discussing this trend
                      </h3>

                      <div className="space-y-3">
                        {trendDetail.competitorIntelligence.map((comp) => (
                          <div
                            key={comp.brandName}
                            className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-zinc-150 text-sm">{comp.brandName}</h4>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                                <span>Platform: <strong className="text-zinc-400">{comp.platform}</strong></span>
                                <span>Posts: <strong className="text-zinc-400">{comp.postCount}</strong></span>
                                <span>Avg Likes: <strong className="text-zinc-400">{comp.avgLikes}</strong></span>
                                <span>Latest: <strong className="text-zinc-400">{new Date(comp.latestDate).toLocaleDateString()}</strong></span>
                              </div>
                              <p className="text-xs text-zinc-450 mt-1 italic">
                                Best Post: &ldquo;{comp.bestPost}&rdquo;
                              </p>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                onClick={() => navigate("/competitors")}
                                className="flex-1 md:flex-none h-8 px-3 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-[10px] font-semibold text-zinc-400 transition-colors cursor-pointer"
                              >
                                View Crawled Feed
                              </button>
                              <button
                                onClick={() => handleBeatCompetitor(comp.brandName)}
                                className="flex-1 md:flex-none h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-semibold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 transition-colors cursor-pointer"
                              >
                                <Zap className="h-3 w-3" />
                                Beat Competitor
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Matching Crawls Tab */}
                {activeTab === "library" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Matching articles in Content Library
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trendDetail.contentLibrary.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4 text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${item.platform === "youtube"
                                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                }`}>
                                {item.platform}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-semibold">
                                {item.engagement !== "N/A" ? item.engagement : ""}
                              </span>
                            </div>

                            <h4 className="font-bold text-zinc-150 text-sm leading-snug line-clamp-2">{item.title}</h4>
                            <p className="text-xs text-zinc-400 line-clamp-2">{item.summary}</p>
                          </div>

                          <div className="flex justify-between items-center border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-500 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(item.publishedDate).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => navigate(`/content/${item.id}`)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                            >
                              Open Details
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Creator Ideas Tab */}
                {activeTab === "ai" && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Recommended Content Concept Ideas
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { title: "Facebook Post Ideas (10)", list: trendDetail.aiRecommendations.facebook, icon: Share2, color: "text-blue-400" },
                        { title: "Reels Ideas (5)", list: trendDetail.aiRecommendations.reels, icon: Video, color: "text-pink-400" },
                        { title: "Carousel Ideas (5)", list: trendDetail.aiRecommendations.carousel, icon: Layers, color: "text-emerald-400" },
                        { title: "Blog Article Angles (3)", list: trendDetail.aiRecommendations.blog, icon: FileText, color: "text-orange-400" },
                        { title: "YouTube Video Concepts (3)", list: trendDetail.aiRecommendations.youtube, icon: PlayCircle, color: "text-red-400" },
                        { title: "LinkedIn Post Formats (3)", list: trendDetail.aiRecommendations.linkedin, icon: Award, color: "text-indigo-400" }
                      ].map((group) => (
                        <div key={group.title} className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-3">
                          <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                            <group.icon className={`h-4.5 w-4.5 ${group.color}`} />
                            {group.title}
                          </h4>
                          <ul className="space-y-2 list-decimal list-inside pl-1">
                            {group.list.map((idea, idx) => (
                              <li key={idx} className="text-xs text-zinc-350 leading-relaxed font-medium">
                                {idea}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Source Transparency Indicator */}
              <div className="p-4 border border-zinc-850 bg-zinc-900/5 rounded-2xl flex flex-wrap items-center gap-2 justify-between">
                <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                  Data Ingestion Pipeline Context Sources
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
                  {trendDetail.contentLibrary.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-zinc-950 border border-zinc-850 rounded">
                      {item.source}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generate Everything package box */}
              {generatedPackage && (
                <div className="p-6 border border-zinc-800 bg-zinc-950 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 animate-pulse text-yellow-400" />
                      Generated Master Trend Creator Package
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate("/studio")}
                        className="h-7 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-semibold text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" /> Go to AI Studio
                      </button>
                      <button
                        onClick={() => setGeneratedPackage(null)}
                        className="text-zinc-500 hover:text-zinc-350 cursor-pointer"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-350 leading-relaxed whitespace-pre-wrap font-sans text-left max-h-96 overflow-y-auto pr-1">
                    {generatedPackage.content}
                  </div>
                </div>
              )}

              {/* CTA Panel for Generate everything */}
              <div className="p-6 border border-zinc-850 bg-indigo-600/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-5">
                <div className="text-left space-y-1">
                  <h4 className="font-extrabold text-white text-base">Generate Creator Package</h4>
                  <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                    Automatically draft blog posts, scripts, carousels, threads, and visual tags for this trend tailored to your selected language.
                  </p>
                </div>
                <button
                  onClick={handleGenerateEverything}
                  disabled={generating}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-colors cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      Generating Package...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                      Generate Everything
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
