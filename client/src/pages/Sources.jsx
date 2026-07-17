import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Video,
  Plus,
  Search,
  Filter,
  Pause,
  Play,
  Trash2,
  Edit,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Facebook
} from "lucide-react";
import sourceService from "../services/sourceService.js";
import SourceDialog from "../components/SourceDialog.jsx";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog.jsx";
import { useToastStore } from "../services/toastStore.js";

export default function Sources() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  // Search, Filter, Pagination Local State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog Modals State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  // TanStack Queries: Fetch Sources
  const {
    data: sources = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["sources"],
    queryFn: sourceService.getSources
  });

  // TanStack Mutations
  const createMutation = useMutation({
    mutationFn: sourceService.createSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setIsAddOpen(false);
      showToast("Source created successfully!", "success");
    },
    onError: (error) => {
      showToast(error.response?.data?.message || error.message || "Failed to create source", "error");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => sourceService.updateSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setIsEditOpen(false);
      setSelectedSource(null);
      showToast("Source updated successfully!", "success");
    },
    onError: (error) => {
      showToast(error.response?.data?.message || error.message || "Failed to update source", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: sourceService.deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setIsDeleteOpen(false);
      setSelectedSource(null);
      showToast("Source deleted successfully!", "success");
    },
    onError: (error) => {
      showToast(error.response?.data?.message || error.message || "Failed to delete source", "error");
    }
  });

  const pauseMutation = useMutation({
    mutationFn: sourceService.pauseSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: sourceService.resumeSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    }
  });

  // Event Handlers for Dialog Actions
  const handleAddSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data) => {
    if (selectedSource) {
      updateMutation.mutate({ id: selectedSource.id, data });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedSource) {
      deleteMutation.mutate(selectedSource.id);
    }
  };

  const toggleStatus = (source) => {
    if (source.status === "active") {
      pauseMutation.mutate(source.id);
    } else {
      resumeMutation.mutate(source.id);
    }
  };

  // Filter and Search Logic
  const filteredSources = sources.filter((source) => {
    const matchesSearch =
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.url.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || source.type === typeFilter;
    const matchesStatus = statusFilter === "all" || source.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredSources.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSources = filteredSources.slice(startIndex, startIndex + itemsPerPage);

  // Set Page Safe-Checks
  const setPageSafe = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading">
            Monitored Sources
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Add and manage RSS feeds and YouTube channels that TrendPilot AI monitors for insights.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/10 font-semibold text-sm transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Source
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-zinc-500" />
          </span>
          <input
            type="text"
            placeholder="Search by name, URL, category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="website">Websites</option>
              <option value="youtube">YouTube Channels</option>
              <option value="facebook">Facebook Pages</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Main Table / Loader / Error Wrapper */}
      {isLoading ? (
        /* Loader State */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-500">Loading your content sources...</p>
          </div>
        </div>
      ) : isError ? (
        /* Error State */
        <div className="p-6 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-center space-y-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 font-heading">Failed to fetch sources</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {error?.message || "Internal server connection failed."}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : paginatedSources.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-400">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 font-heading">No sources found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {sources.length === 0
                ? "Start adding websites, YouTube channels, or Facebook pages to begin monitoring trends."
                : "No sources match the selected search terms or filters."}
            </p>
          </div>
          {sources.length === 0 && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-colors cursor-pointer"
            >
              Add Your First Source
            </button>
          )}
        </div>
      ) : (
        /* Sources Table */
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/30 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Checked</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-sm text-zinc-300">
                  {paginatedSources.map((source) => (
                    <tr key={source.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-zinc-100">{source.name}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-indigo-400 inline-flex items-center gap-1 mt-0.5 truncate max-w-xs transition-colors"
                          >
                            {source.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400 capitalize">
                          {source.type === "website" ? (
                            <>
                              <Globe className="h-3.5 w-3.5 text-indigo-400" />
                              Website/RSS
                            </>
                          ) : source.type === "facebook" ? (
                            <>
                              <Facebook className="h-3.5 w-3.5 text-blue-500" />
                              Facebook
                            </>
                          ) : (
                            <>
                              <Video className="h-3.5 w-3.5 text-rose-400" />
                              YouTube
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {source.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            source.status === "active"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : source.status === "paused"
                                ? "bg-zinc-800 border border-zinc-700 text-zinc-400"
                                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                          }`}
                        >
                          {source.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {source.lastCheckedAt
                          ? new Date(source.lastCheckedAt).toLocaleString()
                          : "Never Checked"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(source)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
                            title={source.status === "active" ? "Pause Source" : "Resume Source"}
                          >
                            {source.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSource(source);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all cursor-pointer"
                            title="Edit Source"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSource(source);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
                            title="Delete Source"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-zinc-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of{" "}
                {totalItems} items
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageSafe(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-zinc-300 font-semibold px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPageSafe(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source dialog configurations (Add/Edit) */}
      <SourceDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        isLoading={createMutation.isPending}
      />

      <SourceDialog
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedSource(null);
        }}
        onSubmit={handleEditSubmit}
        source={selectedSource}
        isLoading={updateMutation.isPending}
      />

      {/* Delete confirm configurations */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedSource(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
        title="Delete Content Source"
        description={`Are you sure you want to delete "${selectedSource?.name}"? You will lose all metadata logs gathered from this website or channel.`}
      />
    </div>
  );
}
