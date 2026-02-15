import { readFileSync, existsSync } from 'fs';
import { VTTParser } from './vttParser.js';
import { MetadataExtractor } from './metadataExtractor.js';
import { EmbeddingService } from './embeddingService.js';
import { VectorDatabase } from './vectorDb.js';
import { SummaryService } from './summaryService.js';
import { TranscriptSummary } from '../types/transcript.js';
import path from 'path';

export class Indexer {
  private vttParser: VTTParser;
  private metadataExtractor: MetadataExtractor;
  private embeddingService: EmbeddingService;
  private summaryService: SummaryService;
  private vectorDb: VectorDatabase;
  private indexingInProgress: Set<string> = new Set();
  
  constructor(
    embeddingService: EmbeddingService,
    summaryService: SummaryService,
    vectorDb: VectorDatabase
  ) {
    this.vttParser = new VTTParser();
    this.metadataExtractor = new MetadataExtractor();
    this.embeddingService = embeddingService;
    this.summaryService = summaryService;
    this.vectorDb = vectorDb;
  }
  
  /**
   * Index a VTT file
   */
  async indexFile(filePath: string, forceReindex: boolean = false): Promise<void> {
    // Prevent concurrent indexing of the same file
    if (this.indexingInProgress.has(filePath)) {
      console.error(`File ${filePath} is already being indexed, skipping...`);
      return;
    }
    
    if (!existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return;
    }
    
    // Check if already indexed (unless force reindex)
    if (!forceReindex) {
      const isIndexed = await this.vectorDb.isSummaryIndexed(filePath);
      if (isIndexed) {
        console.error(`File already indexed: ${filePath}`);
        return;
      }
    } else {
      // Delete existing summary before re-indexing
      await this.vectorDb.deleteSummary(filePath);
    }
    
    this.indexingInProgress.add(filePath);
    
    try {
      console.error(`Indexing file: ${filePath}`);
      
      // Parse VTT file
      const parsed = this.vttParser.parseVTTFile(filePath);
      
      if (parsed.segments.length === 0) {
        console.error(`No segments found in file: ${filePath}`);
        return;
      }
      
      // Extract metadata
      const vttContent = readFileSync(filePath, 'utf-8');
      const extractedMetadata = this.metadataExtractor.extractMetadata(filePath, vttContent);
      
      // Merge metadata
      const metadata = {
        ...parsed.metadata,
        ...extractedMetadata,
      };
      
      // Update parsed transcript metadata
      parsed.metadata = metadata;
      
      console.error(`[Indexer] Generating structured summary using OpenAI...`);
      
      // Generate structured summary using OpenAI
      const summaryText = await this.summaryService.generateSummary(parsed);
      
      console.error(`[Indexer] Summary generated (${summaryText.length} characters)`);
      console.error(`[Indexer] Generating embedding for summary...`);
      
      // Generate embedding for the summary
      const summaryEmbedding = await this.embeddingService.generateEmbedding(summaryText);
      
      console.error(`[Indexer] Summary embedding generated (dimension: ${summaryEmbedding.length})`);
      
      // Create transcript summary object
      const transcriptSummary: TranscriptSummary = {
        id: this.summaryService.generateSummaryId(filePath),
        summaryText: summaryText,
        embedding: summaryEmbedding,
        metadata: metadata,
      };
      
      // Store in vector database
      await this.vectorDb.addTranscriptSummary(transcriptSummary);
      
      console.error(`Successfully indexed transcript summary for ${filePath}`);
    } catch (error) {
      console.error(`Error indexing file ${filePath}:`, error);
      throw error;
    } finally {
      this.indexingInProgress.delete(filePath);
    }
  }
  
  /**
   * Index all VTT files in a directory
   */
  async indexDirectory(directoryPath: string, forceReindex: boolean = false): Promise<void> {
    const { readdir, stat } = await import('fs/promises');
    
    try {
      const files = await readdir(directoryPath);
      const vttFiles = files.filter(file => file.endsWith('.vtt'));
      
      console.error(`Found ${vttFiles.length} VTT files in ${directoryPath}`);
      
      for (const file of vttFiles) {
        const filePath = path.join(directoryPath, file);
        try {
          await this.indexFile(filePath, forceReindex);
        } catch (error) {
          console.error(`Failed to index ${filePath}:`, error);
          // Continue with other files
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directoryPath}:`, error);
      throw error;
    }
  }
}
