import React, { useState } from 'react';
import { Search, ExternalLink, Bookmark, FileText } from 'lucide-react';
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
    if (!query.trim()) return;

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
      {/* Search Bar & Parameters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors duration-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Literature & Concept Search
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search across your entire document repository by concept, methodology, or keyword.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts (e.g., attention mechanism, evaluation metrics, loss function)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Sliders */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div>
            <div className="flex justify-between mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Maximum Results:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1 font-medium text-slate-700 dark:text-slate-300">
              <span>Match Sensitivity:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{threshold.toFixed(2)}</span>
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

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Search Results List */}
      {searchResponse && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Matching Excerpts ({searchResponse.results.length})
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {searchResponse.total_indexed_chunks} indexed passages searched
            </span>
          </div>

          {searchResponse.results.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              No excerpts matched your search with the current match sensitivity ({threshold.toFixed(2)}). Try lowering the sensitivity slider.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResponse.results.map((res) => (
                <div
                  key={res.chunk.chunk_id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                        {res.rank}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
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
                      <div className="flex items-center space-x-1.5 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/60">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          {Math.round(res.score * 100)}% Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relevance Score Visual Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, res.score * 100))}%` }}
                    />
                  </div>

                  {/* Passage Text */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {res.chunk.text}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
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
                      className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      <span>View Excerpt</span>
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
