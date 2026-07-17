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
import { useToastStore } from "../services/toastStore.js";

export default function Trends() {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
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
      showToast("Trend package generated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to generate creator package", "error");
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
      showToast("Competitor beat strategy compiled successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to compile competitor beat blueprint", "error");
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
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
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
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs placeholder-zinc-600 focus:outline-none focus:border-zinc-700 text-zinc-300"
              />
            </div>

            {/* List */}
            {listLoading ? (
              <div className="py-12 flex justify-center">
                <Activity className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No computed trends found. Ingest active channels to run summaries and compile trends.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredTopics.map((t) => (
                  <div
                    key={t.topic}
                    onClick={() => {
                      setSearchParams({ topic: t.topic });
                      setGeneratedPackage(null);
                      setBeatingCompetitor(null);
                      setCompetitorStrategy(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2.5 ${selectedTopic.toLowerCase() === t.topic.toLowerCase()
                        ? "border-indigo-500/80 bg-indigo-500/5"
                        : "border-zinc-800 bg-zinc-950/20 hover:border-zinc-800"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-zinc-150 text-xs tracking-wide">{t.topic}</span>
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 flex-shrink-0">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {t.weeklyGrowth}
                      </span>
                    </div>

                    {/* Stats metrics list */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-500 pt-1 border-t border-zinc-900/40">
                      <div>📝 <strong className="text-zinc-400">{t.articlesCount}</strong> Articles</div>
                      <div>🎥 <strong className="text-zinc-400">{t.videosCount}</strong> Videos</div>
                      <div>👥 <strong className="text-zinc-400">{t.fbCount}</strong> FB Posts</div>
                      <div>🎯 <strong className="text-zinc-400">{t.competitorsCount}</strong> Competitors</div>
                    </div>

                    {/* Sources Row */}
                    {t.sources && t.sources.length > 0 && (
                      <div className="text-[9px] text-zinc-500 leading-snug pt-1 border-t border-zinc-900/30 space-y-0.5">
                        <span className="font-semibold text-zinc-655 uppercase block mb-0.5">Sources:</span>
                        <div className="flex flex-wrap gap-1">
                          {t.sources.slice(0, 3).map((s, idx) => {
                            const icon = s.type === "youtube" ? "📺" : (s.type === "facebook" ? "📘" : (s.type === "blog" ? "📘" : "🌐"));
                            return (
                              <span key={idx} className="bg-zinc-950/60 border border-zinc-900 px-1.5 py-0.5 rounded text-[8px] text-zinc-400">
                                {icon} {s.name}
                              </span>
                            );
                          })}
                          {t.sources.length > 3 && (
                            <span className="text-[8px] text-zinc-600">+{t.sources.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-zinc-600 pt-1.5 border-t border-zinc-900/60">
                      <span>Updated {new Date(t.lastUpdated).toLocaleDateString()}</span>
                      <span className="font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded-lg text-[9px]">
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
            <div className="p-16 text-center border border-dashed border-zinc-800 bg-zinc-900/5 rounded-2xl text-zinc-500 text-sm">
              Select an exploding database trend on the left to view deep insights.
            </div>
          ) : detailLoading ? (
            <div className="p-24 text-center border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
              <Activity className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
              <p className="text-zinc-500 text-xs">Compiling competitor mentions, gap ratios, and loading Gemini intelligence...</p>
            </div>
          ) : !detailSuccess ? (
            <div className="p-12 text-center border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
              <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto" />
              <h3 className="font-bold text-zinc-300 text-sm">No Crawl Matches</h3>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                {emptyMessage || "No crawled competitor posts or library summaries exist in MongoDB for this trend query. Ingest active feeds to analyze."}
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Trend Detail Card Header */}
              <div className="p-6 border border-zinc-800 bg-zinc-900/15 rounded-3xl space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900/80 pb-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      Trend Intelligence Dashboard
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">{selectedTopic}</h2>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-2xl min-w-[90px]">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">Trend Score</div>
                      <div className="text-lg font-black text-indigo-400 mt-0.5">{activeTopicInfo?.trendScore || 85}</div>
                    </div>
                    <div className="text-center bg-zinc-950 border border-zinc-900 px-4 py-2 rounded-2xl min-w-[90px]">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">Growth</div>
                      <div className="text-lg font-black text-emerald-450 mt-0.5">{activeTopicInfo?.weeklyGrowth || "+12%"}</div>
                    </div>
                  </div>
                </div>

                {/* Mentioned By Sources */}
                {trendDetail.sources && trendDetail.sources.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mentioned By</div>
                    <div className="flex flex-wrap gap-2">
                      {trendDetail.sources.map((s, idx) => {
                        const icon = s.type === "youtube" ? "📺" : (s.type === "facebook" ? "📘" : (s.type === "blog" ? "📘" : "🌐"));
                        return (
                          <span key={idx} className="bg-zinc-950/80 border border-zinc-900 px-2.5 py-1 rounded-xl text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                            <span className="text-[11px]">{icon}</span> {s.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Why Trending */}
                <div className="space-y-2 border-t border-zinc-900/60 pt-4">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-indigo-400" />
                    Why Trending
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {trendDetail.whyGrowing || `Mentions and interest inside monitored channels are rising dynamically.`}
                  </p>
                </div>

                {/* Related Keywords & Tags */}
                <div className="space-y-2 border-t border-zinc-900/60 pt-4">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Related Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {trendDetail.keywords && trendDetail.keywords.map((kw) => (
                      <span key={kw} className="text-[10px] font-bold bg-zinc-950 text-zinc-450 border border-zinc-800 px-2 py-0.5 rounded-lg">
                        #{kw}
                      </span>
                    ))}
                    {trendDetail.hashtags && trendDetail.hashtags.map((ht) => (
                      <span key={ht} className="text-[10px] font-bold bg-indigo-950/20 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded-lg">
                        #{ht}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Opportunity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-900/60 pt-4">
                  <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl text-center space-y-1">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Opportunity Score</div>
                    <div className="text-2xl font-black text-indigo-400">{trendDetail.opportunityScore || 91} <span className="text-xs text-zinc-600">/ 100</span></div>
                  </div>
                  <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl text-center space-y-1">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Competition</div>
                    <div className="text-sm font-bold text-zinc-200 mt-1.5">{trendDetail.opportunityAnalysis?.competition || "Medium"}</div>
                  </div>
                  <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl text-center space-y-1">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Recommended Formats</div>
                    <div className="text-[10px] text-zinc-450 mt-1.5 flex flex-col gap-0.5 font-semibold">
                      {trendDetail.bestFormats && trendDetail.bestFormats.slice(0, 3).map(f => (
                        <span key={f}>✓ {f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-900 overflow-x-auto gap-2">
                {[
                  { id: "library", label: "Matching Crawls" },
                  { id: "gap", label: "Gap Analysis" },
                  { id: "competitors", label: "Competitor Intel" },
                  { id: "ai", label: "Creator Studio" }
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

                {/* 2. Gap Analysis Tab */}
                {activeTab === "gap" && (
                  <div className="space-y-6">
                    {/* Opportunity Score info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl text-center space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Opportunity Score</div>
                        <div className="text-3xl font-black text-indigo-400">{trendDetail.opportunityAnalysis.score} <span className="text-xs text-zinc-500">/ 100</span></div>
                      </div>
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl text-center space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Estimated Competition</div>
                        <div className="text-xl font-bold text-zinc-200 mt-1">{trendDetail.opportunityAnalysis.competition}</div>
                      </div>
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl text-center space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Audience Interest</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{trendDetail.opportunityAnalysis.interest}</div>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-800 bg-indigo-500/5 rounded-2xl space-y-2">
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
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">Competitors Covered</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.covered}</p>
                      </div>
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">What Competitors Missed</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.missed}</p>
                      </div>
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">What Users Are Asking</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.userQuestions}</p>
                      </div>
                      <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
                        <h5 className="text-[10px] text-zinc-500 font-bold uppercase">Topics Left Unexplained</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trendDetail.contentGap.unexplained}</p>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
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
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Zap className="h-4 w-4 animate-bounce" />
                            Beating Strategy: {beatingCompetitor}
                          </h4>
                          <button
                            onClick={() => {
                              setBeatingCompetitor(null);
                              setCompetitorStrategy(null);
                            }}
                            className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
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
                          <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-left max-h-96 overflow-y-auto pr-1">
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
                            className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left"
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
                                className="flex-1 md:flex-none h-8 px-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-[10px] font-semibold text-zinc-400 transition-colors cursor-pointer"
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
                  <div className="space-y-6">
                    {/* Section 1: Matching Articles */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        Matching Articles ({trendDetail.contentLibrary.filter(item => item.platform !== "youtube").length})
                      </h3>
                      {trendDetail.contentLibrary.filter(item => item.platform !== "youtube").length === 0 ? (
                        <div className="text-xs text-zinc-500 italic py-4 pl-1">No matching database articles found.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trendDetail.contentLibrary.filter(item => item.platform !== "youtube").map((item) => (
                            <div key={item.id} className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4 text-left">
                              <div className="space-y-1.5">
                                <h4 className="font-bold text-zinc-150 text-sm leading-snug line-clamp-2">{item.title}</h4>
                                <p className="text-xs text-zinc-400 line-clamp-2">{item.summary}</p>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900 pt-2.5 font-medium">
                                <span>{item.source} • {new Date(item.publishedDate).toLocaleDateString()}</span>
                                <button onClick={() => navigate(`/content/${item.id}`)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 bg-transparent border-none p-0 cursor-pointer">
                                  Details <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Matching YouTube Videos */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
                        <Video className="h-4 w-4 text-red-400" />
                        Matching YouTube Videos ({trendDetail.contentLibrary.filter(item => item.platform === "youtube").length})
                      </h3>
                      {trendDetail.contentLibrary.filter(item => item.platform === "youtube").length === 0 ? (
                        <div className="text-xs text-zinc-500 italic py-4 pl-1">No matching YouTube videos found.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trendDetail.contentLibrary.filter(item => item.platform === "youtube").map((item) => (
                            <div key={item.id} className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4 text-left">
                              <div className="space-y-1.5">
                                <h4 className="font-bold text-zinc-150 text-sm leading-snug line-clamp-2">{item.title}</h4>
                                <p className="text-xs text-zinc-400 line-clamp-2">{item.summary}</p>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900 pt-2.5 font-medium">
                                <span>{item.source} • {new Date(item.publishedDate).toLocaleDateString()}</span>
                                <button onClick={() => navigate(`/content/${item.id}`)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 bg-transparent border-none p-0 cursor-pointer">
                                  Details <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Matching Facebook & Competitor Posts */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
                        <Share2 className="h-4 w-4 text-blue-400" />
                        Matching Facebook & Competitor Posts ({trendDetail.competitorIntelligence.reduce((sum, c) => sum + c.postCount, 0)})
                      </h3>
                      {trendDetail.competitorIntelligence.length === 0 ? (
                        <div className="text-xs text-zinc-500 italic py-4 pl-1">No matching competitor posts found.</div>
                      ) : (
                        <div className="space-y-3">
                          {trendDetail.competitorIntelligence.map((comp) => (
                            <div key={comp.brandName} className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-2xl text-left space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-zinc-200 text-sm">{comp.brandName}</h4>
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded-lg">
                                  Avg Likes: {comp.avgLikes}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed italic">
                                Best Performing: &ldquo;{comp.bestPost}&rdquo;
                              </p>
                              <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-900/40">
                                Platform: {comp.platform} | Crawled Posts Count: {comp.postCount} | Last Active: {new Date(comp.latestDate).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                        <div key={group.title} className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                          <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                            <group.icon className={`h-4.5 w-4.5 ${group.color}`} />
                            {group.title}
                          </h4>
                          <ul className="space-y-2 list-decimal list-inside pl-1">
                            {group.list.map((idea, idx) => (
                              <li key={idx} className="text-xs text-zinc-300 leading-relaxed font-medium">
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
              <div className="p-4 border border-zinc-800 bg-zinc-900/5 rounded-2xl flex flex-wrap items-center gap-2 justify-between">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Data Ingestion Pipeline Context Sources
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
                  {trendDetail.contentLibrary.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                      {item.source}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generate Everything package box */}
              {generatedPackage && (
                <div className="p-6 border border-zinc-800 bg-zinc-950 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
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
                        className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-left max-h-96 overflow-y-auto pr-1">
                    {generatedPackage.content}
                  </div>
                </div>
              )}

              {/* CTA Panel for Generate everything */}
              <div className="p-6 border border-zinc-800 bg-indigo-600/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-5">
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
