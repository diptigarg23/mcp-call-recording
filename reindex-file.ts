#!/usr/bin/env tsx
/**
 * Script to force re-index a VTT file
 * Usage: tsx reindex-file.ts <file-path>
 */
import 'dotenv/config';
import { EmbeddingService } from './src/services/embeddingService.js';
import { SummaryService } from './src/services/summaryService.js';
import { VectorDatabase } from './src/services/vectorDb.js';
import { Indexer } from './src/services/indexer.js';
import path from 'path';

async function reindexFile(filePath: string) {
  const embeddingModel = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
  const chromaDbPath = process.env.CHROMA_DB_PATH || './chroma_db';
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'phi3';
  
  console.error(`Re-indexing file: ${filePath}`);
  console.error(`Using Ollama at ${ollamaBaseUrl} with model ${ollamaModel}`);
  
  // Initialize services
  const embeddingService = new EmbeddingService(embeddingModel);
  const summaryService = new SummaryService(ollamaBaseUrl, ollamaModel);
  const vectorDb = new VectorDatabase(chromaDbPath);
  
  await vectorDb.initialize();
  const indexer = new Indexer(embeddingService, summaryService, vectorDb);
  
  // Force re-index the file
  try {
    await indexer.indexFile(filePath, true); // true = force reindex
    console.error(`Successfully re-indexed: ${filePath}`);
  } catch (error) {
    console.error(`Error re-indexing file:`, error);
    process.exit(1);
  }
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: tsx reindex-file.ts <path-to-vtt-file>');
  console.error('Example: tsx reindex-file.ts vtt_files/CapitalOne_2026-01-15_Sales.vtt');
  process.exit(1);
}

// Resolve to absolute path if relative
const absolutePath = path.isAbsolute(filePath) 
  ? filePath 
  : path.resolve(process.cwd(), filePath);

reindexFile(absolutePath).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
