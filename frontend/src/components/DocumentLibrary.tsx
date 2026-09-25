import React, { useState } from 'react';
import { FileText, Trash2, Layers, Bookmark, RefreshCw, CheckCircle2, BookOpen, Presentation, AlignLeft } from 'lucide-react';
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

  const getFormatBadge = (fileType: string) => {
    const ft = fileType.toLowerCase();
    if (ft === 'pdf') {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60',
        label: 'PDF Document',
        icon: FileText,
      };
    }
    if (ft === 'pptx') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60',
        label: 'Lecture Deck',
        icon: Presentation,
      };
    }
    if (ft === 'docx') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60',
        label: 'Word Notes',
        icon: FileText,
      };
    }
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60',
      label: 'Text Notes',
      icon: AlignLeft,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Knowledge Sources & Course Library
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
              {documents.length} File{documents.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            All documents indexed and ready for grounded question answering and semantic literature search.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Library</span>
          </button>

          {documents.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-800/80 rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 font-display">
            No Study Materials Ingested Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Upload your syllabus, lecture slides (PPTX), textbooks (PDF), or draft notes (DOCX) above to activate your personal RAG intelligence.
          </p>
          <a
            href="#upload-section"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all"
          >
            <span>Upload Document Now</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const badge = getFormatBadge(doc.file_type);
            const IconComponent = badge.icon;
            const isSelected = selectedDocId === doc.document_id;

            return (
              <div
                key={doc.document_id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/15'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`p-2.5 rounded-xl border ${badge.bg} shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={doc.filename}>
                          {doc.filename}
                        </h4>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 shrink-0" title="100% Vectorized & Grounded">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-2.5 border-t border-slate-100 dark:border-slate-800 my-1 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{doc.chunk_count} semantic excerpts</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.max_page} pages/slides</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => loadChunksForDoc(doc.document_id)}
                  className={`w-full mt-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  }`}
                >
                  {isSelected ? 'Hide Excerpts' : 'View Passages'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Document Chunks View */}
      {selectedDocId && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-indigo-200/90 dark:border-indigo-900/80 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">
              Indexed Excerpt Fragments ({docChunks.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Click any passage to inspect full metadata</span>
          </div>

          {isLoadingChunks ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">Decompressing vector index chunks...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {docChunks.map((chunk) => (
                <div
                  key={chunk.chunk_id}
                  onClick={() => onInspectChunk(chunk)}
                  className="p-4 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="text-indigo-600 dark:text-indigo-400">Page {chunk.page_number}</span>
                    <span className="text-slate-400 dark:text-slate-500">{chunk.char_length} characters</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed italic">
                    "{chunk.text}"
                  </p>
                  <span className="mt-2.5 inline-block text-[11px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                    Inspect Full Passage &rarr;
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
