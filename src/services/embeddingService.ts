import { pipeline } from '@xenova/transformers';

export class EmbeddingService {
  private model: string;
  private embedder: any = null;
  private modelLoading: Promise<any> | null = null;
  
  constructor(model: string = 'Xenova/all-MiniLM-L6-v2') {
    this.model = model;
  }
  
  /**
   * Initialize the embedding model (lazy loading)
   */
  private async initializeModel(): Promise<void> {
    if (this.embedder) {
      return;
    }
    
    if (this.modelLoading) {
      return this.modelLoading;
    }
    
    this.modelLoading = (async () => {
      try {
        console.error(`Loading embedding model: ${this.model}...`);
        this.embedder = await pipeline('feature-extraction', this.model, {
          quantized: true, // Use quantized model for faster loading and smaller size
        });
        console.error('Embedding model loaded successfully');
      } catch (error) {
        console.error('Error loading embedding model:', error);
        this.modelLoading = null;
        throw error;
      }
    })();
    
    return this.modelLoading;
  }
  
  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      await this.initializeModel();
      
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Convert tensor to array
      let embedding = Array.from(output.data) as number[];
      
      // DEBUG: Check normalization (L2 norm should be ~1.0)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      console.error(`[DEBUG] Embedding L2 norm: ${norm.toFixed(4)} (expected ~1.0)`);
      
      // Ensure normalization (even if the model says it's normalized, double-check)
      if (Math.abs(norm - 1.0) > 0.01) {
        console.error(`[DEBUG] Normalizing embedding manually (norm was ${norm.toFixed(4)})`);
        embedding = embedding.map(val => val / norm);
      }
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
  
  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(
    texts: string[],
    batchSize: number = 32, // Smaller batch size for local processing
    maxRetries: number = 3
  ): Promise<number[][]> {
    await this.initializeModel();
    
    const embeddings: number[][] = [];
    
    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let retries = 0;
      let success = false;
      
      while (retries < maxRetries && !success) {
        try {
          // Process batch
          const batchEmbeddings = await Promise.all(
            batch.map(text => this.generateEmbedding(text))
          );
          
          embeddings.push(...batchEmbeddings);
          success = true;
          
          // Small delay between batches to avoid overwhelming the system
          if (i + batchSize < texts.length) {
            await this.delay(50);
          }
        } catch (error: any) {
          retries++;
          
          if (retries < maxRetries) {
            const waitTime = 1000 * retries;
            console.error(`Error processing batch, retrying in ${waitTime}ms (${retries}/${maxRetries})`);
            await this.delay(waitTime);
          } else {
            console.error('Error generating embeddings:', error);
            throw error;
          }
        }
      }
      
      if (!success) {
        throw new Error(`Failed to generate embeddings after ${maxRetries} retries`);
      }
    }
    
    return embeddings;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
