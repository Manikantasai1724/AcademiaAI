import type {
  CorpusStats,
  DocumentChunk,
  DocumentInfo,
  QARequest,
  QAResponse,
  SearchResponse,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

export async function uploadDocument(file: File): Promise<{
  document_id: string;
  filename: string;
  file_type: string;
  total_pages: number;
  chunks_created: number;
  message: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }

  return res.json();
}

export async function listDocuments(): Promise<{
  corpus_stats: CorpusStats;
  documents: DocumentInfo[];
}> {
  const res = await fetch(`${API_BASE_URL}/documents`);
  if (!res.ok) {
    throw new Error('Failed to fetch indexed documents');
  }
  return res.json();
}

export async function semanticSearch(
  query: string,
  top_k?: number,
  threshold?: number
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k, threshold }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Search failed' }));
    throw new Error(err.detail || 'Search failed');
  }

  return res.json();
}

export async function askQuestion(request: QARequest): Promise<QAResponse> {
  const res = await fetch(`${API_BASE_URL}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Question answering failed' }));
    throw new Error(err.detail || 'Question answering failed');
  }

  return res.json();
}

export async function inspectChunks(document_id?: string): Promise<{
  total: number;
  chunks: DocumentChunk[];
}> {
  const url = document_id
    ? `${API_BASE_URL}/chunks?document_id=${encodeURIComponent(document_id)}`
    : `${API_BASE_URL}/chunks`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to inspect chunks');
  }
  return res.json();
}

export async function clearIndex(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/index`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to clear vector index');
  }
  return res.json();
}
