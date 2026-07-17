import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FileText, Search, Filter, PlayCircle, Globe, ArrowRight, Activity, Calendar, Trash2, CheckSquare, Square } from "lucide-react";
import api from "../services/api.js";

export default function ContentLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  // Multiselect state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["content-library", search, type, status],
    queryFn: async () => {
      const response = await api.get("/api/content", {
        params: { search, type, status, limit: 30 }
      });
      return response.data.data;
    }
  });

  const [deletingId, setDeletingId] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const contentItems = data || [];

  const handleToggleSelect = (e, id) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === contentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contentItems.map(item => item._id || item.id)));
    }
  };

  const handleTrashSingle = async (e, itemId) => {
    e.stopPropagation();
    if (!window.confirm("This content will be hidden from all analytics, trends, AI recommendations, and searches. It will remain in Trash for 10 days before being permanently deleted.")) {
      return;
    }
    setDeletingId(itemId);
    try {
      await api.put("/api/trash/move", { ids: [itemId], type: "content" });
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to trash item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkTrash = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to move ${selectedIds.size} items to Trash? They will remain in Trash for 10 days before permanent deletion.`)) {
      return;
    }
    setIsBulkProcessing(true);
    try {
      await api.put("/api/trash/move", {
        ids: Array.from(selectedIds),
        type: "content"
      });
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to bulk trash items");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-500" />
            Content Library
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Explore raw crawled articles, parsed YouTube feeds, and their AI summarization statuses.
          </p>
        </div>
        <button
          onClick={() => navigate("/trash")}
          className="px-4 py-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs font-bold rounded-xl text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="h-4 w-4 text-zinc-500" />
          View Trash Bin
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-zinc-500" />
          </span>
          <input
            type="text"
            placeholder="Search crawled content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-zinc-950 border border-zinc-850 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {contentItems.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="h-10 px-3 py-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-xl text-xs text-zinc-300 flex items-center gap-1.5 focus:outline-none cursor-pointer font-semibold"
            >
              {selectedIds.size === contentItems.length ? (
                <CheckSquare className="h-4 w-4 text-indigo-400" />
              ) : (
                <Square className="h-4 w-4 text-zinc-500" />
              )}
              Select All
            </button>
          )}

          {/* Source Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 px-3 py-1 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Formats</option>
              <option value="youtube">YouTube Videos</option>
              <option value="website">Websites</option>
            </select>
          </div>

          {/* AI Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 py-1 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="">All AI Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="p-4 border border-indigo-900/30 bg-indigo-950/20 backdrop-blur-md rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold text-zinc-200">
          <span>{selectedIds.size} items selected</span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkTrash}
              disabled={isBulkProcessing}
              className="px-3.5 py-1.5 bg-rose-650 hover:bg-rose-500 border border-rose-500/20 rounded-xl text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Trash Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-xl text-zinc-400 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Grid Content List */}
      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Activity className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : contentItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl text-sm text-zinc-500">
          No crawled items found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {contentItems.map((item) => {
            const itemId = item._id || item.id;
            const isSelected = selectedIds.has(itemId);
            return (
              <div
                key={itemId}
                onClick={() => navigate(`/content/${itemId}`)}
                className={`p-5 border bg-zinc-900/10 hover:bg-zinc-900/20 backdrop-blur-sm rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer text-left ${
                  isSelected ? "border-indigo-500 bg-indigo-950/5" : "border-zinc-850 hover:border-indigo-500/30"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    {/* Format icon & Checkbox */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleToggleSelect(e, itemId)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-zinc-500" />
                        )}
                      </button>
                      {item.sourceId?.type === "youtube" ? (
                        <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
                          <PlayCircle className="h-5 w-5" />
                        </span>
                      ) : (
                        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                          <Globe className="h-5 w-5" />
                        </span>
                      )}
                    </div>

                    {/* Status & Actions Container */}
                    <div className="flex items-center gap-2">
                      {/* AI Status tag */}
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          item.processedStatus === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : item.processedStatus === "processing"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : item.processedStatus === "failed"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-zinc-800/40 text-zinc-400 border-zinc-700/50"
                        }`}
                      >
                        {item.processedStatus}
                      </span>

                      {/* Trash Delete button */}
                      <button
                        onClick={(e) => handleTrashSingle(e, itemId)}
                        disabled={deletingId === itemId}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-100 text-sm leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {item.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Footer Meta */}
                <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3 text-[11px] text-zinc-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                    <span>Analyze Studio</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
