#!/usr/bin/env tsx
/**
 * Script to force re-index all VTT files in the directory
 * Usage: tsx reindex-all.ts
 */
import 'dotenv/config';
import { EmbeddingService } from './src/services/embeddingService.js';
import { SummaryService } from './src/services/summaryService.js';
import { VectorDatabase } from './src/services/vectorDb.js';
import { Indexer } from './src/services/indexer.js';

async function reindexAll() {
  const embeddingModel = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
  const vttDirectory = process.env.VTT_DIRECTORY;
  const chromaDbPath = process.env.CHROMA_DB_PATH || './chroma_db';
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'phi3';
  
  if (!vttDirectory) {
    console.error('Error: VTT_DIRECTORY environment variable is required');
    process.exit(1);
  }
  
  console.error(`Re-indexing all files in: ${vttDirectory}`);
  console.error(`Using Ollama at ${ollamaBaseUrl} with model ${ollamaModel}`);
  
  // Initialize services
  const embeddingService = new EmbeddingService(embeddingModel);
  const summaryService = new SummaryService(ollamaBaseUrl, ollamaModel);
  const vectorDb = new VectorDatabase(chromaDbPath);
  
  await vectorDb.initialize();
  const indexer = new Indexer(embeddingService, summaryService, vectorDb);
  
  // Force re-index all files
  try {
    await indexer.indexDirectory(vttDirectory, true); // true = force reindex
    console.error(`Successfully re-indexed all files in: ${vttDirectory}`);
  } catch (error) {
    console.error(`Error re-indexing files:`, error);
    process.exit(1);
  }
}

reindexAll().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
