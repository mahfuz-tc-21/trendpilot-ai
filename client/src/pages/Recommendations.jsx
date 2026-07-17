import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Lightbulb, Search, Filter, Sparkles, AlertCircle, ArrowRight, Share2, Compass } from "lucide-react";
import api from "../services/api.js";

export default function Recommendations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations-library", search, platform, format],
    queryFn: async () => {
      const response = await api.get("/api/recommendations", {
        params: { search, platform, format, limit: 30 }
      });
      return response.data.data;
    }
  });

  const recs = data || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-heading flex items-center gap-2">
          <Lightbulb className="h-8 w-8 text-indigo-500" />
          Growth Recommendations
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Browse AI-generated high-converting content ideas, headlines, hooks, and opportunity scores.
        </p>
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
            placeholder="Search suggested titles or hooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Platforms</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter/X</option>
              <option value="Facebook">Facebook</option>
              <option value="YouTube">YouTube</option>
              <option value="Blog">Blog</option>
            </select>
          </div>

          {/* Format Filter */}
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="h-10 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="">All Formats</option>
            <option value="Post">Social Post</option>
            <option value="Thread">Twitter Thread</option>
            <option value="Script">Video Script</option>
            <option value="Article">Blog SEO Article</option>
            <option value="Carousel">Carousel</option>
            <option value="Newsletter">Newsletter</option>
          </select>
        </div>
      </div>

      {/* Recommendations List */}
      {isLoading ? (
        <div className="py-24 flex justify-center">
          <AlertCircle className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : recs.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl text-sm text-zinc-500">
          No recommendation ideas found matching your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((rec) => (
            <div
              key={rec._id || rec.id}
              onClick={() => navigate(`/content/${rec.contentId?._id || rec.contentId}`)}
              className="p-5 border border-zinc-800 bg-zinc-900/10 hover:border-indigo-500/50 hover:bg-zinc-900/20 backdrop-blur-sm rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  {rec.platform.map((plat) => (
                    <span
                      key={plat}
                      className="px-2 py-0.5 rounded text-[9px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/35 font-bold uppercase tracking-wider"
                    >
                      {plat}
                    </span>
                  ))}
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                    {rec.contentFormat}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-100 leading-snug">
                    {rec.suggestedTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 italic line-clamp-1">
                    &ldquo;{rec.hook}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action and score badges */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto border-t sm:border-t-0 border-zinc-800/60 pt-4 sm:pt-0 flex-shrink-0">
                <div className="flex gap-4">
                  <div className="text-center sm:text-right">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Opp Score</div>
                    <div className="text-sm font-extrabold text-white">
                      {rec.opportunityScore}
                      <span className="text-[9px] text-zinc-500">/100</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Trend Score</div>
                    <div className="text-sm font-extrabold text-indigo-400">
                      {rec.trendScore}
                      <span className="text-[9px] text-zinc-500">/100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                  <span>Enter AI Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
