import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, Plus, Trash2, RefreshCw, BarChart3, ShieldAlert, 
  Settings, Award, Target, Calendar, CheckSquare, Sparkles, 
  Send, Copy, Download, Check, HelpCircle, ArrowRight, Eye, Globe 
} from "lucide-react";
import api from "../services/api.js";
import { useAuthStore } from "../services/authStore.js";
import { useNavigate } from "react-router-dom";
import { useConfirmStore } from "../services/confirmStore.js";
import { useToastStore } from "../services/toastStore.js";

export default function CompetitorsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const showToast = useToastStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBeatOpen, setIsBeatOpen] = useState(false);
  const [beatPostData, setBeatPostData] = useState(null);
  const [beatenOutput, setBeatenOutput] = useState(null);
  const [beatenLoading, setBeatenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states for Add Competitor
  const [brandNameInput, setBrandNameInput] = useState("");
  const [pageUrlInput, setPageUrlInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Technology");

  // Form states for Brand Profile
  const [profileName, setProfileName] = useState("");
  const [profileIndustry, setProfileIndustry] = useState("");
  const [profileAudience, setProfileAudience] = useState("");
  const [profileTone, setProfileTone] = useState("");
  const [profilePlatforms, setProfilePlatforms] = useState([]);

  // Fetch queries
  const { data: competitorsResponse, isLoading: compsLoading } = useQuery({
    queryKey: ["competitors"],
    queryFn: async () => {
      const res = await api.get("/api/competitors");
      return res.data;
    }
  });

  const { data: postsResponse, isLoading: postsLoading } = useQuery({
    queryKey: ["competitorPosts"],
    queryFn: async () => {
      const res = await api.get("/api/competitors/posts");
      return res.data;
    }
  });

  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ["brandProfile"],
    queryFn: async () => {
      const res = await api.get("/api/competitors/profile");
      return res.data;
    }
  });

  const { data: reportsResponse, isLoading: reportsLoading } = useQuery({
    queryKey: ["competitorReports"],
    queryFn: async () => {
      const res = await api.get("/api/competitors/reports");
      return res.data;
    }
  });

  const competitors = competitorsResponse?.data || [];
  const posts = postsResponse?.data || [];
  const profile = profileResponse?.data;
  const reports = reportsResponse?.data || [];

  // Initialize Brand Profile Form
  useEffect(() => {
    if (profile) {
      setProfileName(profile.brandName || "");
      setProfileIndustry(profile.industry || "");
      setProfileAudience(profile.targetAudience || "");
      setProfileTone(profile.tone || "");
      setProfilePlatforms(profile.primaryPlatforms || []);
    }
  }, [profile]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/api/competitors", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitorPosts"] });
      setIsAddOpen(false);
      setBrandNameInput("");
      setPageUrlInput("");
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message || "Failed to add competitor", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/api/competitors/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["competitorPosts"] });
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/competitors/${id}/scan`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitorPosts"] });
      showToast("Competitor crawl complete. Ingested latest posts.", "success");
    }
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put("/api/competitors/profile", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandProfile"] });
      showToast("Brand Profile saved successfully!", "success");
    }
  });

  const compareMutation = useMutation({
    mutationFn: async (competitorIds) => {
      const res = await api.post("/api/competitors/compare", { competitorIds });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitorReports"] });
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message || "Comparison failed", "error");
    }
  });

  const weeklyStrategyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/competitors/weekly-strategy");
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitorReports"] });
    },
    onError: (err) => {
      showToast(err.response?.data?.message || err.message || "Failed to generate strategy", "error");
    }
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!user?.geminiApiKey) {
      showToast("Please add your Gemini API key in Settings before performing competitor intelligence crawls.", "error");
      navigate("/settings");
      return;
    }
    addMutation.mutate({
      brandName: brandNameInput,
      pageUrl: pageUrlInput,
      category: categoryInput
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    saveProfileMutation.mutate({
      brandName: profileName,
      industry: profileIndustry,
      targetAudience: profileAudience,
      tone: profileTone,
      primaryPlatforms: profilePlatforms
    });
  };

  const handleCompareClick = () => {
    if (!user?.geminiApiKey) {
      showToast("Please add your Gemini API key in Settings before performing AI comparisons.", "error");
      navigate("/settings");
      return;
    }
    if (selectedCompetitors.length === 0) {
      showToast("Please select at least one competitor to compare.", "error");
      return;
    }
    compareMutation.mutate(selectedCompetitors);
  };

  const handleWeeklyStrategyClick = () => {
    if (!user?.geminiApiKey) {
      showToast("Please add your Gemini API key in Settings before compiling AI weekly content strategies.", "error");
      navigate("/settings");
      return;
    }
    weeklyStrategyMutation.mutate();
  };

  const handleBeatClick = async (post) => {
    if (!user?.geminiApiKey) {
      showToast("Please add your Gemini API key in Settings before upgrading competitor assets.", "error");
      navigate("/settings");
      return;
    }
    setBeatPostData(post);
    setBeatenOutput(null);
    setIsBeatOpen(true);
    setBeatenLoading(true);

    try {
      const res = await api.post(`/api/competitors/posts/${post._id}/beat`);
      setBeatenOutput(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to generate content upgrade", "error");
      setIsBeatOpen(false);
    } finally {
      setBeatenLoading(false);
    }
  };

  const handleTrashPost = (postId) => {
    showConfirm({
      title: "Move Competitor Post to Trash?",
      description: "This content will be hidden from all analytics, trends, AI recommendations, and searches. It will remain in Trash for 10 days before being permanently deleted.",
      confirmLabel: "Move to Trash",
      confirmType: "danger",
      onConfirm: async () => {
        try {
          await api.put("/api/trash/move", { ids: [postId], type: "competitor" });
          queryClient.invalidateQueries({ queryKey: ["competitorPosts"] });
          showToast("Competitor post moved to Trash successfully!", "success");
        } catch (err) {
          showToast(err.response?.data?.message || "Failed to move post to trash", "error");
        }
      }
    });
  };

  const handleToggleSelectComp = (id) => {
    setSelectedCompetitors((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopyBeatText = () => {
    if (!beatenOutput) return;
    const structuredContent = `
