import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  History, Search, Filter, Star, StarOff, Copy, Download,
  Trash2, Edit3, ExternalLink, RefreshCw, FileText, Clock,
  ChevronLeft, ChevronRight, SlidersHorizontal, X, Heart,
  AlertCircle, Sparkles
} from "lucide-react";
import api from "../services/api.js";
import { useConfirmStore } from "../services/confirmStore.js";
import { useToastStore } from "../services/toastStore.js";

export default function AIHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const showToast = useToastStore((state) => state.showToast);

  // Filter and search states
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 12;

  // Build query string
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (platform) params.set("platform", platform);
    if (sourceType) params.set("sourceType", sourceType);
    if (favoriteFilter) params.set("favorite", "true");
    params.set("sort", sort);
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    return params.toString();
  };

  // Fetch documents
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["workspace-history", search, platform, sourceType, favoriteFilter, sort, page],
    queryFn: async () => {
      const res = await api.get(`/api/workspace?${buildQuery()}`);
      return res.data;
    }
  });

  const documents = response?.data || [];
  const pagination = response?.pagination || { total: 0, page: 1, totalPages: 1 };

  // Mutations
  const favoriteMutation = useMutation({
    mutationFn: async (docId) => {
      const res = await api.put(`/api/workspace/${docId}/favorite`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-history"] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId) => {
      const res = await api.delete(`/api/workspace/${docId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-history"] });
      showToast("Document moved to Trash successfully!", "success");
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (docId) => {
      const res = await api.post(`/api/workspace/${docId}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-history"] });
      showToast("Document duplicated successfully!", "success");
    }
  });

  // Handlers
  const handleContinueEditing = (docId) => {
    navigate(`/studio?documentId=${docId}`);
  };

  const handleExportMarkdown = (doc) => {
    const element = document.createElement("a");
    const file = new Blob([doc.currentContent || doc.title], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setPlatform("");
    setSourceType("");
    setFavoriteFilter(false);
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters = platform || sourceType || favoriteFilter || search;

  // Time formatting
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Platform color mapping
  const getPlatformStyle = (p) => {
    const map = {
      LinkedIn: "bg-blue-500/15 text-blue-400 border-blue-500/25",
      Facebook: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
      Twitter: "bg-sky-500/15 text-sky-400 border-sky-500/25",
      Instagram: "bg-pink-500/15 text-pink-400 border-pink-500/25",
      Blog: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      Newsletter: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      Generate_Everything: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      YT_Script: "bg-red-500/15 text-red-400 border-red-500/25",
      YT_Titles: "bg-red-500/15 text-red-400 border-red-500/25",
      YT_Desc: "bg-red-500/15 text-red-400 border-red-500/25",
    };
    return map[p] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
  };

  const getSourceLabel = (s) => {
    const map = {
      crawled_content: "Crawled Content",
      custom_topic: "Custom Topic",
      paste_content: "Pasted Content",
      website_url: "Website URL",
      facebook_url: "Facebook URL",
      youtube_url: "YouTube URL",
      blog_url: "Blog URL"
    };
    return map[s] || s;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
            <History className="h-8 w-8 text-indigo-500" />
            AI Content History
          </h1>
          <p className="text-zinc-400 mt-2 text-sm text-left">
            Browse, search, and manage all your AI-generated workspace documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">
            {pagination.total} document{pagination.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-4 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search by topic, content, tags, platform..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-4 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-4 flex items-center gap-2 border rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? "border-indigo-500/50 bg-indigo-950/20 text-indigo-400"
                : "border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="h-4 w-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-400 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-zinc-850/60">
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-550 uppercase font-bold">Platform</label>
              <select
                value={platform}
                onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
                className="h-9 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="">All Platforms</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Facebook">Facebook</option>
                <option value="Twitter">Twitter</option>
                <option value="Instagram">Instagram</option>
                <option value="Blog">Blog</option>
                <option value="Newsletter">Newsletter</option>
                <option value="Generate_Everything">Generate Everything</option>
                <option value="YT_Script">YouTube Script</option>
                <option value="YT_Titles">YouTube Titles</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-zinc-550 uppercase font-bold">Source</label>
              <select
                value={sourceType}
                onChange={(e) => { setSourceType(e.target.value); setPage(1); }}
                className="h-9 px-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="">All Sources</option>
                <option value="crawled_content">Crawled Content</option>
                <option value="custom_topic">Custom Topic</option>
                <option value="paste_content">Pasted Content</option>
                <option value="website_url">Website URL</option>
                <option value="facebook_url">Facebook URL</option>
                <option value="youtube_url">YouTube URL</option>
                <option value="blog_url">Blog URL</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-zinc-550 uppercase font-bold">Favorites</label>
              <button
                onClick={() => { setFavoriteFilter(!favoriteFilter); setPage(1); }}
                className={`h-9 px-4 flex items-center gap-1.5 border rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  favoriteFilter
                    ? "border-amber-500/40 bg-amber-950/20 text-amber-400"
                    : "border-zinc-850 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {favoriteFilter ? <Star className="h-3 w-3 fill-amber-400" /> : <StarOff className="h-3 w-3" />}
                {favoriteFilter ? "Favorites Only" : "All"}
              </button>
            </div>

            {hasActiveFilters && (
              <div className="space-y-1 flex items-end">
                <button
                  onClick={clearFilters}
                  className="h-9 px-3 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-850 rounded-lg w-3/4" />
              <div className="h-3 bg-zinc-850 rounded-lg w-1/2" />
              <div className="h-3 bg-zinc-850 rounded-lg w-full" />
              <div className="h-3 bg-zinc-850 rounded-lg w-2/3" />
              <div className="flex gap-2 pt-2">
                <div className="h-7 bg-zinc-850 rounded-lg w-16" />
                <div className="h-7 bg-zinc-850 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="p-12 border border-zinc-850 bg-zinc-900/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-sm text-zinc-400">Failed to load workspace documents.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["workspace-history"] })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <div className="p-16 border border-zinc-850 bg-zinc-900/10 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-300">No Documents Yet</h3>
          <p className="text-xs text-zinc-500 max-w-md">
            {hasActiveFilters
              ? "No documents match your current filters. Try adjusting your search or clearing filters."
              : "Head over to the AI Studio to generate your first content. All your documents will be saved here automatically."}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate("/studio")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Open AI Studio
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-xl cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Document Cards Grid */}
      {!isLoading && !isError && documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="group p-5 border border-zinc-850 bg-zinc-900/10 rounded-2xl space-y-3 hover:border-zinc-800 hover:bg-zinc-900/20 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="text-sm font-bold text-zinc-200 line-clamp-2 leading-snug cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleContinueEditing(doc._id)}
                  title={doc.title}
                >
                  {doc.title}
                </h3>
                <button
                  onClick={() => favoriteMutation.mutate(doc._id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  title={doc.favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {doc.favorite ? (
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <Star className="h-4 w-4 text-zinc-600 group-hover:text-zinc-500" />
                  )}
                </button>
              </div>

              {/* Platform Badge + Source */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${getPlatformStyle(doc.platform)}`}>
                  {doc.platform?.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {getSourceLabel(doc.sourceType)}
                </span>
              </div>

              {/* Topic */}
              {doc.topic && (
                <p className="text-[11px] text-zinc-500 line-clamp-1 text-left" title={doc.topic}>
                  {doc.topic}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(doc.createdAt)}
                </span>
                <span>v{doc.currentVersion}</span>
                {doc.chatCount > 0 && (
                  <span>{doc.chatCount} messages</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-850/60">
                <button
                  onClick={() => handleContinueEditing(doc._id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-950/20 text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-950/30 transition-colors cursor-pointer"
                  title="Continue Editing"
                >
                  <Edit3 className="h-3 w-3" />
                  Continue
                </button>
                <button
                  onClick={() => duplicateMutation.mutate(doc._id)}
                  disabled={duplicateMutation.isPending}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleExportMarkdown(doc)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
                  title="Export Markdown"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    showConfirm({
                      title: "Move Document to Trash?",
                      description: "Are you sure you want to move this document to Trash? It will remain there for 10 days before permanent deletion.",
                      confirmLabel: "Move to Trash",
                      confirmType: "danger",
                      onConfirm: () => {
                        deleteMutation.mutate(doc._id);
                      }
                    });
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer ml-auto disabled:opacity-40"
                  title="Move to Trash"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-9 px-3 flex items-center gap-1.5 border border-zinc-850 bg-zinc-950 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-9 w-9 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    page === pageNum
                      ? "bg-indigo-600 text-white"
                      : "border border-zinc-850 bg-zinc-950 text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="h-9 px-3 flex items-center gap-1.5 border border-zinc-850 bg-zinc-950 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 cursor-pointer transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
