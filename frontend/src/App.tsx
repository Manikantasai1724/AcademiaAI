import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentUpload } from './components/DocumentUpload';
import { QASection } from './components/QASection';
import { SemanticSearchSection } from './components/SemanticSearchSection';
import { DocumentLibrary } from './components/DocumentLibrary';
import { ChunkInspectorModal } from './components/ChunkInspectorModal';
import type { CorpusStats, DocumentChunk, DocumentInfo } from './types';
import { listDocuments } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'qa' | 'search' | 'library'>('qa');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        corpusStats={corpusStats}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Document Ingestion Banner */}
        <DocumentUpload onUploadSuccess={fetchCorpus} />

        {/* Tab Views */}
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
      </main>

      {/* Clean, Professional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">AcademiaAI</span>
            <span>&bull;</span>
            <span>Intelligent Academic Research & Literature Assistant</span>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} AcademiaAI. All rights reserved.
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
