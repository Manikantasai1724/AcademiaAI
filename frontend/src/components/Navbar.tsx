import React from 'react';
import { BookOpen, Sparkles, Database, Search, MessageSquare } from 'lucide-react';
import type { CorpusStats } from '../types';

interface NavbarProps {
  activeTab: 'qa' | 'search' | 'library';
  setActiveTab: (tab: 'qa' | 'search' | 'library') => void;
  corpusStats: CorpusStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  corpusStats,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  ScholarNLP
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  RAG + FAISS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Academic Semantic Search & Grounded QA
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('qa')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'qa'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Grounded QA</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semantic Search</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Corpus Library</span>
            </button>
          </nav>

          {/* Corpus Statistics Pill */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">
                {corpusStats ? corpusStats.total_indexed_chunks : 0}
              </span>
              <span className="text-emerald-600 font-normal">chunks indexed</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md">
              all-mpnet-base-v2
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
