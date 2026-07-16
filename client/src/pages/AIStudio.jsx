import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  PenTool, Sparkles, Send, Copy, Download, Check, 
  FileText, ArrowLeft, RefreshCw, Cpu, Activity 
} from "lucide-react";
import { useAuthStore } from "../services/authStore.js";
import api from "../services/api.js";

export default function AIStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramFormat = searchParams.get("format") || "LinkedIn";
  const paramContentId = searchParams.get("contentId") || "";

  // Form states
  const [selectedContentId, setSelectedContentId] = useState(paramContentId);
  const [format, setFormat] = useState(paramFormat);
  const [instructions, setInstructions] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Competitor setup states
  const [useCompetitorSource, setUseCompetitorSource] = useState(false);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState("");
  const [selectedCompetitorPostId, setSelectedCompetitorPostId] = useState("");

  // Sync format parameter from URL query
  useEffect(() => {
    if (paramFormat) setFormat(paramFormat);
  }, [paramFormat]);

  // Sync content item parameter from URL query
  useEffect(() => {
    if (paramContentId) setSelectedContentId(paramContentId);
  }, [paramContentId]);

  // Load content library list for selection dropdown
  const { data: contentList = [], isLoading: listLoading } = useQuery({
    queryKey: ["studio-content-list"],
    queryFn: async () => {
      const response = await api.get("/api/content?limit=30&status=completed");
      return response.data.data;
    }
  });

  // Load tracked competitors
  const { data: competitorsResponse } = useQuery({
    queryKey: ["studio-competitors"],
    queryFn: async () => {
      const response = await api.get("/api/competitors");
      return response.data;
    }
  });
  const competitors = competitorsResponse?.data || [];

  // Load competitor posts
  const { data: competitorPostsResponse } = useQuery({
    queryKey: ["studio-competitor-posts"],
    queryFn: async () => {
      const response = await api.get("/api/competitors/posts");
      return response.data;
    }
  });
  const competitorPosts = competitorPostsResponse?.data || [];

  // Generate draft mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (useCompetitorSource && selectedCompetitorPostId) {
        const response = await api.post(`/api/competitors/posts/${selectedCompetitorPostId}/beat`);
        const data = response.data.data;
        const formatted = `
# STRATEGIC CONTENT DRAFT (BEAT COMPETITOR WORKFLOW)

## 🧠 Competitor Post Analysis
- Competitor Weakness: ${data.analysis?.competitorWeakness}
- Our Brand Advantage: ${data.analysis?.ourAdvantage}

## 🎯 Upgraded Hook Copy
${data.contentAssets?.betterHook}

## 📄 Upgraded Facebook Post
${data.contentAssets?.facebookPost || data.contentAssets?.betterCaption}

## 💼 Upgraded LinkedIn Post
${data.contentAssets?.linkedinPost}

## 🐦 Upgraded Twitter/X Thread
${Array.isArray(data.contentAssets?.twitterThread) ? data.contentAssets.twitterThread.join("\n\n---\n\n") : ""}

## ✍ Upgraded SEO Blog Post
${data.contentAssets?.blogVersion}

## 🖼 AI Visual Graphic Suggestion
${data.contentAssets?.visualIdea}

## 🚀 Why It Beats Them
${data.whyItBeatsThem}
        `.trim();
        return { content: formatted };
      } else {
        const response = await api.post("/api/studio/generate", {
          contentId: selectedContentId || null,
          format,
          instructions
        });
        return response.data.data;
      }
    },
    onSuccess: (data) => {
      setGeneratedDraft(data.content);
      setChatHistory([{ role: "assistant", text: data.content }]);
    }
  });

  // Refinement mutation
  const refineMutation = useMutation({
    mutationFn: async (instruction) => {
      const response = await api.post("/api/studio/refine", {
        currentContent: generatedDraft,
        chatPrompt: instruction,
        format
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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDraft], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `trendpilot-studio-${format.toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const { user } = useAuthStore();

  const handleGenerateClick = () => {
    if (!user?.geminiApiKey) {
      alert("⚠️ Gemini API Key is missing! Please configure your Google Gemini API Key in Settings first.");
      navigate("/settings");
      return;
    }
    generateMutation.mutate();
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;
    if (!user?.geminiApiKey) {
      alert("⚠️ Gemini API Key is missing! Please configure your Google Gemini API Key in Settings first.");
      navigate("/settings");
      return;
    }
    refineMutation.mutate(chatPrompt);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
          <PenTool className="h-8 w-8 text-indigo-500" />
          AI Creator Studio
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Select crawled trend items, specify output targets, and run real-time AI refinements.
        </p>
      </div>

      {/* Main split dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Side: Setup & Editor (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Setup controls */}
          <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-5 text-left">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              1. Choose Source & Target Format
            </h2>

            {/* Competitor Intelligence Ingestion Toggle */}
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="competitorToggle"
                checked={useCompetitorSource}
                onChange={(e) => setUseCompetitorSource(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-850 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="competitorToggle" className="text-xs font-bold text-zinc-300 cursor-pointer flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                Generate from Competitor Post (Strategic Content Upgrade)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Source Dropdown */}
              {!useCompetitorSource ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold">
                    Source Content Item
                  </label>
                  {listLoading ? (
                    <div className="h-10 bg-zinc-950/40 border border-zinc-850 animate-pulse rounded-xl" />
                  ) : (
                    <select
                      value={selectedContentId}
                      onChange={(e) => setSelectedContentId(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- No Source Reference (Draft from scratch) --</option>
                      {contentList.map((item) => (
                        <option key={item._id || item.id} value={item._id || item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">
                      Select Competitor Brand
                    </label>
                    <select
                      value={selectedCompetitorId}
                      onChange={(e) => {
                        setSelectedCompetitorId(e.target.value);
                        setSelectedCompetitorPostId("");
                      }}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Competitor --</option>
                      {competitors.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.brandName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">
                      Select Competitor Post
                    </label>
                    <select
                      value={selectedCompetitorPostId}
                      onChange={(e) => setSelectedCompetitorPostId(e.target.value)}
                      disabled={!selectedCompetitorId}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer disabled:opacity-40"
                    >
                      <option value="">-- Select Post --</option>
                      {competitorPosts
                        .filter((p) => p.competitorId?._id === selectedCompetitorId)
                        .map((post) => (
                          <option key={post._id} value={post._id}>
                            [{post.format}] {post.title.substring(0, 45)}...
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Select format */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-semibold">
                  Target Platform / Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Magic Studio">
                    <option value="Generate_Everything">Generate Everything ✨</option>
                  </optgroup>
                  <optgroup label="Social Content">
                    <option value="Facebook">Facebook Post</option>
                    <option value="LinkedIn">LinkedIn Post</option>
                    <option value="Twitter">Twitter Thread</option>
                    <option value="Instagram">Instagram Caption</option>
                    <option value="Hashtags">Hashtags Generator</option>
                  </optgroup>
                  <optgroup label="YouTube Studio">
                    <option value="YT_Titles">Viral YouTube Titles</option>
                    <option value="YT_Thumbnail">Thumbnail Text Overlay</option>
                    <option value="YT_Desc">SEO Video Description</option>
                    <option value="YT_Timestamps">Smart Chapters/Timestamps</option>
                    <option value="YT_Tags">Video Tags List</option>
                    <option value="YT_Community">Community Post Draft</option>
                    <option value="YT_Script">YouTube Video Script</option>
                  </optgroup>
                  <optgroup label="Blog & SEO">
                    <option value="Blog">Full SEO Article</option>
                    <option value="Meta">SEO Meta Details</option>
                    <option value="FAQ">FAQ Section</option>
                  </optgroup>
                  <optgroup label="Marketing">
                    <option value="Newsletter">Newsletter Email</option>
                    <option value="Email_Campaign">Email Campaign Sequence</option>
                    <option value="CTA">CTA Generator</option>
                    <option value="Image_Prompt">AI Image Prompt (Midjourney)</option>
                    <option value="Carousel">Slide Carousel Copy</option>
                  </optgroup>
                  <optgroup label="Refine & Translate">
                    <option value="Rewrite">Rewrite Draft</option>
                    <option value="Translate">Translate Draft</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Directives input */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-semibold">
                Creator Directives / Direct Instructions
              </label>
              <textarea
                placeholder="Describe your writing requirements (e.g. Write a friendly, informational article with a funny intro. Focus on developers...)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none placeholder-zinc-700 leading-relaxed"
              />
            </div>

            <button
              onClick={handleGenerateClick}
              disabled={generateMutation.isPending}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Draft Assets...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Draft Content
                </>
              )}
            </button>
          </div>

          {/* Sandbox Editor block */}
          {generatedDraft && (
            <div className="p-6 border border-zinc-850 bg-zinc-900/15 rounded-2xl space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Studio Document Editor
                  </h3>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                    Format: {format}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-150 transition-colors cursor-pointer"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
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
                className="w-full h-[450px] p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-zinc-300 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-800"
              />
            </div>
          )}
        </div>

        {/* Right Side: Chat Refinements Panel (col-span-2) */}
        <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-900/10 rounded-2xl flex flex-col h-[670px] justify-between text-left">
          <div className="space-y-4 flex-1 flex flex-col justify-between overflow-hidden">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/85 pb-3">
              Refinement Chat pane
            </h3>

            {/* Chat message logs */}
            <div className="flex-grow overflow-y-auto space-y-4 p-1 max-h-[500px]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 text-xs p-4 gap-2 leading-relaxed">
                  <Activity className="h-8 w-8 text-zinc-800" />
                  <span>Configure options on the left, generate a master draft first, and refine your social copy here.</span>
                </div>
              ) : (
                chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600/15 text-indigo-300 border border-indigo-900/40 ml-auto"
                        : "bg-zinc-950/85 text-zinc-300 border border-zinc-900 mr-auto text-left"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.text
                    ) : (
                      <div className="whitespace-pre-wrap line-clamp-8">
                        {msg.text.substring(0, 300)}...
                        <span className="text-[10px] text-zinc-500 block mt-2 italic font-semibold">
                          Draft document updated in main editor pane.
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form input */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-4 border-t border-zinc-850">
            <input
              type="text"
              placeholder="e.g. Translate to Bangla, Shorten, Add CTA..."
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              disabled={refineMutation.isPending || !generatedDraft}
              className="flex-grow h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-zinc-800 disabled:opacity-50"
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
    </div>
  );
}
