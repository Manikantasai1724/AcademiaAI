import type {
  CorpusStats,
  DocumentChunk,
  DocumentInfo,
  QARequest,
  QAResponse,
  SearchResponse,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

export const API_DOCS_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/docs`;

export async function checkBackendHealth(): Promise<{ online: boolean; message?: string }> {
  try {
    const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const res = await fetch(`${rootUrl}/health`, { method: 'GET' });
    if (res.ok) {
      return { online: true };
    }
    return { online: false, message: `Server returned HTTP ${res.status}` };
  } catch (err: any) {
    return { online: false, message: err?.message || 'Server unreachable' };
  }
}

function handleFetchError(err: any): Error {
  if (err instanceof TypeError || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
    return new Error(
      'Cannot reach the backend server. The cloud instance (Render free tier) may be waking up from sleep mode (~30-50s). Please wait a few moments and try again.'
    );
  }
  return err;
}

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

  try {
    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(
          'Backend service is waking up or temporarily unavailable (HTTP 502 Bad Gateway). Please wait ~20-30 seconds and try again.'
        );
      }
      const err = await res.json().catch(() => ({ detail: `Upload failed (Status ${res.status})` }));
      throw new Error(err.detail || 'Upload failed');
    }

    return res.json();
  } catch (err: any) {
    throw handleFetchError(err);
  }
}

export async function listDocuments(): Promise<{
  corpus_stats: CorpusStats;
  documents: DocumentInfo[];
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents`);
    if (!res.ok) {
      throw new Error(`Failed to fetch documents (Status ${res.status})`);
    }
    return res.json();
  } catch (err: any) {
    throw handleFetchError(err);
  }
}

export async function semanticSearch(
  query: string,
  top_k?: number,
  threshold?: number
): Promise<SearchResponse> {
  try {
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
  } catch (err: any) {
    throw handleFetchError(err);
  }
}

export async function askQuestion(request: QARequest): Promise<QAResponse> {
  try {
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
  } catch (err: any) {
    throw handleFetchError(err);
  }
}

export async function inspectChunks(document_id?: string): Promise<{
  total: number;
  chunks: DocumentChunk[];
}> {
  try {
    const url = document_id
      ? `${API_BASE_URL}/chunks?document_id=${encodeURIComponent(document_id)}`
      : `${API_BASE_URL}/chunks`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to inspect chunks');
    }
    return res.json();
  } catch (err: any) {
    throw handleFetchError(err);
  }
}

export async function clearIndex(): Promise<{ message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/index`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to clear vector index');
    }
    return res.json();
  } catch (err: any) {
    throw handleFetchError(err);
  }
}
