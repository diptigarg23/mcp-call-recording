import { EmbeddingService } from '../services/embeddingService.js';
import { VectorDatabase } from '../services/vectorDb.js';

export interface QueryResult {
  answer: string;
  segments: Array<{
    text: string;
    score: number;
    metadata: {
      fileName: string;
      clientName?: string;
      callDate?: string;
      startTime: number;
      endTime: number;
      speaker?: string;
    };
  }>;
}

export class QueryTool {
  private embeddingService: EmbeddingService;
  private vectorDb: VectorDatabase;
  
  constructor(embeddingService: EmbeddingService, vectorDb: VectorDatabase) {
    this.embeddingService = embeddingService;
    this.vectorDb = vectorDb;
  }
  
  /**
   * Query transcripts with a natural language question
   */
  async queryTranscripts(
    question: string,
    limit: number = 10,
    minScore: number = 0.0  // Very low default - we'll filter by relevance in results
  ): Promise<QueryResult> {
    try {
      console.error(`[DEBUG] Query received: "${question}"`);
      console.error(`[DEBUG] Parameters: limit=${limit}, minScore=${minScore}`);
      
      // Generate embedding for the question
      console.error(`[DEBUG] Generating embedding for query...`);
      const queryEmbedding = await this.embeddingService.generateEmbedding(question);
      console.error(`[DEBUG] Query embedding generated: dimension=${queryEmbedding.length}, sample=[${queryEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
      
      // Search vector database (pure semantic search, no metadata filters)
      console.error(`[DEBUG] Searching vector database (semantic search only)...`);
      const searchResults = await this.vectorDb.search(
        queryEmbedding,
        limit,
        minScore
      );
      console.error(`[DEBUG] Search returned ${searchResults.length} results`);
      
      if (searchResults.length === 0) {
        return {
          answer: 'No relevant transcript segments found for your query.',
          segments: [],
        };
      }
      
      // Format answer with relevant segments
      const answer = this.formatAnswer(question, searchResults);
      
      return {
        answer,
        segments: searchResults.map(result => ({
          text: result.text,
          score: result.score,
          metadata: {
            fileName: result.metadata.fileName,
            clientName: result.metadata.clientName,
            callDate: result.metadata.callDate,
            startTime: result.metadata.startTime,
            endTime: result.metadata.endTime,
            speaker: result.metadata.speaker,
          },
        })),
      };
    } catch (error) {
      console.error('Error querying transcripts:', error);
      throw error;
    }
  }
  
  /**
   * Extract filters from natural language query
   */
  private extractFilters(question: string): {
    clientName?: string;
    callDate?: string;
    participants?: string;
  } {
    const filters: {
      clientName?: string;
      callDate?: string;
      participants?: string;
    } = {};
    
    // Try to extract client name (common patterns)
    const clientPatterns = [
      /(?:with|from|to)\s+([A-Z][A-Za-z\s&]+?)(?:\s+with|\s+on|\s+in|$)/,
      /client\s+([A-Z][A-Za-z\s&]+?)(?:\s+with|\s+on|\s+in|$)/i,
      /([A-Z][A-Za-z\s&]+?)\s+call/i,
    ];
    
    for (const pattern of clientPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const potentialClient = match[1].trim();
        // Filter out common words that aren't client names
        if (!['Sales', 'Marketing', 'Support', 'Call'].includes(potentialClient)) {
          filters.clientName = potentialClient;
          break;
        }
      }
    }
    
    // Try to extract date (common patterns)
    const datePatterns = [
      /(?:on|from|since)\s+(\d{4}-\d{2}-\d{2})/,
      /(?:on|from|since)\s+(\w+\s+\d{1,2},?\s+\d{4})/,
      /last\s+(?:week|month|year)/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = question.match(pattern);
      if (match) {
        // For "last week/month/year", we'd need to calculate the date
        // For now, just note that a date filter was requested
        if (match[1] && match[1].includes('-')) {
          filters.callDate = match[1];
        }
        break;
      }
    }
    
    // Try to extract participants
    const participantPatterns = [
      /(?:with|from)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
      /participant[s]?\s+([A-Z][a-z]+)/i,
    ];
    
    for (const pattern of participantPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        filters.participants = match[1].trim();
        break;
      }
    }
    
    return filters;
  }
  
  /**
   * Format answer from search results
   */
  private formatAnswer(question: string, results: Array<{
    text: string;
    score: number;
    metadata: any;
  }>): string {
    if (results.length === 0) {
      return 'No relevant information found.';
    }
    
    // Group results by file/client for better organization
    const groupedByFile = new Map<string, typeof results>();
    for (const result of results) {
      const key = result.metadata.fileName || 'unknown';
      if (!groupedByFile.has(key)) {
        groupedByFile.set(key, []);
      }
      groupedByFile.get(key)!.push(result);
    }
    
    let answer = `Based on the transcript search, here are the relevant findings:\n\n`;
    
    for (const [fileName, fileResults] of groupedByFile.entries()) {
      const firstResult = fileResults[0];
      answer += `**From ${fileName}**`;
      
      if (firstResult.metadata.clientName) {
        answer += ` (Client: ${firstResult.metadata.clientName})`;
      }
      if (firstResult.metadata.callDate) {
        const date = new Date(firstResult.metadata.callDate);
        answer += ` (Date: ${date.toLocaleDateString()})`;
      }
      answer += `:\n\n`;
      
      // Add top segments from this file
      const topSegments = fileResults.slice(0, 3); // Top 3 per file
      for (const result of topSegments) {
        answer += `- ${result.text}\n`;
        if (result.metadata.speaker) {
          answer += `  (Speaker: ${result.metadata.speaker})\n`;
        }
        answer += `  (Relevance: ${(result.score * 100).toFixed(1)}%)\n\n`;
      }
    }
    
    if (results.length > 5) {
      answer += `\n*Found ${results.length} total relevant segments. Showing top results.*`;
    }
    
    return answer;
  }
}
