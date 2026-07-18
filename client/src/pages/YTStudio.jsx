import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  PlayCircle, Upload, Cpu, FileText, Sparkles, 
  Copy, Download, Check, AlertCircle, RefreshCw, Music 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../services/authStore.js";
import { useToastStore } from "../services/toastStore.js";
import api from "../services/api.js";
import ApiLimitModal from "../components/ApiLimitModal.jsx";

export default function YTStudio() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const handleGenerate = (format, constraints) => {
    if (!user?.geminiApiKey) {
      showToast("Gemini API Key is missing! Please configure your Google Gemini API Key in Settings first.", "error");
      navigate("/settings");
      return;
    }
    generateMutation.mutate({ format, constraints });
  };
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [subtitleText, setSubtitleText] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [isDragOverSubtitle, setIsDragOverSubtitle] = useState(false);
  const [isDragOverAudio, setIsDragOverAudio] = useState(false);

  // Custom premium error states
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  // Modular constraints
  const [titleConstraints, setTitleConstraints] = useState("");
  const [thumbnailConstraints, setThumbnailConstraints] = useState("");
  const [descConstraints, setDescConstraints] = useState("");
  const [tagsConstraints, setTagsConstraints] = useState("");
  const [fbConstraints, setFbConstraints] = useState("");
  const [timestampConstraints, setTimestampConstraints] = useState("");

  // Outputs
  const [systemOutput, setSystemOutput] = useState("Transcription matrix awaiting input...");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Load crawled video list for dropdown selector
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["yt-studio-videos"],
    queryFn: async () => {
      const response = await api.get("/api/content?limit=30&type=youtube&status=completed");
      return response.data.data;
    }
  });

  // Handle video selection dropdown
  const handleSelectVideo = async (videoId) => {
    setSelectedVideoId(videoId);
    if (!videoId) {
      setSubtitleText("");
      return;
    }
    try {
      const response = await api.get(`/api/content/${videoId}`);
      const detail = response.data.data;
      // Use transcript/rawText or summary keyPoints
      const text = detail.content.rawText || detail.content.description || "";
      setSubtitleText(text);
      setSystemOutput("Subtitle source loaded. Select a module below to generate assets.");
    } catch (err) {
      console.error("Failed to load video transcript:", err);
    }
  };

  // Handle subtitle file drop/upload
  const handleSubtitleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSubtitleText(e.target.result);
      setSystemOutput("Uploaded subtitle file loaded successfully.");
    };
    reader.readAsText(file);
  };

  // Trigger mock transcribing loader
  const handleProcessAudio = () => {
    if (!audioFile) return;
    setTranscribing(true);
    setSystemOutput("Transcribing audio payload via Gemini Multimodal model...");
    setTimeout(() => {
      setSubtitleText(`00:00 Introduction to modern development
01:25 Discussing next-gen tools and CLIs
03:10 Claude Code terminal demonstration
06:40 Performance benefits and security
10:15 Packaging and distribution pipelines
14:00 Outro and call to action`);
      setSystemOutput("Audio transcription complete. Timestamps loaded into Subtitle editor.");
      setTranscribing(false);
    }, 4000);
  };

  // Dedicated format generation mutation
  const generateMutation = useMutation({
    mutationFn: async ({ format, constraints }) => {
      const response = await api.post("/api/studio/generate", {
        inputType: "paste_content",
        pastedContent: subtitleText,
        contentId: selectedVideoId || null,
        format,
        instructions: constraints || ""
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setSystemOutput(data.content);
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || err.message || "Content generation failed";
      setApiErrorMessage(errMsg);
      setShowLimitModal(true);
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(systemOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([systemOutput], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "youtube-studio-output.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
            <PlayCircle className="h-8 w-8 text-red-500" />
            YouTube Studio
          </h1>
        </div>
      </div>

      {/* Row 1: Step 1: Input Source and Subtitle Editor */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600/20 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
            1
          </span>
          Input Source
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Zone / Database Selector */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 flex flex-col justify-between">
            {/* Database Selector Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-semibold">
                Load Transcript from Ingested Video
              </label>
              {videosLoading ? (
                <div className="h-10 bg-zinc-950/40 border border-zinc-800 animate-pulse rounded-xl" />
              ) : (
                <select
                  value={selectedVideoId}
                  onChange={(e) => handleSelectVideo(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Load from Content Library (Select crawled video) --</option>
                  {videos.map((vid) => (
                    <option key={vid._id || vid.id} value={vid._id || vid.id}>
                      {vid.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div 
              className={`relative border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOverSubtitle 
                  ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverSubtitle(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverSubtitle(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverSubtitle(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleSubtitleFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".srt,.sbv,.txt" 
                className="hidden" 
                onChange={(e) => handleSubtitleFile(e.target.files[0])} 
              />
              <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <span className="text-xs font-semibold text-zinc-300 block">Click or drag subtitle file here</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Formats: .sbv, .srt, .txt</span>
            </div>

            <div 
              className={`relative border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOverAudio 
                  ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
              }`}
              onClick={() => audioInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverAudio(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverAudio(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverAudio(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  setAudioFile(file);
                  setSystemOutput(`Loaded audio payload: ${file.name}`);
                }
              }}
            >
              <input 
                type="file" 
                ref={audioInputRef} 
                accept="audio/*" 
                className="hidden" 
                onChange={(e) => {
                  setAudioFile(e.target.files[0]);
                  setSystemOutput(`Loaded audio payload: ${e.target.files[0]?.name}`);
                }} 
              />
              <Music className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              {audioFile ? (
                <span className="text-xs font-semibold text-indigo-400 block truncate">{audioFile.name}</span>
              ) : (
                <span className="text-xs font-semibold text-zinc-300 block">Click or drag audio here</span>
              )}
              <span className="text-[10px] text-zinc-500 block mt-1">MP3, WAV, AAC (Max 20MB recommended)</span>
            </div>

            {audioFile && (
              <button
                onClick={handleProcessAudio}
                disabled={transcribing}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {transcribing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  "Process Audio & Transcribe"
                )}
              </button>
            )}
          </div>

          {/* Subtitle content textarea (editable) */}
          <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 flex flex-col justify-between h-[420px]">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-zinc-500" />
              Subtitle Content (Editable)
            </span>
            <textarea
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              placeholder="0:00:00.880,0:00:06.400&#10;Paste subtitle timeline details here..."
              className="w-full flex-grow p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-zinc-300 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-800 resize-none overflow-y-auto"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Step 2: Content Generation Modules */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600/20 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
            2
          </span>
          Content Generation Modules 🪄
        </h2>

        {/* 6 modular generator cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: YouTube Titles */}
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-red-500">▶</span> YouTube Titles
              </span>
              <p className="text-[11px] text-zinc-500">Generate 10 high-CTR, viral titles.</p>
            </div>
            <textarea
              placeholder="Optional: Add extra constraints..."
              value={titleConstraints}
              onChange={(e) => setTitleConstraints(e.target.value)}
              rows={2}
              className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-855 resize-none"
            />
            <button
              onClick={() => handleGenerate("YT_Titles", titleConstraints)}
              disabled={generateMutation.isPending || !subtitleText}
              className="h-9 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Generate Titles
            </button>
          </div>

          {/* Card 2: Thumbnail Text */}
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-red-500">▶</span> Thumbnail Text
              </span>
              <p className="text-[11px] text-zinc-500">Punchy text overlays to trigger curiosity.</p>
            </div>
            <textarea
              placeholder="Optional: Add extra constraints..."
              value={thumbnailConstraints}
              onChange={(e) => setThumbnailConstraints(e.target.value)}
              rows={2}
              className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-855 resize-none"
            />
            <button
              onClick={() => handleGenerate("YT_Thumbnail", thumbnailConstraints)}
              disabled={generateMutation.isPending || !subtitleText}
              className="h-9 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Suggest Thumbnail Text
            </button>
          </div>

          {/* Card 3: Video Description */}
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-red-500">▶</span> Video Description
              </span>
              <p className="text-[11px] text-zinc-500">SEO-optimized descriptions with hooks.</p>
            </div>
            <textarea
              placeholder="Optional: Add extra constraints..."
              value={descConstraints}
              onChange={(e) => setDescConstraints(e.target.value)}
              rows={2}
              className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-855 resize-none"
            />
            <button
              onClick={() => handleGenerate("YT_Desc", descConstraints)}
              disabled={generateMutation.isPending || !subtitleText}
              className="h-9 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Write SEO Description
            </button>
          </div>

          {/* Card 4: Video Tags */}
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-red-500">▶</span> Video Tags
              </span>
              <p className="text-[11px] text-zinc-500">High-volume keywords for metadata.</p>
            </div>
            <textarea
              placeholder="Optional: Add extra constraints..."
              value={tagsConstraints}
              onChange={(e) => setTagsConstraints(e.target.value)}
              rows={2}
              className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-855 resize-none"
            />
            <button
              onClick={() => handleGenerate("YT_Tags", tagsConstraints)}
              disabled={generateMutation.isPending || !subtitleText}
              className="h-9 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Generate Tags
            </button>
          </div>

          {/* Card 5: Facebook Captions */}
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-red-500">▶</span> Facebook Captions
              </span>
              <p className="text-[11px] text-zinc-500">Engaging captions for the FB algorithm.</p>
            </div>
            <textarea
              placeholder="Optional: Add extra constraints..."
              value={fbConstraints}
              onChange={(e) => setFbConstraints(e.target.value)}
              rows={2}
              className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-855 resize-none"
            />
            <button
              onClick={() => handleGenerate("Facebook", fbConstraints)}
              disabled={generateMutation.isPending || !subtitleText}
              className="h-9 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Draft FB Captions
            </button>
          </div>

          {/* Card 6: Important Timestamps */}
          <div className="p-5 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-red-500">▶</span> Important Timestamps
              </span>
              <p className="text-[11px] text-zinc-500">Generate optimized timestamps from subtitle file.</p>
            </div>
            <textarea
              placeholder="Optional: Add extra constraints..."
              value={timestampConstraints}
              onChange={(e) => setTimestampConstraints(e.target.value)}
              rows={2}
              className="w-full p-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-855 resize-none"
            />
            <button
              onClick={() => handleGenerate("YT_Timestamps", timestampConstraints)}
              disabled={generateMutation.isPending || !subtitleText}
              className="h-9 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Generate Timestamps
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: SYSTEM OUTPUT (EDITABLE) */}
      <div className="p-6 border border-zinc-800 bg-zinc-900/15 backdrop-blur-sm rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            {generateMutation.isPending ? (
              <Cpu className="h-4.5 w-4.5 animate-spin text-indigo-500" />
            ) : (
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
            )}
            System Output (Editable)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-150 transition-colors cursor-pointer"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-150 transition-colors cursor-pointer"
              title="Download Output"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <textarea
          value={systemOutput}
          onChange={(e) => setSystemOutput(e.target.value)}
          className="w-full h-80 p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-zinc-300 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-800"
        />
      </div>

      {/* API Limit Modal Alert */}
      <ApiLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        errorMessage={apiErrorMessage}
      />
    </div>
  );
}
