import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  RefreshCw,
  Search,
  Filter,
  PlayCircle,
  Globe,
  Facebook,
  RotateCcw,
  Sparkles,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  Info
} from "lucide-react";
import api from "../services/api.js";

export default function Trash() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [source, setSource] = useState("");
  const [competitor, setCompetitor] = useState("");

  // Multiselect state
  const [selectedItems, setSelectedItems] = useState(new Set()); // set of item key e.g. "type:id"

  // Fetch soft-deleted items
  const { data: trashRes, isLoading, refetch } = useQuery({
    queryKey: ["trash-items", search, platform, source, competitor],
    queryFn: async () => {
      const res = await api.get("/api/trash", {
        params: { search, platform, source, competitor }
      });
      return res.data.data;
    }
  });

  // Fetch sources list
  const { data: sources = [] } = useQuery({
    queryKey: ["sources-list"],
    queryFn: async () => {
      const res = await api.get("/api/sources");
      return res.data.data;
    }
  });

  // Fetch competitors list
  const { data: competitors = [] } = useQuery({
    queryKey: ["competitors-list"],
    queryFn: async () => {
      const res = await api.get("/api/competitors");
      return res.data.data;
    }
  });

  // Fetch cleanup suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery({
    queryKey: ["cleanup-suggestions"],
    queryFn: async () => {
      const res = await api.post("/api/trash/cleanup-suggestions");
      return res.data.data;
    }
  });

  const trashItems = trashRes || [];

  // Toggle selection helper
  const handleToggleSelectItem = (id, type) => {
    const key = `${type}:${id}`;
    const nextSelected = new Set(selectedItems);
    if (nextSelected.has(key)) {
      nextSelected.delete(key);
    } else {
      nextSelected.add(key);
    }
    setSelectedItems(nextSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedItems.size === trashItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(trashItems.map(item => `${item.type}:${item.id}`)));
    }
  };

  // Mutations
  const restoreMutation = useMutation({
    mutationFn: async ({ ids, type }) => {
      await api.put("/api/trash/restore", { ids, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      queryClient.invalidateQueries({ queryKey: ["competitorPosts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      refetchSuggestions();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ ids, type }) => {
      await api.delete("/api/trash/delete", { data: { ids, type } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-items"] });
      refetchSuggestions();
    }
  });

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/api/trash/empty");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-items"] });
      setSelectedItems(new Set());
      refetchSuggestions();
    }
  });

  const bulkTrashMutation = useMutation({
    mutationFn: async ({ ids, type }) => {
      await api.put("/api/trash/move", { ids, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      queryClient.invalidateQueries({ queryKey: ["competitorPosts"] });
      refetchSuggestions();
    }
  });

  const handleRestore = async (id, type) => {
    restoreMutation.mutate({ ids: [id], type });
  };

  const handleDeletePermanent = async (id, type) => {
    if (!window.confirm("Are you sure you want to permanently delete this item? This action is irreversible.")) {
      return;
    }
    deleteMutation.mutate({ ids: [id], type });
  };

  const handleBulkRestore = async () => {
    const contents = [];
    const competitorsList = [];

    selectedItems.forEach(key => {
      const [type, id] = key.split(":");
      if (type === "content") contents.push(id);
      else competitorsList.push(id);
    });

    if (contents.length > 0) {
      await restoreMutation.mutateAsync({ ids: contents, type: "content" });
    }
    if (competitorsList.length > 0) {
      await restoreMutation.mutateAsync({ ids: competitorsList, type: "competitor" });
    }

    setSelectedItems(new Set());
  };

  const handleBulkDeletePermanent = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete these ${selectedItems.size} items? This action cannot be undone.`)) {
      return;
    }
    const contents = [];
    const competitorsList = [];

    selectedItems.forEach(key => {
      const [type, id] = key.split(":");
      if (type === "content") contents.push(id);
      else competitorsList.push(id);
    });

    if (contents.length > 0) {
      await deleteMutation.mutateAsync({ ids: contents, type: "content" });
    }
    if (competitorsList.length > 0) {
      await deleteMutation.mutateAsync({ ids: competitorsList, type: "competitor" });
    }

    setSelectedItems(new Set());
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm("Empty entire trash bin? All items will be permanently deleted from the database. This action is irreversible!")) {
      return;
    }
    emptyTrashMutation.mutate();
  };

  const handleTrashSuggestion = async (id, type) => {
    await bulkTrashMutation.mutateAsync({ ids: [id], type });
  };

  const getCountdown = (deletedAt) => {
    const delDate = new Date(deletedAt);
    const purgeDate = new Date(delDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const msDiff = purgeDate - new Date();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (24 * 60 * 60 * 1000)));
    const daysAgo = Math.max(0, Math.floor((new Date() - delDate) / (24 * 60 * 60 * 1000)));
    return {
      ago: daysAgo === 0 ? "Today" : `${daysAgo} days ago`,
      remaining: `${daysRemaining} days remaining`
    };
  };

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading flex items-center gap-2">
            <Trash2 className="h-8 w-8 text-rose-500" />
            Trash Management
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Review soft-deleted crawls. Items are kept for 10 days before automatic permanent deletion.
          </p>
        </div>
        {trashItems.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            disabled={emptyTrashMutation.isPending}
            className="px-4 py-2 border border-rose-500/20 bg-rose-950/20 hover:bg-rose-500 hover:text-white text-xs font-bold rounded-xl text-rose-400 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Empty Trash Bin
          </button>
        )}
      </div>

      {/* Dynamic ignore/warning banner */}
      <div className="p-4 border border-rose-900/30 bg-rose-950/5 rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong>Auto-Delete Policy:</strong> Soft-deleted content is fully ignored from keyword extraction, trending topics growth velocity, platform distribution ratios, opportunity scoring, and recommendations. Items will purge automatically after 10 days.
        </p>
      </div>

      {/* Row: Main Trash list & AI Cleanup Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Trash Content Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar */}
          <div className="p-4 border border-zinc-800 bg-zinc-900/10 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-zinc-500" />
              </span>
              <input
                type="text"
                placeholder="Search trashed posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
              {trashItems.length > 0 && (
                <button
                  onClick={handleToggleSelectAll}
                  className="h-9 px-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs text-zinc-300 flex items-center gap-1.5 focus:outline-none cursor-pointer font-semibold"
                >
                  Select All
                </button>
              )}

              {/* Platform filter */}
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="h-9 px-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="">All Platforms</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
                <option value="blog">Blog</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Controls */}
          {selectedItems.size > 0 && (
            <div className="p-4 border border-indigo-900/30 bg-indigo-950/20 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold text-zinc-200">
              <span>{selectedItems.size} items selected</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkRestore}
                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 rounded-xl text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkDeletePermanent}
                  className="px-3 py-1.5 bg-rose-650 hover:bg-rose-500 border border-rose-500/20 rounded-xl text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Permanently
                </button>
              </div>
            </div>
          )}

          {/* List display */}
          {isLoading ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : trashItems.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
              No soft-deleted crawls in Trash Bin.
            </div>
          ) : (
            <div className="space-y-3.5">
              {trashItems.map((item) => {
                const key = `${item.type}:${item.id}`;
                const isSelected = selectedItems.has(key);
                const Icon = item.platform === "facebook" ? Facebook : (item.platform === "youtube" ? PlayCircle : Globe);
                const countdown = getCountdown(item.deletedAt);

                return (
                  <div
                    key={key}
                    className={`p-4 border rounded-2xl bg-zinc-950/40 hover:bg-zinc-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left transition-all ${
                      isSelected ? "border-indigo-500 bg-indigo-950/5" : "border-zinc-800"
                    }`}
                  >
                    <div className="space-y-1 truncate w-full sm:max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSelectItem(item.id, item.type)}
                          className="text-zinc-500 hover:text-indigo-400 cursor-pointer flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-zinc-500" />
                          )}
                        </button>
                        <Icon className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                        <h4 className="text-xs font-bold text-zinc-200 truncate leading-snug">{item.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase pl-6">
                        <span className="text-zinc-400">{item.source}</span>
                        <span>•</span>
                        <span>Deleted {countdown.ago}</span>
                        <span>•</span>
                        <span className="text-rose-455 font-extrabold">{countdown.remaining}</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleRestore(item.id, item.type)}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold rounded-lg text-zinc-300 cursor-pointer transition-colors flex items-center gap-1"
                        title="Restore Item"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeletePermanent(item.id, item.type)}
                        className="px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-650 border border-rose-500/15 hover:border-rose-500/30 text-[10px] font-bold rounded-lg text-rose-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-3 w-3" />
                        Purge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI assisted Cleanup Suggestions */}
        <div className="p-6 border border-zinc-800 bg-zinc-900/10 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900/40 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            AI-Assisted Cleanup
          </h2>
          <p className="text-[10px] text-zinc-500 leading-normal">
            We analyzed your active crawled database. These items are flagged as duplicate crawls, short copy structures, or empty/failed ingests. You can soft-delete them safely with one click.
          </p>

          {suggestionsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 italic">
              Database clean! No duplicates or thin content found.
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((item) => (
                <div key={item.id} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-2xl text-left space-y-2">
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-extrabold text-zinc-200 line-clamp-1">{item.title}</h5>
                    <span className="text-[9px] font-bold text-indigo-400/90 uppercase tracking-widest">{item.source} ({item.platform})</span>
                  </div>
                  {/* Suggestion reason alert */}
                  <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[9px] text-rose-400 flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{item.reason}</span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleTrashSuggestion(item.id, item.type)}
                      className="px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-[9px] font-bold rounded-lg text-rose-400 cursor-pointer transition-colors"
                    >
                      Trash Suggestion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
