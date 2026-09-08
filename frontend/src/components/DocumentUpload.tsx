import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../services/api';

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'pptx', 'txt'].includes(ext || '')) {
      setMessage({
        text: 'Unsupported file type. Please upload a PDF, DOCX, PPTX, or TXT file.',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const res = await uploadDocument(file);
      setMessage({
        text: `Indexed "${res.filename}" (${res.chunks_created} chunks, ${res.total_pages} pages).`,
        type: 'success',
      });
      onUploadSuccess();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to upload and index document.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <h2 className="text-base font-bold text-slate-900 mb-1">
        Upload Academic Materials
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Supports PDF research papers, DOCX lecture notes, PPTX seminar slides, and TXT outlines.
      </p>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-indigo-600 hover:underline">
              Click to choose file
            </span>
            <span className="text-xs text-slate-500"> or drag and drop here</span>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
              PDF
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
              DOCX
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
              PPTX
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
              TXT
            </span>
          </div>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-xl flex items-center space-x-2.5 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