# BEAT THIS COMPETITOR: ${beatPostData?.competitorId?.brandName || "Competitor"}
Original post url: ${beatPostData?.url || ""}

## 🧠 Strategic Weakness Analysis
${beatenOutput.analysis?.competitorWeakness}

## 🚀 Our Positioning Advantage
${beatenOutput.analysis?.ourAdvantage}

## 🎯 Better Hook
${beatenOutput.contentAssets?.betterHook}

## 📄 Better Caption (Facebook)
${beatenOutput.contentAssets?.betterCaption}

## 🐦 Better Twitter Thread
${beatenOutput.contentAssets?.twitterThread?.join("\n\n---\n\n")}

## 💼 Better LinkedIn Post
${beatenOutput.contentAssets?.linkedinPost}

## ✍ Better Blog Draft
${beatenOutput.contentAssets?.blogVersion}

## 💡 Visual Idea
${beatenOutput.contentAssets?.visualIdea}
`;
    navigator.clipboard.writeText(structuredContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find latest reports
  const activeComparisonReport = reports.find((r) => r.type === "comparison")?.reportData;
  const activeStrategyReport = reports.find((r) => r.type === "weekly_strategy")?.reportData;

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
            <Target className="h-8 w-8 text-indigo-500" />
            Competitor Intelligence
          </h1>
          <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
            Monitor rival pages, analyze strategic posting patterns, discover content gaps, and beat their copy.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Competitor Page
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800/80 gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-xs uppercase font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={`pb-3 text-xs uppercase font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "compare"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          🆚 Compare Rivals
        </button>
        <button
          onClick={() => setActiveTab("strategy")}
          className={`pb-3 text-xs uppercase font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "strategy"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          🧠 Strategic Plan
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs uppercase font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "profile"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          🎯 Brand Profile
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Competitors</span>
              <p className="text-2xl font-bold text-zinc-100">{competitors.length}</p>
            </div>
            <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Scraped Posts</span>
              <p className="text-2xl font-bold text-zinc-100">{posts.length}</p>
            </div>
            <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Formats Analyzed</span>
              <p className="text-2xl font-bold text-zinc-100">8 Formats</p>
            </div>
            <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-2">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">AI Content Gaps</span>
              <p className="text-2xl font-bold text-indigo-400">4 Opportunities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Tracked List */}
            <div className="lg:col-span-1 space-y-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Tracked Pages</h3>
              {compsLoading ? (
                <div className="h-20 bg-zinc-950/40 border border-zinc-800 animate-pulse rounded-2xl" />
              ) : competitors.length === 0 ? (
                <div className="p-8 border border-zinc-800 border-dashed rounded-2xl text-center">
                  <span className="text-xs text-zinc-500">No competitors added yet.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {competitors.map((comp) => (
                    <div key={comp._id} className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 truncate">
                        <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-indigo-400">
                          {comp.brandName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate text-left">
                          <p className="text-xs font-bold text-zinc-200 truncate">{comp.brandName}</p>
                          <span className="text-[10px] text-zinc-500 truncate block">{comp.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => scanMutation.mutate(comp._id)}
                          disabled={scanMutation.isPending}
                          className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Scan Feeds"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${scanMutation.isPending ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(comp._id)}
                          className="p-2 bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/35 rounded-lg text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Competitor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Ingested Posts Feed */}
            <div className="lg:col-span-2 space-y-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Latest Competitor Activity</h3>
              {postsLoading ? (
                <div className="h-40 bg-zinc-950/40 border border-zinc-800 animate-pulse rounded-2xl" />
              ) : posts.length === 0 ? (
                <div className="p-12 border border-zinc-800 border-dashed rounded-2xl text-center">
                  <span className="text-xs text-zinc-500">No competitor posts crawled yet. Click scan on a competitor.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post._id} className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 text-left">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center font-bold text-indigo-400 text-xs">
                            {post.competitorId?.brandName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-200">{post.competitorId?.brandName}</span>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              Ingested on {new Date(post.publishedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                          {post.format}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-zinc-300">{post.title}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-light">
                          {post.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
                        <div className="flex gap-4 text-[10px] text-zinc-500 font-semibold">
                          <span>👍 {post.engagement?.likes} likes</span>
                          <span>💬 {post.engagement?.comments} comments</span>
                          <span>🔗 {post.engagement?.shares} shares</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTrashPost(post._id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800/60 hover:border-rose-500/20 transition-all cursor-pointer"
                            title="Move to Trash"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleBeatClick(post)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-md shadow-indigo-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" />
                            Beat Post
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab Content */}
      {activeTab === "compare" && (
        <div className="space-y-8">
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Compare Competitors</h3>
              <p className="text-xs text-zinc-500">Select multiple competitors to generate comparative metrics.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {competitors.map((comp) => (
                <label
                  key={comp._id}
                  className={`flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer transition-colors ${
                    selectedCompetitors.includes(comp._id)
                      ? "border-indigo-500/50 bg-indigo-950/10 text-indigo-400"
                      : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/40 text-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCompetitors.includes(comp._id)}
                    onChange={() => handleToggleSelectComp(comp._id)}
                    className="rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold">{comp.brandName}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCompareClick}
                disabled={compareMutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {compareMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating Comparison Report...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Compile Comparison Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Comparison Report */}
          {compareMutation.isPending ? (
            <div className="h-40 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex items-center justify-center animate-pulse">
              <span className="text-xs text-zinc-400">AI is compiling report metrics...</span>
            </div>
          ) : activeComparisonReport ? (
            <div className="space-y-8">
              {/* Matrix of Strengths / Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-400" />
                    Competitor Core Strengths
                  </h3>
                  <div className="space-y-4">
                    {activeComparisonReport.strategicMatrix?.strengths?.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-xs font-bold text-zinc-200 block text-left">{item.brand}</span>
                        <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1 text-left">
                          {item.points.map((pt, pIdx) => <li key={pIdx}>{pt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    Weakness & Content Gaps
                  </h3>
                  <div className="space-y-4">
                    {activeComparisonReport.strategicMatrix?.weaknesses?.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-xs font-bold text-zinc-200 block text-left">{item.brand}</span>
                        <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1 text-left">
                          {item.points.map((pt, pIdx) => <li key={pIdx}>{pt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* In-depth comparative metrics table */}
              <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 text-left">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Topics Covered Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-zinc-400">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500">
                        <th className="pb-3 text-left">Topic Area</th>
                        {competitors.filter(c => selectedCompetitors.includes(c._id)).map(c => (
                          <th key={c._id} className="pb-3 text-left">{c.brandName}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/50">
                      {activeComparisonReport.topicsCovered?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/20">
                          <td className="py-3 font-semibold text-zinc-200">{row.topic}</td>
                          {competitors.filter(c => selectedCompetitors.includes(c._id)).map(c => {
                            const key = c.brandName.toLowerCase().includes("programming") ? "programmingHero" : "fcc";
                            return <td key={c._id} className="py-3 font-light">{row[key] || "Moderate Coverage"}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Opportunities list */}
              <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 text-left">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-indigo-400" />
                  Identified Content Gap Opportunities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeComparisonReport.contentGaps?.map((gap, idx) => (
                    <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-200">{gap.topic}</span>
                        <span className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-900 text-indigo-400 text-[8px] font-bold rounded uppercase">
                          Opportunity: {gap.opportunityScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-light">{gap.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 border border-zinc-800 border-dashed rounded-2xl text-center">
              <span className="text-xs text-zinc-500">Select competitors and click compile to generate AI reports.</span>
            </div>
          )}
        </div>
      )}

      {/* Weekly Strategy Tab */}
      {activeTab === "strategy" && (
        <div className="space-y-8">
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Weekly Content Ingestion Strategy</h3>
              <p className="text-xs text-zinc-500 mt-1">Get customized content posting schedule recommendations specifically matching your Brand Profile details.</p>
            </div>
            <button
              onClick={handleWeeklyStrategyClick}
              disabled={weeklyStrategyMutation.isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-colors flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              {weeklyStrategyMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Generate Weekly Strategy
                </>
              )}
            </button>
          </div>

          {/* Render Strategy Plan */}
          {weeklyStrategyMutation.isPending ? (
            <div className="h-40 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex items-center justify-center animate-pulse">
              <span className="text-xs text-zinc-400">AI is compiling customized weekly schedules...</span>
            </div>
          ) : activeStrategyReport ? (
            <div className="space-y-8 text-left">
              {/* Posting Calendar grid */}
              <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Weekly Posting Calendar</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {activeStrategyReport.postingCalendar?.map((cal, idx) => (
                    <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{cal.day}</span>
                        <h4 className="text-xs font-bold text-zinc-200">{cal.topic}</h4>
                      </div>
                      <div className="pt-2 border-t border-zinc-900 space-y-1">
                        <span className="text-[9px] font-semibold text-indigo-400 block">{cal.format}</span>
                        <span className="text-[9px] text-zinc-500 block">{cal.platform} - {cal.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Top 20 Ideas List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
                  AI Suggested Content Concepts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeStrategyReport.contentIdeas?.map((idea) => (
                    <div key={idea.id} className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs font-bold text-zinc-200">{idea.title}</h4>
                        <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                          {idea.recommendedFormat}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">{idea.concept}</p>
                      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5 text-[10px]">
                        <span className="text-zinc-500 font-bold block">Hook Idea:</span>
                        <p className="text-zinc-300 italic font-light">&ldquo;{idea.hookIdea}&rdquo;</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-[10px] text-zinc-500 font-semibold">
                        <span>Platform: {idea.targetPlatform}</span>
                        <span className="text-indigo-400 font-bold">Opportunity: High</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 border border-zinc-800 border-dashed rounded-2xl text-center">
              <span className="text-xs text-zinc-500">Click generate to compile personalized AI Strategy recommendations.</span>
            </div>
          )}
        </div>
      )}

      {/* Brand Profile Tab Content */}
      {activeTab === "profile" && (
        <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl text-left space-y-6">
          <div className="space-y-1 border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-4.5 w-4.5 text-indigo-400" />
              Configure Creator Brand Profile
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-light">
              Saving your target details lets the AI personalize all content gap alerts, formats adjustments, and strategy calendars.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Programming Hero"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Industry / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. EdTech, SaaS, Healthcare"
                  value={profileIndustry}
                  onChange={(e) => setProfileIndustry(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Target Audience Profile</label>
              <textarea
                placeholder="Describe your ideal audience (e.g. Polytechnic engineering students seeking developer jobs, junior coder beginners...)"
                value={profileAudience}
                onChange={(e) => setProfileAudience(e.target.value)}
                rows={3}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 placeholder-zinc-600 font-light"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Writing Tone / Brand Voice</label>
              <input
                type="text"
                placeholder="e.g. Friendly & Educational, Bengali-English mixed, conversational"
                value={profileTone}
                onChange={(e) => setProfileTone(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-colors cursor-pointer"
              >
                {saveProfileMutation.isPending ? "Saving Profile..." : "Save Brand Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Competitor Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-4 shadow-2xl relative text-left">
            <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Add Competitor Page</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI"
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Facebook Page URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.facebook.com/OpenAI"
                  value={pageUrlInput}
                  onChange={(e) => setPageUrlInput(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Category</label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="Technology">Technology & AI</option>
                  <option value="EdTech">EdTech & Courses</option>
                  <option value="Design">Graphic Design & Creative</option>
                  <option value="Marketing">Marketing Agency</option>
                </select>
              </div>

              <div className="flex justify-end pt-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  {addMutation.isPending ? "Adding Page..." : "Add Competitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beat Competitor Modal */}
      {isBeatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-6 shadow-2xl relative text-left h-[85vh] flex flex-col justify-between">
            <div className="border-b border-zinc-900 pb-3 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Beat Post: {beatPostData?.competitorId?.brandName || "Competitor"}
                </h3>
              </div>
              <button onClick={() => setIsBeatOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer">Close</button>
            </div>

            {beatenLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-4 animate-pulse">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-400">AI growth strategically outperforming the competitor post...</span>
              </div>
            ) : beatenOutput ? (
              <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                {/* Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-900 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Competitor Weakness</span>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">{beatenOutput.analysis?.competitorWeakness}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Our Advantages</span>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">{beatenOutput.analysis?.ourAdvantage}</p>
                  </div>
                </div>

                {/* Generated Content Options */}
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Upgraded Facebook Post</span>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-light">
                      {beatenOutput.contentAssets?.facebookPost || beatenOutput.contentAssets?.betterCaption}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">LinkedIn Professional Post</span>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-light">
                      {beatenOutput.contentAssets?.linkedinPost}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Upgraded Twitter/X Thread</span>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 space-y-3 font-light leading-relaxed">
                      {beatenOutput.contentAssets?.twitterThread?.map((t, idx) => (
                        <div key={idx} className="pb-3 border-b border-zinc-800 last:border-b-0">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Tweet {idx + 1}</span>
                          <p>{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Blog & SEO Draft</span>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-mono font-light">
                      {beatenOutput.contentAssets?.blogVersion}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Visual mockup guidelines</span>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-200 leading-relaxed font-light">
                      {beatenOutput.contentAssets?.visualIdea}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="border-t border-zinc-900 pt-4 flex justify-between items-center flex-shrink-0">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Tailored Tone: {profile?.tone || "General"}</span>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyBeatText}
                  disabled={!beatenOutput}
                  className="px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  Copy Master Document
                </button>
                <button
                  onClick={() => setIsBeatOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
