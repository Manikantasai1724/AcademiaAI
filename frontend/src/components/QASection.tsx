import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  AlertCircle,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  FileText,
  Lightbulb,
  FileSearch,
  BookOpen,
} from 'lucide-react';
import type { Citation, ConversationMessage, DocumentChunk, QAResponse } from '../types';
import { askQuestion } from '../services/api';

interface QASectionProps {
  onInspectChunk: (chunk: DocumentChunk) => void;
}

const ACTION_SUGGESTIONS = [
  { label: 'Explain Simpler', icon: Lightbulb, query: 'Explain the core intuition and mechanism in simple terms without losing technical rigor.' },
  { label: 'Summarize Methodology', icon: FileSearch, query: 'What is the precise experimental methodology, dataset, and hypothesis tested?' },
  { label: 'Key Findings & Metrics', icon: Sparkles, query: 'What are the main benchmark results, quantitative metrics, and conclusions reached?' },
  { label: 'Limitations & Assumptions', icon: BookOpen, query: 'What limitations, edge cases, and theoretical assumptions are discussed in the text?' },
];

export const QASection: React.FC<QASectionProps> = ({ onInspectChunk }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [lastAskedQuestion, setLastAskedQuestion] = useState<string>('');

  // Configurable search parameters
  const [topK, setTopK] = useState<number>(3);
  const [threshold, setThreshold] = useState<number>(0.35);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleSubmit = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setLastAskedQuestion(query);

    try {
      const res = await askQuestion({
        question: query,
        top_k: topK,
        threshold: threshold,
        conversation_history: history,
      });

      setResponse(res);

      // Append to conversational history
      setHistory((prev) => [
        ...prev.slice(-4),
        { role: 'user', content: query },
        { role: 'assistant', content: res.answer },
      ]);

      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    const chunkObj: DocumentChunk = {
      chunk_id: citation.chunk_id,
      document_id: 'doc_' + citation.filename,
      filename: citation.filename,
      file_type: citation.filename.split('.').pop() || 'pdf',
      page_number: citation.page_number,
      section: citation.section,
      text: citation.passage,
      char_length: citation.passage.length,
    };
    onInspectChunk(chunkObj);
  };

  return (
    <div className="space-y-6">
      {/* Interactive RAG Workspace Box */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200">
        {/* Section Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Research & Literature Synthesis</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Grounded Output
            </span>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>Parameters</span>
              {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Retrieval Settings */}
        {showSettings && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
            <div>
              <div className="flex justify-between mb-1 font-medium text-slate-700 dark:text-slate-300">
                <span>Included Source Passages:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Number of semantically relevant excerpts provided to answer your query.
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-medium text-slate-700 dark:text-slate-300">
                <span>Relevance Sensitivity:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Cosine similarity cut-off. Chunks below this threshold are discarded.
              </p>
            </div>
          </div>
        )}

        {/* Main Q&A Area */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Preset / Quick Action Buttons (Matching Reference Design) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Targeted Study Commands
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ACTION_SUGGESTIONS.map((sug, idx) => {
                const IconComponent = sug.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setQuestion(sug.query);
                      handleSubmit(sug.query);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isLoading
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200/60 dark:border-slate-700/60 cursor-pointer active:scale-95'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{sug.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Chat Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="relative"
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a complex question about your documents, theorems, or methodologies..."
              rows={3}
              className="w-full p-4 pr-28 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors shadow-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            <div className="absolute right-3 bottom-3.5 flex items-center gap-2">
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
                ↵ Enter
              </span>
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:cursor-not-allowed active:scale-95"
              >
                {isLoading ? (
                  <span>Synthesizing...</span>
                ) : (
                  <>
                    <span>Ask AI</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Answer Bubble & Citations Section */}
          {response && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-200">
              {/* Student Query Bubble */}
              {lastAskedQuestion && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                    You
                  </div>
                  <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl rounded-tl-sm p-4 border border-slate-200/70 dark:border-slate-700/60 max-w-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium">
                    {lastAskedQuestion}
                  </div>
                </div>
              )}

              {/* AcademiaAI Synthesis Card */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                  <BrainCircuit className="w-5 h-5" />
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-display">
                        AcademiaAI Verified Synthesis
                      </span>
                      {response.sources.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold text-[11px] border border-violet-200/80 dark:border-violet-800/60">
                          RAG Grounded ({response.sources.length} Sources)
                        </span>
                      )}
                    </div>

                    {response.confidence_passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>High Grounding Confidence</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Broad Fallback</span>
                      </span>
                    )}
                  </div>

                  {/* Formatted Answer Text */}
                  <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-100 dark:selection:bg-indigo-950">
                    {response.answer}
                  </div>

                  {/* Retrieved Document Citations Grid (From Reference Design) */}
                  {response.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        Retrieved Document Context & Citations:
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {response.sources.map((cit) => (
                          <div
                            key={cit.chunk_id}
                            onClick={() => handleCitationClick(cit)}
                            className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-400 dark:hover:border-indigo-500/70 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1.5 truncate max-w-[200px]" title={cit.filename}>
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span>[{cit.source_number}] {cit.filename} (p.{cit.page_number})</span>
                              </span>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {Math.round(cit.similarity_score * 100)}% match
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 leading-relaxed">
                              "{cit.passage}"
                            </p>

                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400">
                              <span>Page {cit.page_number}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5 group-hover:underline">
                                <span>View Excerpt</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
