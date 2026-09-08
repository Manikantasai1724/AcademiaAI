import React, { useState } from 'react';
import { FileText, Trash2, Layers, Bookmark, RefreshCw } from 'lucide-react';
import type { DocumentChunk, DocumentInfo } from '../types';
import { clearIndex, inspectChunks } from '../services/api';

interface DocumentLibraryProps {
  documents: DocumentInfo[];
  onRefresh: () => void;
  onInspectChunk: (chunk: DocumentChunk) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  onRefresh,
  onInspectChunk,
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to reset the FAISS vector index and clear all indexed documents?')) {
      return;
    }
    setIsClearing(true);
    try {
      await clearIndex();
      setSelectedDocId(null);
      setDocChunks([]);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  const loadChunksForDoc = async (docId: string) => {
    if (selectedDocId === docId) {
      setSelectedDocId(null);
      setDocChunks([]);
      return;
    }
    setSelectedDocId(docId);
    setIsLoadingChunks(true);
    try {
      const res = await inspectChunks(docId);
      setDocChunks(res.chunks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Indexed Academic Corpus
          </h2>
          <p className="text-xs text-slate-500">
            {documents.length} document{documents.length === 1 ? '' : 's'} indexed in FAISS memory.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {documents.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Clear Index'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            No Documents Ingested
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload PDF textbooks, DOCX research drafts, PPTX lecture slides, or TXT notes above to begin semantic retrieval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                selectedDocId === doc.document_id
                  ? 'border-indigo-500 ring-2 ring-indigo-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {doc.file_type.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[180px]" title={doc.filename}>
                      {doc.filename}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {doc.document_id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 py-2 border-t border-slate-100 my-2">
                <div className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.chunk_count} chunks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.max_page} pages/slides</span>
                </div>
              </div>

              <button
                onClick={() => loadChunksForDoc(doc.document_id)}
                className="w-full mt-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                {selectedDocId === doc.document_id ? 'Hide Chunks' : 'Inspect Chunks'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Document Chunks View */}
      {selectedDocId && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Passage Chunks for Document ({docChunks.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">{selectedDocId}</span>
          </div>

          {isLoadingChunks ? (
            <p className="text-xs text-slate-500 py-4">Loading chunks...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {docChunks.map((chunk) => (
                <div
                  key={chunk.chunk_id}
                  onClick={() => onInspectChunk(chunk)}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span className="text-indigo-600">Page {chunk.page_number}</span>
                    <span className="font-mono text-slate-400">{chunk.chunk_id}</span>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                    {chunk.text}
                  </p>
                  <span className="mt-2 inline-block text-[10px] text-indigo-600 font-semibold group-hover:underline">
                    View Full Passage &rarr;
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
