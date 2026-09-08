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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        corpusStats={corpusStats}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Academic Natural Language Processing (NLP) System &bull; Dense Vector Search &bull; RAG Grounding
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            Sentence-Transformers + FAISS + Gemini
          </span>
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
