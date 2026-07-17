import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  ArrowLeft, FileText, Globe, PlayCircle, Clock, 
  BookOpen, Star, Sparkles, Send, Copy, Download,
  Check, ArrowRight, ShieldAlert, Cpu, Heart 
} from "lucide-react";
import api from "../services/api.js";

export default function ContentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // AI Studio Generation state
  const [studioFormat, setStudioFormat] = useState("LinkedIn");
  const [studioInstructions, setStudioInstructions] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Fetch content details, analysis and recommendations combined
  const { data: detailData, isLoading, isError, refetch } = useQuery({
    queryKey: ["content-details", id],
    queryFn: async () => {
      const response = await api.get(`/api/content/${id}`);
      return response.data.data;
    }
  });

  // AI Studio Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/studio/generate", {
        contentId: id,
        format: studioFormat,
        instructions: studioInstructions
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setGeneratedDraft(data.content);
      setChatHistory([{ role: "assistant", text: data.content }]);
    }
  });

  // AI Studio Refinement mutation
  const refineMutation = useMutation({
    mutationFn: async (instruction) => {
      const response = await api.post("/api/studio/refine", {
        currentContent: generatedDraft,
        chatPrompt: instruction,
        format: studioFormat
      });
      return response.data.data;
    },
    onSuccess: (data, instruction) => {
      setGeneratedDraft(data.content);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", text: instruction },
        { role: "assistant", text: data.content }
      ]);
      setChatPrompt("");
    }
  });

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col justify-center items-center gap-4">
        <Cpu className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-sm text-zinc-400">Loading Content Strategy Node...</span>
      </div>
    );
  }

  if (isError || !detailData) {
    return (
      <div className="py-24 text-center border border-dashed border-rose-500/10 bg-rose-500/5 rounded-2xl max-w-xl mx-auto space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto" />
        <h3 className="font-bold text-zinc-100">Failed to load content details</h3>
        <p className="text-xs text-zinc-400">Please check your network settings and database records.</p>
        <button
          onClick={() => navigate("/library")}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold hover:border-zinc-700 transition-colors"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const { content, analysis, recommendation } = detailData;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDraft], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${content.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${studioFormat.toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;
    refineMutation.mutate(chatPrompt);
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border border-zinc-800 hover:border-zinc-800 bg-zinc-900/10 rounded-xl text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-left">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
            Library Node / Details
          </span>
          <h1 className="text-xl font-bold text-white max-w-xl truncate leading-tight">
            {content.title}
          </h1>
        </div>
      </div>

      {/* Main split grid: Tabs on left, Quick meta on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Side: Dynamic Workspace Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs header */}
          <div className="flex border-b border-zinc-900 gap-6 overflow-x-auto pb-px">
            {[
              { id: "overview", label: "Overview & Source" },
              { id: "summary", label: "AI Summary" },
              { id: "competitor", label: "Competitor Analysis" },
              { id: "strategy", label: "Platform Strategy" },
              { id: "studio", label: "AI Content Studio" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative cursor-pointer flex-shrink-0 ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview & Source */}
          {activeTab === "overview" && (
            <div className="space-y-6 text-left">
              {/* Card info */}
              <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                  Source Metadata
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-xs">
                      {content.sourceId?.type === "facebook" ? "Facebook Page Name" : "Author"}
                    </span>
                    <p className="text-zinc-300 font-medium">{content.author || "Unknown"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-xs">Published Date</span>
                    <p className="text-zinc-300 font-medium">
                      {new Date(content.publishedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-xs">Original Format</span>
                    <p className="text-zinc-300 font-medium uppercase">{content.sourceId?.type || "website"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-xs">
                      {content.sourceId?.type === "facebook" ? "Original Post Link" : "Original URL"}
                    </span>
                    <p className="text-indigo-400 font-medium truncate">
                      <a href={content.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {content.url}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw content body */}
              <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                  Raw Ingested Text / Description
                </h3>
                <div className="max-h-96 overflow-y-auto bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl text-zinc-400 text-xs leading-relaxed whitespace-pre-wrap">
                  {content.rawText || content.description || "No parsed transcription content available."}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Summary */}
          {activeTab === "summary" && (
            <div className="space-y-6 text-left">
              {analysis ? (
                <>
                  {/* Summary card */}
                  <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase">
                      AI Executive Summary
                    </span>
                    <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                      Key Takeaways & Points
                    </h3>
                    <ul className="space-y-3">
                      {analysis.keyPoints.map((point, index) => (
                        <li key={index} className="flex gap-3 text-sm text-zinc-400 items-start">
                          <span className="text-indigo-400 font-bold mt-0.5">✔</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Keywords and tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Analyzed Topics
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysis.topics.map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-lg text-xs bg-zinc-950 border border-zinc-900 text-zinc-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Extracted Keywords
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((k) => (
                          <span key={k} className="px-2.5 py-1 rounded-lg text-xs bg-zinc-950 border border-zinc-900 text-zinc-400">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  This item is pending AI processing. Click Scan to run AI models.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Competitor Analysis */}
          {activeTab === "competitor" && (
            <div className="space-y-6 text-left">
              {recommendation && recommendation.competitorAnalysis ? (
                <div className="grid grid-cols-1 gap-6">
                  {/* Viral factors */}
                  <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5" />
                      Viral Factors (Why it worked)
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {recommendation.competitorAnalysis.viralFactors || "Explores specific hook triggers and emotional responses used in the original source."}
                    </p>
                  </div>

                  {/* Gaps */}
                  <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="h-4.5 w-4.5" />
                      Missed Opportunities
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {recommendation.competitorAnalysis.missedOpportunities || "Identifies technical details or strategic angles the competitor omitted."}
                    </p>
                  </div>

                  {/* Beat strategy */}
                  <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <Star className="h-4.5 w-4.5" />
                      How You Can Beat It
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
                      {recommendation.competitorAnalysis.beatStrategy || "Provides actionable guidelines for designing a superior content asset."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  Competitor intelligence not generated. Synthesize this content to generate insights.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Platform Strategy */}
          {activeTab === "strategy" && (
            <div className="space-y-6 text-left">
              {recommendation && recommendation.platformStrategy && recommendation.platformStrategy.length > 0 ? (
                <div className="space-y-4">
                  {recommendation.platformStrategy.map((strat) => (
                    <div
                      key={strat.platform}
                      className="p-5 border border-zinc-800 bg-zinc-950/30 rounded-2xl flex flex-col md:flex-row justify-between gap-5 hover:border-zinc-800 transition-colors"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap gap-3 items-center">
                          <span className="px-2.5 py-0.5 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-900/40 font-bold uppercase tracking-wider">
                            {strat.platform}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            Format: {strat.format}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                            Est. Reach: {strat.estimatedReach}
                          </span>
                          {strat.bestTime && (
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Best Time: {strat.bestTime}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs text-zinc-400 font-semibold italic">
                            &ldquo;{strat.hook}&rdquo;
                          </div>
                          <p className="text-xs text-zinc-500 whitespace-pre-wrap line-clamp-3">
                            {strat.captionDraft}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center">
                        <button
                          onClick={() => {
                            setStudioFormat(strat.platform);
                            setStudioInstructions(`Write in style of the ${strat.platform} draft: ${strat.hook}`);
                            setActiveTab("studio");
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <span>Open in AI Studio</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  No custom platform strategies found. Please verify recommendation model processing.
                </div>
              )}
            </div>
          )}

          {/* Tab 5: AI Content Studio (Sandbox Editor + Refinement Chat) */}
          {activeTab === "studio" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start text-left">
              {/* Generation Controls / Editor Panel (col-span-3) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Content Configuration
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wide">
                        Output Platform
                      </label>
                      <select
                        value={studioFormat}
                        onChange={(e) => setStudioFormat(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="LinkedIn">LinkedIn Post</option>
                        <option value="Twitter">Twitter Thread</option>
                        <option value="Facebook">Facebook Post</option>
                        <option value="YouTube">YouTube Video Script</option>
                        <option value="Blog">SEO Blog Article</option>
                        <option value="Newsletter">Newsletter Email</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wide">
                        Tone / Directives
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Beginner friendly, bold hook..."
                        value={studioInstructions}
                        onChange={(e) => setStudioInstructions(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none placeholder-zinc-600"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generateMutation.isPending ? "Generating Content..." : "Generate Master Draft"}
                  </button>
                </div>

                {/* Editor Textarea */}
                {generatedDraft && (
                  <div className="p-5 border border-zinc-800 bg-zinc-900/15 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                      <span className="text-xs font-bold text-zinc-300">Generated Markdown Draft</span>
                      <div className="flex gap-2">
                        {/* Copy button */}
                        <button
                          onClick={handleCopy}
                          className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-150 transition-colors cursor-pointer"
                          title="Copy to Clipboard"
                        >
                          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                        {/* Download button */}
                        <button
                          onClick={handleDownloadMarkdown}
                          className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-150 transition-colors cursor-pointer"
                          title="Download Markdown File"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={generatedDraft}
                      onChange={(e) => setGeneratedDraft(e.target.value)}
                      className="w-full h-[400px] p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-zinc-300 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-800"
                    />
                  </div>
                )}
              </div>

              {/* Interactive Chat Refinement (col-span-2) */}
              <div className="lg:col-span-2 p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col h-[580px] justify-between">
                <div className="space-y-4 flex-1 flex flex-col justify-between overflow-hidden">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/85 pb-3">
                    Refine with AI Chat
                  </h3>

                  {/* Chat message logs */}
                  <div className="flex-grow overflow-y-auto space-y-3 p-1 max-h-[420px]">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 text-xs p-4 gap-2">
                        <Sparkles className="h-8 w-8 text-zinc-800" />
                        <span>Generate a master draft first, then ask AI to refine, translate, shorten, or rewrite.</span>
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                            msg.role === "user"
                              ? "bg-indigo-600/15 text-indigo-300 border border-indigo-900/40 ml-auto"
                              : "bg-zinc-950/80 text-zinc-300 border border-zinc-900 mr-auto text-left"
                          }`}
                        >
                          {msg.role === "user" ? (
                            msg.text
                          ) : (
                            <div className="whitespace-pre-wrap line-clamp-6">
                              {msg.text.substring(0, 200)}...
                              <span className="text-[10px] text-zinc-500 block mt-1 italic">
                                Draft updated in main editor pane.
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendChat} className="flex gap-2 pt-4 border-t border-zinc-800">
                  <input
                    type="text"
                    placeholder="e.g. Translate to Bangla, Shorten, Add CTA..."
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    disabled={refineMutation.isPending || !generatedDraft}
                    className="flex-grow h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-800 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={refineMutation.isPending || !generatedDraft || !chatPrompt.trim()}
                    className="h-10 w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quick Stats Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 text-left">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">
              Growth Metrics
            </h3>

            {recommendation ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Opportunity Score</span>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-extrabold text-white">{recommendation.opportunityScore}</div>
                    <span className="text-xs text-zinc-500">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Trend Score</span>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-extrabold text-indigo-400">{recommendation.trendScore}</div>
                    <span className="text-xs text-zinc-500">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">AI Confidence</span>
                  <div className="text-sm font-bold text-zinc-300">
                    {(recommendation.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Suggested Format</span>
                  <div className="text-xs font-semibold text-zinc-300 uppercase bg-zinc-900 border border-zinc-800 px-2 py-1 rounded inline-block">
                    {recommendation.contentFormat}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">
                AI metrics unavailable. Scrapes some feeds to begin.
              </div>
            )}
          </div>

          {/* Quick Platform Tags card */}
          {recommendation && (
            <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-3 text-left">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Distribution Platforms
              </h4>
              <div className="flex flex-wrap gap-2">
                {recommendation.platform.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded text-[9px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 font-bold uppercase">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
