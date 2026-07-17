import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  PenTool, Sparkles, Send, Copy, Download, Check,
  FileText, ArrowLeft, RefreshCw, Cpu, Activity,
  Globe, Video, Link as LinkIcon, AlertCircle
} from "lucide-react";
import { useAuthStore } from "../services/authStore.js";
import api from "../services/api.js";

export default function AIStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramFormat = searchParams.get("format") || "LinkedIn";
  const paramContentId = searchParams.get("contentId") || "";

  // 1. Unified Input Source Tab
  const [inputType, setInputType] = useState("crawled_content");

  // Input states
  const [selectedContentId, setSelectedContentId] = useState(paramContentId);
  const [format, setFormat] = useState(paramFormat);
  const [instructions, setInstructions] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Form states for Custom Topic
  const [topicInput, setTopicInput] = useState("");
  const [audience, setAudience] = useState("Intermediate");
  const [language, setLanguage] = useState("Auto Detect");
  const [tone, setTone] = useState("Professional");
  const [keywords, setKeywords] = useState("");
  const [referenceUrls, setReferenceUrls] = useState("");
  const [topicInstructions, setTopicInstructions] = useState("");

  // Form states for Pasted Content
  const [pastedText, setPastedText] = useState("");

  // Form states for URL inputs (Website, FB Page, YT Video, Blog Article)
  const [urlInput, setUrlInput] = useState("");
  const [facebookSelection, setFacebookSelection] = useState("latest");

  // Competitor setup states (fallback from previous checkpoint)
  const [useCompetitorSource, setUseCompetitorSource] = useState(false);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState("");
  const [selectedCompetitorPostId, setSelectedCompetitorPostId] = useState("");

  const chatEndRef = useRef(null);

  // Sync format parameter from URL query
  useEffect(() => {
    if (paramFormat) setFormat(paramFormat);
  }, [paramFormat]);

  // Sync content item parameter from URL query
  useEffect(() => {
    if (paramContentId) {
      setSelectedContentId(paramContentId);
      setInputType("crawled_content");
    }
  }, [paramContentId]);

  // Auto-scroll chat history window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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
      // Fallback competitor post upgrade workflow
      if (useCompetitorSource && inputType === "crawled_content" && selectedCompetitorPostId) {
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
      }

      // Main redesigned workspace generation payload
      const payload = {
        inputType,
        format,
        instructions
      };

      if (inputType === "crawled_content") {
        payload.contentId = selectedContentId || null;
      } else if (inputType === "custom_topic") {
        payload.customTopic = {
          topic: topicInput,
          audience,
          language,
          tone,
          keywords,
          referenceUrls,
          instructions: topicInstructions
        };
      } else if (inputType === "paste_content") {
        payload.pastedContent = pastedText;
      } else {
        payload.url = urlInput;
        if (inputType === "facebook_url") {
          payload.facebookSelection = facebookSelection;
        }
      }

      const response = await api.post("/api/studio/generate", payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setGeneratedDraft(data.content);
      setChatHistory([
        { role: "assistant", text: `Here is your generated ${format} document. Feel free to refine it using the chat box below.` }
      ]);
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || "Content generation failed");
    }
  });

  // Refinement mutation (ChatGPT-style multi-turn edit history)
  const refineMutation = useMutation({
    mutationFn: async (instruction) => {
      const response = await api.post("/api/studio/refine", {
        currentContent: generatedDraft,
        chatPrompt: instruction,
        format,
        history: chatHistory
      });
      return response.data.data;
    },
    onSuccess: (data, instruction) => {
      setGeneratedDraft(data.content);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", text: instruction },
        { role: "assistant", text: `I have updated the document in the editor with your requested edits.` }
      ]);
      setChatPrompt("");
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || "Refinement failed");
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
    element.download = `trendpilot-workspace-${format.toLowerCase()}.md`;
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

    // Validation
    if (inputType === "custom_topic" && !topicInput.trim()) {
      alert("Please enter a Custom Topic title first.");
      return;
    }
    if (inputType === "paste_content" && !pastedText.trim()) {
      alert("Please paste text content first.");
      return;
    }
    if (["website_url", "facebook_url", "youtube_url", "blog_url"].includes(inputType) && !urlInput.trim()) {
      alert("Please enter a valid URL.");
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

  const getLoadingMessage = () => {
    if (inputType === "website_url") return "Live crawling website content and parsing HTML text...";
    if (inputType === "facebook_url") return "Crawling public Facebook Page and expanding captions...";
    if (inputType === "youtube_url") return "Extracting YouTube video metadata & chapters outline...";
    if (inputType === "blog_url") return "Ingesting blog article details programmatically...";
    if (inputType === "custom_topic") return "Synthesizing custom topic ideas and audience constraints...";
    if (inputType === "paste_content") return "Processing pasted raw text parameters...";
    return "Generating customized creator drafts...";
  };

  const sourceTabs = [
    { id: "crawled_content", name: "Crawled Content", icon: FileText },
    { id: "custom_topic", name: "Custom Topic", icon: PenTool },
    { id: "paste_content", name: "Paste Content", icon: Cpu },
    { id: "website_url", name: "Website URL", icon: Globe },
    { id: "facebook_url", name: "Facebook URL", icon: Sparkles },
    { id: "youtube_url", name: "YouTube URL", icon: Video },
    { id: "blog_url", name: "Blog URL", icon: LinkIcon }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
          <PenTool className="h-8 w-8 text-indigo-500" />
          AI Content Workspace
        </h1>
        <p className="text-zinc-400 mt-2 text-sm text-left">
          Redesigned creator hub to import raw content, paste transcripts, crawl competitor feeds, and refine assets continuously.
        </p>
      </div>

      {/* Segment Selector for Input Source */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Input Source Setup</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {sourceTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setInputType(t.id);
                setUseCompetitorSource(false);
              }}
              className={`flex flex-col items-center justify-center p-3 border rounded-2xl cursor-pointer text-center gap-1.5 transition-all duration-200 ${inputType === t.id
                ? "border-indigo-500 bg-indigo-950/20 text-indigo-400 shadow-md shadow-indigo-500/5 scale-[1.02]"
                : "border-zinc-850 bg-zinc-900/10 text-zinc-400 hover:bg-zinc-850/30 hover:text-zinc-200"
                }`}
            >
              <t.icon className="h-4.5 w-4.5" />
              <span className="text-[10px] font-bold truncate w-full">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main split workspace content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Side: Setup & Editor (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Setup controls */}
          <div className="p-6 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-5 text-left">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              1. Source Parameters & Constraints
            </h2>

            {/* DYNAMIC FORM RENDERING BASED ON ACTIVE INPUT TYPE */}

            {/* Tab 1: Crawled Content */}
            {inputType === "crawled_content" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-850/60">
                  <input
                    type="checkbox"
                    id="competitorToggle"
                    checked={useCompetitorSource}
                    onChange={(e) => setUseCompetitorSource(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-850 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="competitorToggle" className="text-xs font-bold text-zinc-300 cursor-pointer flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    Ingest tracked competitor post instead
                  </label>
                </div>

                {!useCompetitorSource ? (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Select Crawled Item</label>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-550 uppercase font-semibold">Select Competitor</label>
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
                      <label className="text-[10px] text-zinc-550 uppercase font-semibold">Select Post</label>
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
              </div>
            )}

            {/* Tab 2: Custom Topic */}
            {inputType === "custom_topic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Topic *</label>
                    <input
                      type="text"
                      placeholder="e.g. How AI Agents Will Change Software Development"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Target Audience</label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Professional Developers">Professional Developers</option>
                      <option value="Students">Students</option>
                      <option value="Business Owners">Business Owners</option>
                      <option value="Creators">Creators</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="Auto Detect">Auto Detect</option>
                      <option value="Bangla">Bangla</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Educational">Educational</option>
                      <option value="Casual">Casual</option>
                      <option value="Funny">Funny</option>
                      <option value="Storytelling">Storytelling</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Programming Hero Style">Programming Hero Style</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Keywords (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. AI, Agent, Dev, Tech"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Reference URLs (optional)</label>
                    <input
                      type="text"
                      placeholder="https://example.com/source"
                      value={referenceUrls}
                      onChange={(e) => setReferenceUrls(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-550 uppercase font-semibold">Additional Topic Instructions</label>
                  <textarea
                    placeholder="Provide specific notes on what elements to cover..."
                    value={topicInstructions}
                    onChange={(e) => setTopicInstructions(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Paste Content */}
            {inputType === "paste_content" && (
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-550 uppercase font-semibold">Paste Raw Source Content</label>
                <textarea
                  placeholder="Paste Facebook/LinkedIn post content, YouTube transcripts, PDF text blocks..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={6}
                  className="w-full p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none font-sans placeholder-zinc-700"
                />
              </div>
            )}

            {/* Tab 4-7: URL based inputs */}
            {["website_url", "facebook_url", "youtube_url", "blog_url"].includes(inputType) && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-550 uppercase font-semibold">
                    {inputType === "website_url" && "Website URL"}
                    {inputType === "facebook_url" && "Facebook Page URL"}
                    {inputType === "youtube_url" && "YouTube Video URL"}
                    {inputType === "blog_url" && "Blog Article URL"}
                  </label>
                  <input
                    type="url"
                    placeholder={
                      inputType === "website_url" ? "https://openai.com/blog" :
                        inputType === "facebook_url" ? "https://www.facebook.com/programmingHero" :
                          inputType === "youtube_url" ? "https://www.youtube.com/watch?v=..." :
                            "https://medium.com/blog-slug"
                    }
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none"
                  />
                </div>

                {inputType === "facebook_url" && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-550 uppercase font-semibold">Select Feed Range Strategy</label>
                    <select
                      value={facebookSelection}
                      onChange={(e) => setFacebookSelection(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="latest">Latest Post</option>
                      <option value="top">Top Performing Post (Engagement Matrix)</option>
                      <option value="5_posts">Latest 5 Posts</option>
                      <option value="10_posts">Latest 10 Posts</option>
                      <option value="all">Generate from All Ingested Posts</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Target format & Directives */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-550 uppercase font-semibold">Target Output Format</label>
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

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-550 uppercase font-semibold">Global Custom Directives</label>
                <input
                  type="text"
                  placeholder="e.g. Write in professional Bengali-English mix..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateClick}
              disabled={generateMutation.isPending}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Workspace Assets...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Output Assets
                </>
              )}
            </button>
          </div>

          {/* Editor block */}
          {generateMutation.isPending && (
            <div className="p-12 border border-zinc-850 bg-zinc-900/5 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-pulse">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-zinc-400">{getLoadingMessage()}</span>
            </div>
          )}

          {generatedDraft && !generateMutation.isPending && (
            <div className="p-6 border border-zinc-850 bg-zinc-900/15 rounded-2xl space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Workspace Document Editor
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
                className="w-full h-[520px] p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl text-zinc-350 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-800"
              />
            </div>
          )}
        </div>

        {/* Right Side: Refinement Panel (col-span-2) */}
        <div className="lg:col-span-2 p-6 border border-zinc-850 bg-zinc-900/10 rounded-2xl flex flex-col h-[740px] justify-between text-left relative">
          <div className="space-y-4 flex-1 flex flex-col justify-between overflow-hidden">
            <div className="border-b border-zinc-800/85 pb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Refinement Chat Workspace
              </h3>
              <span className="text-[9px] text-zinc-500 block mt-0.5">Iteratively instruct the AI to polish your draft.</span>
            </div>

            {/* Chat message logs */}
            <div className="flex-grow overflow-y-auto space-y-4 p-1 max-h-[580px]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-650 text-xs p-4 gap-2 leading-relaxed">
                  <Activity className="h-8 w-8 text-zinc-800" />
                  <span>Your conversation history will appear here. Generate a draft to start chat edits.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${msg.role === "user"
                        ? "bg-indigo-600 text-white border border-indigo-600 ml-auto"
                        : "bg-blue-50 text-black border border-blue-200 mr-auto text-left"
                        }`}
                    >
                      <div className="whitespace-pre-wrap font-light">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Form input */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-4 border-t border-zinc-850 mt-4">
            <input
              type="text"
              placeholder={generatedDraft ? "Make it shorter, Translate to Bangla..." : "Generate draft first..."}
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              disabled={refineMutation.isPending || !generatedDraft}
              className="flex-grow h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 disabled:opacity-40 font-light"
            />
            <button
              type="submit"
              disabled={refineMutation.isPending || !generatedDraft || !chatPrompt.trim()}
              className="h-10 w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer flex-shrink-0"
            >
              {refineMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
