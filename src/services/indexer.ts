import { readFileSync, existsSync } from 'fs';
import { VTTParser } from './vttParser.js';
import { MetadataExtractor } from './metadataExtractor.js';
import { EmbeddingService } from './embeddingService.js';
import { VectorDatabase } from './vectorDb.js';
import { chunkTranscriptSegments } from '../utils/chunking.js';
import { IndexedSegment } from '../types/transcript.js';
import { createHash } from 'crypto';
import path from 'path';

export class Indexer {
  private vttParser: VTTParser;
  private metadataExtractor: MetadataExtractor;
  private embeddingService: EmbeddingService;
  private vectorDb: VectorDatabase;
  private indexingInProgress: Set<string> = new Set();
  
  constructor(
    embeddingService: EmbeddingService,
    vectorDb: VectorDatabase
  ) {
    this.vttParser = new VTTParser();
    this.metadataExtractor = new MetadataExtractor();
    this.embeddingService = embeddingService;
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
      const isIndexed = await this.vectorDb.isFileIndexed(filePath);
      if (isIndexed) {
        console.error(`File already indexed: ${filePath}`);
        return;
      }
    } else {
      // Delete existing segments before re-indexing
      await this.vectorDb.deleteFileSegments(filePath);
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
      
      // Chunk segments
      const chunks = chunkTranscriptSegments(parsed.segments);
      console.error(`[DEBUG] Parsed ${parsed.segments.length} segments, created ${chunks.length} chunks`);
      if (chunks.length > 0) {
        console.error(`[DEBUG] First chunk preview: ${chunks[0].text.substring(0, 100)}...`);
        console.error(`[DEBUG] First chunk word count: ${chunks[0].text.split(/\s+/).length}`);
      }
      
      // Generate embeddings for chunks
      const chunkTexts = chunks.map(chunk => chunk.text);
      console.error(`[DEBUG] Generating embeddings for ${chunkTexts.length} chunks...`);
      const embeddings = await this.embeddingService.generateEmbeddings(chunkTexts);
      
      // Create indexed segments
      console.error(`[DEBUG] Created ${embeddings.length} embeddings, preparing to store in ChromaDB...`);
      const indexedSegments: IndexedSegment[] = chunks.map((chunk, index) => {
        const segmentId = this.generateSegmentId(filePath, chunk.startTime, chunk.endTime);
        
        // DEBUG: Check embedding normalization
        const embedding = embeddings[index];
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (index === 0) {
          console.error(`[DEBUG] First embedding norm: ${norm.toFixed(4)} (should be ~1.0)`);
        }
        
        return {
          id: segmentId,
          text: chunk.text,
          embedding: embedding,
          metadata: {
            filePath: metadata.filePath,
            fileName: metadata.fileName,
            clientName: metadata.clientName,
            callDate: metadata.callDate?.toISOString(),
            participants: metadata.participants?.join(', '),
            callType: metadata.callType,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            speaker: chunk.segments[0]?.speaker,
          },
        };
      });
      
      // Store in vector database
      await this.vectorDb.addSegments(indexedSegments);
      
      console.error(`Successfully indexed ${indexedSegments.length} segments from ${filePath}`);
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
  
  /**
   * Generate a unique segment ID
   */
  private generateSegmentId(filePath: string, startTime: number, endTime: number): string {
    const hash = createHash('md5')
      .update(`${filePath}:${startTime}:${endTime}`)
      .digest('hex');
    return hash.substring(0, 16);
  }
}
