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
    if (!window.confirm('Are you sure you want to clear all documents from your library?')) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Document Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {documents.length} document{documents.length === 1 ? '' : 's'} stored in your research library.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {documents.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Clear All Documents'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            No Documents in Library
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Upload research papers, lecture notes, or presentation slides above to start querying your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-xs ${
                selectedDocId === doc.document_id
                  ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {doc.file_type.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]" title={doc.filename}>
                      {doc.filename}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {doc.file_type.toUpperCase()} File
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-2 border-t border-slate-100 dark:border-slate-800 my-2">
                <div className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{doc.chunk_count} excerpts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{doc.max_page} pages/slides</span>
                </div>
              </div>

              <button
                onClick={() => loadChunksForDoc(doc.document_id)}
                className="w-full mt-2 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors cursor-pointer"
              >
                {selectedDocId === doc.document_id ? 'Hide Excerpts' : 'View Excerpts'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Document Chunks View */}
      {selectedDocId && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/80 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Document Excerpts ({docChunks.length})
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Selected Resource</span>
          </div>

          {isLoadingChunks ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">Loading excerpts...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {docChunks.map((chunk) => (
                <div
                  key={chunk.chunk_id}
                  onClick={() => onInspectChunk(chunk)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-indigo-600 dark:text-indigo-400">Page {chunk.page_number}</span>
                    <span className="text-slate-400 dark:text-slate-500">{chunk.char_length} characters</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {chunk.text}
                  </p>
                  <span className="mt-2 inline-block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                    View Full Excerpt &rarr;
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
