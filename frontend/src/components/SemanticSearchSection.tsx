import React, { useState } from 'react';
import { Search, ExternalLink, Bookmark, FileText, Sparkles } from 'lucide-react';
import type { DocumentChunk, SearchResponse } from '../types';
import { semanticSearch } from '../services/api';

interface SemanticSearchSectionProps {
  onInspectChunk: (chunk: DocumentChunk) => void;
}

export const SemanticSearchSection: React.FC<SemanticSearchSectionProps> = ({
  onInspectChunk,
}) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.20);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await semanticSearch(query, topK, threshold);
      setSearchResponse(res);
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Explorer Container */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200">
        {/* Control Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Literature & Concept Vector Search</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] border border-indigo-200/70 dark:border-indigo-800/60">
            <Sparkles className="w-3 h-3" />
            Semantic Similarity
          </span>
        </div>

        {/* Input Form & Parameters */}
        <div className="p-6 sm:p-8 space-y-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search concepts (e.g., self-attention, loss function, empirical benchmarks)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 text-white rounded-2xl text-xs font-semibold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span>Searching...</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Execute Search</span>
                </>
              )}
            </button>
          </form>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
            <div>
              <div className="flex justify-between mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span>Maximum Excerpts Retrieved:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60">
                  {topK}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span>Match Sensitivity Cut-off:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60">
                  {threshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.80"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Search Results List */}
      {searchResponse && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Matching Source Passages</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                {searchResponse.results.length}
              </span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {searchResponse.total_indexed_chunks} total passages evaluated
            </span>
          </div>

          {searchResponse.results.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-10 text-center rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              No excerpts matched your search query above the current sensitivity threshold ({threshold.toFixed(2)}). Try lowering the sensitivity cut-off slider.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResponse.results.map((res) => (
                <div
                  key={res.chunk.chunk_id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/70 transition-all shadow-xs space-y-3.5 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs font-bold flex items-center justify-center shadow-xs">
                        {String(res.rank).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {res.chunk.filename}
                          </span>
                        </div>
                        {res.chunk.section && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Section: {res.chunk.section}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/60">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {Math.round(res.score * 100)}% match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Similarity Score Visual Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, res.score * 100))}%` }}
                    />
                  </div>

                  {/* Passage Text */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                    "{res.chunk.text}"
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="flex items-center space-x-1">
                        <Bookmark className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Page {res.chunk.page_number}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{res.chunk.char_length} characters</span>
                      </span>
                    </div>

                    <button
                      onClick={() => onInspectChunk(res.chunk)}
                      className="inline-flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      <span>Inspect Context</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
