import { ChromaClient } from 'chromadb';
import { IndexedSegment, TranscriptSummary } from '../types/transcript.js';
import path from 'path';

export class VectorDatabase {
  private client: ChromaClient;
  private collectionName: string;
  private summaryCollectionName: string;
  private collection: any; // Chroma collection type
  private summaryCollection: any; // Chroma collection for summaries
  
  constructor(dbPath: string, collectionName: string = 'transcripts') {
    // ChromaDB Node.js client requires a running ChromaDB server
    // Default connection is to http://localhost:8000
    // The dbPath parameter is used for the server's data directory when starting the server
    // For the client, we always connect to localhost:8000
    this.client = new ChromaClient({
      path: 'http://localhost:8000',
    });
    this.collectionName = collectionName;
    this.summaryCollectionName = 'transcript_summaries';
  }
  
  /**
   * Initialize or get the collection
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'Call transcript embeddings' },
      });
      
      // Initialize summary collection
      this.summaryCollection = await this.client.getOrCreateCollection({
        name: this.summaryCollectionName,
        metadata: { description: 'Call transcript summaries' },
      });
    } catch (error) {
      console.error('Error initializing collection:', error);
      throw error;
    }
  }
  
  /**
   * Add segments to the vector database
   */
  async addSegments(segments: IndexedSegment[]): Promise<void> {
    if (segments.length === 0) {
      return;
    }
    
    try {
      const ids = segments.map(s => s.id);
      const embeddings = segments.map(s => s.embedding!);
      const documents = segments.map(s => s.text);
      const metadatas = segments.map(s => ({
        filePath: s.metadata.filePath,
        fileName: s.metadata.fileName,
        clientName: s.metadata.clientName || '',
        callDate: s.metadata.callDate || '',
        participants: s.metadata.participants || '',
        callType: s.metadata.callType || '',
        startTime: s.metadata.startTime.toString(),
        endTime: s.metadata.endTime.toString(),
        speaker: s.metadata.speaker || '',
      }));
      
      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas,
      });
    } catch (error) {
      console.error('Error adding segments to vector database:', error);
      throw error;
    }
  }
  
  /**
   * Search for similar segments
   */
  async search(
    queryEmbedding: number[],
    limit: number = 10,
    minScore: number = 0.0  // Lower default - let all results through, filter in query tool
  ): Promise<Array<{
    id: string;
    text: string;
    score: number;
    metadata: IndexedSegment['metadata'];
  }>> {
    try {
      // Pure semantic search - no metadata filtering
      const queryOptions: any = {
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
      };
      
      const results = await this.collection.query(queryOptions);
      
      // DEBUG: Log query results
      console.error(`[DEBUG] ChromaDB query returned ${results.ids?.[0]?.length || 0} results`);
      console.error(`[DEBUG] Pure semantic search (no metadata filters)`);
      console.error(`[DEBUG] minScore threshold: ${minScore}`);
      
      // Process results
      const searchResults: Array<{
        id: string;
        text: string;
        score: number;
        metadata: IndexedSegment['metadata'];
      }> = [];
      
      if (results.ids && results.ids[0]) {
        console.error(`[DEBUG] Processing ${results.ids[0].length} results from ChromaDB`);
        
        for (let i = 0; i < results.ids[0].length; i++) {
          const id = results.ids[0][i];
          const distances = results.distances?.[0]?.[i];
          const document = results.documents?.[0]?.[i] || '';
          const metadata = results.metadatas?.[0]?.[i] || {};
          
          // Chroma returns distances (lower is better), convert to similarity score
          // ChromaDB uses cosine distance: distance = 1 - cosine_similarity
          // So: cosine_similarity = 1 - distance
          // Distance range: 0 (identical) to 2 (opposite)
          // Similarity range: 1 (identical) to -1 (opposite)
          // We want score 0-1 where 1 = most similar, so: score = 1 - distance (clamped to 0-1)
          const rawDistance = distances !== undefined ? distances : 2;
          // Convert distance to similarity score (1 = identical, 0 = orthogonal, negative = opposite)
          // Clamp to 0-1 range for our scoring
          const score = Math.max(0, Math.min(1, 1 - rawDistance));
          
          // DEBUG: Log each result
          console.error(`[DEBUG] Result ${i + 1}:`);
          console.error(`  - ID: ${id}`);
          console.error(`  - Raw distance: ${rawDistance}`);
          console.error(`  - Converted score: ${score.toFixed(4)}`);
          console.error(`  - Meets minScore (${minScore})? ${score >= minScore}`);
          console.error(`  - Document preview: ${document.substring(0, 100)}...`);
          console.error(`  - Metadata: ${JSON.stringify(metadata)}`);
          
          if (score >= minScore) {
            searchResults.push({
              id,
              text: document,
              score,
              metadata: {
                filePath: metadata.filePath || '',
                fileName: metadata.fileName || '',
                clientName: metadata.clientName || undefined,
                callDate: metadata.callDate || undefined,
                participants: metadata.participants || undefined,
                callType: metadata.callType || undefined,
                startTime: parseFloat(metadata.startTime || '0'),
                endTime: parseFloat(metadata.endTime || '0'),
                speaker: metadata.speaker || undefined,
              },
            });
          } else {
            console.error(`  - FILTERED OUT: score ${score.toFixed(4)} < minScore ${minScore}`);
          }
        }
        
        console.error(`[DEBUG] After filtering: ${searchResults.length} results passed minScore threshold`);
      } else {
        console.error(`[DEBUG] No results returned from ChromaDB query`);
      }
      
      // Sort by score descending
      searchResults.sort((a, b) => b.score - a.score);
      
      return searchResults;
    } catch (error) {
      console.error('Error searching vector database:', error);
      throw error;
    }
  }
  
  /**
   * Check if a file has been indexed
   */
  async isFileIndexed(filePath: string): Promise<boolean> {
    try {
      const results = await this.collection.get({
        where: { filePath },
        limit: 1,
      });
      return results.ids && results.ids.length > 0;
    } catch (error) {
      console.error('Error checking if file is indexed:', error);
      return false;
    }
  }
  
  /**
   * Delete segments for a specific file (useful for re-indexing)
   */
  async deleteFileSegments(filePath: string): Promise<void> {
    try {
      const results = await this.collection.get({
        where: { filePath },
      });
      
      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids,
        });
      }
    } catch (error) {
      console.error('Error deleting file segments:', error);
      throw error;
    }
  }
  
  /**
   * Get collection stats
   */
  async getStats(): Promise<{ count: number }> {
    try {
      const results = await this.collection.get({ limit: 1 });
      // Chroma doesn't have a direct count, but we can estimate
      // For now, return a basic structure
      return {
        count: results.ids?.length || 0,
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return { count: 0 };
    }
  }
  
  /**
   * Add a transcript summary to the vector database
   */
  async addTranscriptSummary(summary: TranscriptSummary): Promise<void> {
    try {
      const metadata = {
        filePath: summary.metadata.filePath,
        fileName: summary.metadata.fileName,
        clientName: summary.metadata.clientName || '',
        callDate: summary.metadata.callDate?.toISOString() || '',
        participants: summary.metadata.participants?.join(', ') || '',
        callType: summary.metadata.callType || '',
      };
      
      await this.summaryCollection.add({
        ids: [summary.id],
        embeddings: [summary.embedding],
        documents: [summary.summaryText],
        metadatas: [metadata],
      });
      
      console.error(`[VectorDB] Added transcript summary: ${summary.id}`);
    } catch (error) {
      console.error('Error adding transcript summary to vector database:', error);
      throw error;
    }
  }
  
  /**
   * Search for similar transcript summaries
   */
  async searchSummaries(
    queryEmbedding: number[],
    limit: number = 5,
    minScore: number = 0.0
  ): Promise<Array<TranscriptSummary>> {
    try {
      const queryOptions: any = {
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
      };
      
      const results = await this.summaryCollection.query(queryOptions);
      
      console.error(`[VectorDB] Summary search returned ${results.ids?.[0]?.length || 0} results`);
      
      const summaries: TranscriptSummary[] = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const id = results.ids[0][i];
          const distances = results.distances?.[0]?.[i];
          const document = results.documents?.[0]?.[i] || '';
          const metadata = results.metadatas?.[0]?.[i] || {};
          
          // Convert distance to similarity score
          const rawDistance = distances !== undefined ? distances : 2;
          const score = Math.max(0, Math.min(1, 1 - rawDistance));
          
          console.error(`[VectorDB] Summary result ${i + 1}: score=${score.toFixed(4)}, file=${metadata.fileName}`);
          
          if (score >= minScore) {
            summaries.push({
              id,
              summaryText: document,
              embedding: [], // Don't need to return the embedding
              metadata: {
                filePath: metadata.filePath || '',
                fileName: metadata.fileName || '',
                clientName: metadata.clientName || undefined,
                callDate: metadata.callDate ? new Date(metadata.callDate) : undefined,
                participants: metadata.participants ? metadata.participants.split(', ').filter((p: string) => p) : undefined,
                callType: metadata.callType || undefined,
              },
            });
          }
        }
      }
      
      return summaries;
    } catch (error) {
      console.error('Error searching transcript summaries:', error);
      throw error;
    }
  }
  
  /**
   * Check if a transcript summary has been indexed
   */
  async isSummaryIndexed(filePath: string): Promise<boolean> {
    try {
      const results = await this.summaryCollection.get({
        where: { filePath },
        limit: 1,
      });
      return results.ids && results.ids.length > 0;
    } catch (error) {
      console.error('Error checking if summary is indexed:', error);
      return false;
    }
  }
  
  /**
   * Delete a transcript summary (useful for re-indexing)
   */
  async deleteSummary(filePath: string): Promise<void> {
    try {
      const results = await this.summaryCollection.get({
        where: { filePath },
      });
      
      if (results.ids && results.ids.length > 0) {
        await this.summaryCollection.delete({
          ids: results.ids,
        });
        console.error(`[VectorDB] Deleted summary for: ${filePath}`);
      }
    } catch (error) {
      console.error('Error deleting transcript summary:', error);
      throw error;
    }
  }
}
