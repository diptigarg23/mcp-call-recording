import 'dotenv/config';
import { MCPServer } from './server.js';
import { EmbeddingService } from './services/embeddingService.js';
import { VectorDatabase } from './services/vectorDb.js';
import { FileWatcher } from './services/fileWatcher.js';
import { Indexer } from './services/indexer.js';
import path from 'path';

async function main() {
  // Load environment variables
  const embeddingModel = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
  const vttDirectory = process.env.VTT_DIRECTORY;
  const chromaDbPath = process.env.CHROMA_DB_PATH || './chroma_db';
  
  if (!vttDirectory) {
    throw new Error('VTT_DIRECTORY environment variable is required');
  }
  
  // Initialize services
  const embeddingService = new EmbeddingService(embeddingModel);
  const vectorDb = new VectorDatabase(chromaDbPath);
  
  // Initialize vector database
  await vectorDb.initialize();
  
  // Initialize indexer
  const indexer = new Indexer(embeddingService, vectorDb);
  
  // Index existing files on startup
  console.error('Indexing existing VTT files...');
  try {
    await indexer.indexDirectory(vttDirectory, false);
  } catch (error) {
    console.error('Error indexing existing files:', error);
  }
  
  // Set up file watcher for automatic indexing
  const fileWatcher = new FileWatcher(vttDirectory);
  
  fileWatcher.on('fileAdded', async (filePath) => {
    console.error(`New file detected: ${filePath}`);
    try {
      await indexer.indexFile(filePath, false);
    } catch (error) {
      console.error(`Error indexing new file ${filePath}:`, error);
    }
  });
  
  fileWatcher.on('fileChanged', async (filePath) => {
    console.error(`File changed: ${filePath}`);
    try {
      await indexer.indexFile(filePath, true); // Force reindex on change
    } catch (error) {
      console.error(`Error re-indexing changed file ${filePath}:`, error);
    }
  });
  
  fileWatcher.on('fileDeleted', async (filePath) => {
    console.error(`File deleted: ${filePath}`);
    try {
      await vectorDb.deleteFileSegments(filePath);
    } catch (error) {
      console.error(`Error deleting segments for file ${filePath}:`, error);
    }
  });
  
  fileWatcher.on('error', (error) => {
    console.error('File watcher error:', error);
  });
  
  // Start file watcher
  fileWatcher.start();
  
  // Create and start MCP server
  const mcpServer = new MCPServer(embeddingService, vectorDb);
  await mcpServer.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
