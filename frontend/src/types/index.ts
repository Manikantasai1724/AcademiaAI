export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  file_type: string;
  page_number: number;
  section?: string | null;
  text: string;
  char_length: number;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  rank: number;
}

export interface SearchResponse {
  query: string;
  total_indexed_chunks: number;
  results: SearchResult[];
  confidence_passed: boolean;
}

export interface Citation {
  source_number: number;
  filename: string;
  page_number: number;
  section?: string | null;
  chunk_id: string;
  passage: string;
  similarity_score: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QARequest {
  question: string;
  top_k?: number;
  threshold?: number;
  conversation_history?: ConversationMessage[];
}

export interface QAResponse {
  question: string;
  answer: string;
  sources: Citation[];
  is_grounded: boolean;
  confidence_passed: boolean;
  total_retrieved: number;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  file_type: string;
  chunk_count: number;
  max_page: number;
}

export interface CorpusStats {
  total_indexed_chunks: number;
  dimension: number;
  unique_documents: number;
  indexed_files: string[];
}
