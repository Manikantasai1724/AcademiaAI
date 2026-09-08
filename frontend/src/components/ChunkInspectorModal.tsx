import React from 'react';
import { X, FileText, Hash, Bookmark, Layers } from 'lucide-react';
import type { DocumentChunk } from '../types';

interface ChunkInspectorModalProps {
  chunk: DocumentChunk | null;
  onClose: () => void;
}

export const ChunkInspectorModal: React.FC<ChunkInspectorModalProps> = ({
  chunk,
  onClose,
}) => {
  if (!chunk) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Retrieved Passage Inspector
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {chunk.chunk_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provenance Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1 text-slate-400 text-[11px] mb-0.5">
              <FileText className="w-3 h-3" />
              <span>Document</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 truncate" title={chunk.filename}>
              {chunk.filename}
            </p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1 text-slate-400 text-[11px] mb-0.5">
              <Bookmark className="w-3 h-3" />
              <span>Page / Slide</span>
            </div>
            <p className="text-xs font-semibold text-indigo-600">
              Page {chunk.page_number}
            </p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1 text-slate-400 text-[11px] mb-0.5">
              <Hash className="w-3 h-3" />
              <span>Characters</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {chunk.char_length} chars
            </p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-1 text-slate-400 text-[11px] mb-0.5">
              <Layers className="w-3 h-3" />
              <span>Format</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {chunk.file_type}
            </span>
          </div>
        </div>

        {/* Section title if present */}
        {chunk.section && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 font-medium">
            Section: {chunk.section}
          </div>
        )}

        {/* Full Text Passage Content */}
        <div className="mt-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
            Exact Source Passage
          </label>
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans max-h-72 overflow-y-auto whitespace-pre-wrap select-text">
            {chunk.text}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
