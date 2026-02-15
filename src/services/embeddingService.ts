import OpenAI from 'openai';

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;
  
  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }
  
  /**
   * Generate embeddings for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.error(`[EmbeddingService] Generating embedding using OpenAI (${this.model})...`);
      
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });
      
      const embedding = response.data[0].embedding;
      
      // Verify embedding dimensions
      console.error(`[EmbeddingService] Embedding generated: dimension=${embedding.length}`);
      
      // OpenAI embeddings are already normalized, but verify
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      console.error(`[DEBUG] Embedding L2 norm: ${norm.toFixed(4)} (expected ~1.0)`);
      
      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error);
      throw error;
    }
  }
  
  /**
   * Generate embeddings for multiple texts (batch operation)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }
}
