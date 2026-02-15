import { EmbeddingService } from '../services/embeddingService.js';
import { VectorDatabase } from '../services/vectorDb.js';
import { TranscriptSummary } from '../types/transcript.js';

export interface QueryResult {
  answer: string;
  summaries: TranscriptSummary[];
}

export class QueryTool {
  private embeddingService: EmbeddingService;
  private vectorDb: VectorDatabase;
  
  constructor(embeddingService: EmbeddingService, vectorDb: VectorDatabase) {
    this.embeddingService = embeddingService;
    this.vectorDb = vectorDb;
  }
  
  /**
   * Query transcript summaries with a natural language question
   */
  async queryTranscripts(
    question: string,
    limit: number = 5,
    minScore: number = 0.0
  ): Promise<QueryResult> {
    try {
      console.error(`[QueryTool] Query received: "${question}"`);
      console.error(`[QueryTool] Parameters: limit=${limit}, minScore=${minScore}`);
      
      // Generate embedding for the question
      console.error(`[QueryTool] Generating embedding for query...`);
      const queryEmbedding = await this.embeddingService.generateEmbedding(question);
      console.error(`[QueryTool] Query embedding generated: dimension=${queryEmbedding.length}`);
      
      // Search transcript summaries
      console.error(`[QueryTool] Searching transcript summaries...`);
      const searchResults = await this.vectorDb.searchSummaries(
        queryEmbedding,
        limit,
        minScore
      );
      console.error(`[QueryTool] Search returned ${searchResults.length} summaries`);
      
      if (searchResults.length === 0) {
        return {
          answer: 'No relevant transcript summaries found for your query.',
          summaries: [],
        };
      }
      
      // Format answer with the summaries
      const answer = this.formatAnswer(searchResults);
      
      return {
        answer,
        summaries: searchResults,
      };
    } catch (error) {
      console.error('[QueryTool] Error querying transcripts:', error);
      throw error;
    }
  }
  
  /**
   * Format answer from summary search results
   */
  private formatAnswer(summaries: TranscriptSummary[]): string {
    if (summaries.length === 0) {
      return 'No relevant information found.';
    }
    
    let answer = '';
    
    // If only one summary, return it directly
    if (summaries.length === 1) {
      const summary = summaries[0];
      answer += `**Transcript: ${summary.metadata.fileName}**\n\n`;
      answer += summary.summaryText;
      return answer;
    }
    
    // If multiple summaries, show them with headers
    answer = `Found ${summaries.length} relevant transcripts:\n\n`;
    
    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      answer += `---\n\n`;
      answer += `**${i + 1}. ${summary.metadata.fileName}**\n\n`;
      answer += summary.summaryText;
      answer += `\n\n`;
    }
    
    return answer;
  }
}
