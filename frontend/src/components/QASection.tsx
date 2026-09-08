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
} from 'lucide-react';
import type { Citation, ConversationMessage, DocumentChunk, QAResponse } from '../types';
import { askQuestion } from '../services/api';

interface QASectionProps {
  onInspectChunk: (chunk: DocumentChunk) => void;
}

const PRESET_QUESTIONS = [
  'What is backpropagation in deep learning?',
  'Why does self-attention scale dot products by sqrt(d_k)?',
  'How does dense semantic retrieval differ from sparse search?',
  'What are the computational steps in Stochastic Gradient Descent?',
];

export const QASection: React.FC<QASectionProps> = ({ onInspectChunk }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationMessage[]>([]);

  // Configurable retrieval parameters
  const [topK, setTopK] = useState<number>(3);
  const [threshold, setThreshold] = useState<number>(0.35);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleSubmit = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await askQuestion({
        question: query,
        top_k: topK,
        threshold: threshold,
        conversation_history: history,
      });

      setResponse(res);

      // Append to conversational memory
      setHistory((prev) => [
        ...prev.slice(-4), // keep last 4 items
        { role: 'user', content: query },
        { role: 'assistant', content: res.answer },
      ]);

      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    // Reconstruct DocumentChunk object for inspection modal
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
      {/* Input Form & Parameters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Academic Question Answering
            </h2>
            <p className="text-xs text-slate-500">
              Ask natural language questions grounded strictly on your uploaded literature.
            </p>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Retrieval Settings</span>
            {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Retrieval Settings */}
        {showSettings && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-medium text-slate-700">
                <span>Top-K Chunks to Retrieve:</span>
                <span className="font-bold text-indigo-600">{topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Number of semantically closest passages sent to the context window.
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-medium text-slate-700">
                <span>Confidence Similarity Threshold (τ):</span>
                <span className="font-bold text-indigo-600">{threshold.toFixed(2)}</span>
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
              <p className="text-[11px] text-slate-500 mt-1">
                Cosine similarity cut-off. Chunks below this threshold are discarded.
              </p>
            </div>
          </div>
        )}

        {/* Question Input Field */}
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
            placeholder="E.g., How does backpropagation calculate the gradient of the loss function?"
            rows={3}
            className="w-full p-4 pr-24 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="absolute right-3 bottom-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Retrieving...</span>
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Preset Academic Question Chips */}
        <div className="pt-1">
          <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
            Suggested benchmark questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((pq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(pq);
                  handleSubmit(pq);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs transition-colors cursor-pointer text-left truncate max-w-xs"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer & Citations Display */}
      {response && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Answer Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Grounded Synthesis
                </h3>
              </div>

              {response.confidence_passed ? (
                <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>High Confidence</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Low Confidence Fallback</span>
                </span>
              )}
            </div>

            {/* Answer Text */}
            <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
              {response.answer}
            </div>
          </div>

          {/* Sources and Citations */}
          {response.sources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Retrieved Academic Sources ({response.sources.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Citations verified by FAISS index metadata
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.sources.map((cit) => (
                  <div
                    key={cit.chunk_id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                          Source {cit.source_number}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]" title={cit.filename}>
                          {cit.filename}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Page {cit.page_number}
                      </span>
                    </div>

                    {cit.section && (
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        Section: {cit.section}
                      </p>
                    )}

                    {/* Passage Preview */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 line-clamp-3 leading-relaxed select-text">
                      "{cit.passage}"
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-500">
                        Similarity Score: <strong className="text-slate-800">{cit.similarity_score.toFixed(4)}</strong>
                      </span>
                      <button
                        onClick={() => handleCitationClick(cit)}
                        className="flex items-center space-x-1 text-indigo-600 font-semibold hover:underline cursor-pointer"
                      >
                        <span>Inspect Passage</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
