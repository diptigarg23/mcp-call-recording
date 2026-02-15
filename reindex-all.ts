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
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const vttDirectory = process.env.VTT_DIRECTORY;
  const chromaDbPath = process.env.CHROMA_DB_PATH || './chroma_db';
  
  if (!openaiApiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  if (!vttDirectory) {
    console.error('Error: VTT_DIRECTORY environment variable is required');
    process.exit(1);
  }
  
  console.error(`Re-indexing all files in: ${vttDirectory}`);
  console.error(`Using OpenAI API (gpt-4-turbo for summaries, text-embedding-3-small for embeddings)`);
  
  // Initialize services with OpenAI
  const embeddingService = new EmbeddingService(openaiApiKey);
  const summaryService = new SummaryService(openaiApiKey);
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
