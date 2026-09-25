import React, { useState } from 'react';
import { X, FileText, Hash, Bookmark, Layers, Check, Copy } from 'lucide-react';
import type { DocumentChunk } from '../types';

interface ChunkInspectorModalProps {
  chunk: DocumentChunk | null;
  onClose: () => void;
}

export const ChunkInspectorModal: React.FC<ChunkInspectorModalProps> = ({
  chunk,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!chunk) return null;

  const handleCopy = () => {
    if (!chunk?.text) return;
    navigator.clipboard.writeText(chunk.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-800/40 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                Source Excerpt Inspector
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct evidence snippet retrieved from indexed memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provenance Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[11px] mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Document</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={chunk.filename}>
              {chunk.filename}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[11px] mb-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Page / Slide</span>
            </div>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Page {chunk.page_number}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[11px] mb-1">
              <Hash className="w-3.5 h-3.5" />
              <span>Length</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {chunk.char_length} characters
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[11px] mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Format</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {chunk.file_type}
            </span>
          </div>
        </div>

        {/* Section title if present */}
        {chunk.section && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-300 font-medium flex items-center gap-2">
            <span className="font-semibold">Section:</span> {chunk.section}
          </div>
        )}

        {/* Full Text Passage Content */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verifiable Grounding Passage
            </label>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans max-h-72 overflow-y-auto whitespace-pre-wrap select-text shadow-inner">
            {chunk.text}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Grounding token ID: #{chunk.chunk_id}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
