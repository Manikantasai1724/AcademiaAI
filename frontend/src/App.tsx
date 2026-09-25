import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentUpload } from './components/DocumentUpload';
import { QASection } from './components/QASection';
import { SemanticSearchSection } from './components/SemanticSearchSection';
import { DocumentLibrary } from './components/DocumentLibrary';
import { ChunkInspectorModal } from './components/ChunkInspectorModal';
import type { CorpusStats, DocumentChunk, DocumentInfo } from './types';
import { listDocuments } from './services/api';
import {
  Sparkles,
  Upload,
  Search,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  FileText,
  GraduationCap,
  Layers,
  Database,
  ArrowUpRight
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'qa' | 'search' | 'library' | 'upload'>('qa');
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [corpusStats, setCorpusStats] = useState<CorpusStats | null>(null);
  const [inspectedChunk, setInspectedChunk] = useState<DocumentChunk | null>(null);

  // Theme state: dark / light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('academiaai_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('academiaai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchCorpus = async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.documents);
      setCorpusStats(res.corpus_stats);
    } catch (err) {
      console.warn('Backend not yet reachable on http://127.0.0.1:8000:', err);
    }
  };

  useEffect(() => {
    fetchCorpus();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab === 'upload' ? 'library' : activeTab}
        setActiveTab={(t) => setActiveTab(t)}
        corpusStats={corpusStats}
        theme={theme}
        toggleTheme={toggleTheme}
        onUploadClick={() => setActiveTab('upload')}
      />

      {/* Hero / Overview Banner */}
      <section className="relative pt-8 pb-6 overflow-hidden hero-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Academic Research Assistant
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Grounded Literature Intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-slate-950 dark:text-white leading-tight">
              Turn Your Course Materials Into a{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                Grounded Knowledge Base
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Upload research papers, lecture slides, and textbooks. Ask complex conceptual questions to get instantaneous, evidence-backed answers with exact page and section citations.
            </p>

            {/* Live Metrics Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-slate-500 dark:text-slate-400">Indexed Documents:</span>
                <span className="font-bold text-slate-900 dark:text-white">{documents.length}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-slate-500 dark:text-slate-400">Indexed Passages:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {corpusStats?.total_indexed_chunks ?? 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-500 dark:text-slate-400">Grounding Guard:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Workspace Card Container */}
        <div className="rounded-3xl p-3 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-indigo-950/5 transition-colors">
          {/* Workspace Tab Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 mb-5 border-b border-slate-200/70 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('qa')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'qa'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Research Assistant</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'search'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Literature Search</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'library'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Knowledge Sources ({documents.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Documents</span>
              </button>
            </div>

            {/* Quick Context Indicator */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Session Memory:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {documents.length > 0 ? `${documents.length} files active` : 'No files indexed'}
              </span>
            </div>
          </div>

          {/* Active View */}
          {activeTab === 'upload' && (
            <DocumentUpload onUploadSuccess={() => { fetchCorpus(); setActiveTab('library'); }} />
          )}

          {activeTab === 'qa' && (
            <QASection onInspectChunk={(chunk) => setInspectedChunk(chunk)} />
          )}

          {activeTab === 'search' && (
            <SemanticSearchSection onInspectChunk={(chunk) => setInspectedChunk(chunk)} />
          )}

          {activeTab === 'library' && (
            <DocumentLibrary
              documents={documents}
              onRefresh={fetchCorpus}
              onInspectChunk={(chunk) => setInspectedChunk(chunk)}
            />
          )}
        </div>

        {/* Compact Academic Architecture & Trust Overview */}
        <section className="pt-4 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-1">
                Verifiable Grounding
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Answers are synthesized strictly from retrieved passages in your uploaded documents, complete with clickable page and section citations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-1">
                Dense Vector Search
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Find conceptual relationships and relevant evidence across hundreds of pages, even when your query doesn't match exact keywords.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-1">
                Multi-Format Ingestion
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Native parsing for academic PDFs, PowerPoint lecture slides, Word documents, and text notes with structure preservation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Academic Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm font-display text-slate-900 dark:text-white">
              AcademiaAI
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Student-Focused Academic Research & Literature Assistant
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-500 dark:text-slate-400">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
            >
              <span>API Docs</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System Operational</span>
            </div>
            <span className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} AcademiaAI
            </span>
          </div>
        </div>
      </footer>

      {/* Full Passage Inspector Modal */}
      <ChunkInspectorModal
        chunk={inspectedChunk}
        onClose={() => setInspectedChunk(null)}
      />
    </div>
  );
}

export default App;
