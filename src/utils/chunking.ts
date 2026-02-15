import { TranscriptSegment } from '../types/transcript.js';

export interface Chunk {
  text: string;
  startTime: number;
  endTime: number;
  segments: TranscriptSegment[];
}

/**
 * Chunk transcript segments into appropriate sizes for embedding
 * Target: 500-1000 tokens per chunk (approximately 375-750 words)
 */
export function chunkTranscriptSegments(
  segments: TranscriptSegment[],
  maxChunkSize: number = 750, // words
  overlap: number = 50 // words overlap between chunks
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: TranscriptSegment[] = [];
  let currentWordCount = 0;
  
  for (const segment of segments) {
    const segmentWords = segment.text.split(/\s+/).length;
    
    // If adding this segment would exceed the limit, finalize current chunk
    if (currentWordCount + segmentWords > maxChunkSize && currentChunk.length > 0) {
      chunks.push(createChunk(currentChunk));
      
      // Start new chunk with overlap (keep last few segments)
      const overlapWords = overlap;
      let overlapCount = 0;
      const newChunk: TranscriptSegment[] = [];
      
      // Add segments from the end of previous chunk for overlap
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const segWords = currentChunk[i].text.split(/\s+/).length;
        if (overlapCount + segWords <= overlapWords) {
          newChunk.unshift(currentChunk[i]);
          overlapCount += segWords;
        } else {
          break;
        }
      }
      
      currentChunk = newChunk;
      currentWordCount = overlapCount;
    }
    
    currentChunk.push(segment);
    currentWordCount += segmentWords;
  }
  
  // Add final chunk if there are remaining segments
  if (currentChunk.length > 0) {
    chunks.push(createChunk(currentChunk));
  }
  
  return chunks;
}

function createChunk(segments: TranscriptSegment[]): Chunk {
  const text = segments.map(s => s.text).join(' ');
  const startTime = segments[0].startTime;
  const endTime = segments[segments.length - 1].endTime;
  
  return {
    text,
    startTime,
    endTime,
    segments: [...segments],
  };
}
