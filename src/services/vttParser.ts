import { readFileSync } from 'fs';
import { TranscriptSegment, TranscriptMetadata, ParsedTranscript } from '../types/transcript.js';
import path from 'path';

export class VTTParser {
  /**
   * Parse a VTT file and extract transcript segments with timestamps
   */
  parseVTTFile(filePath: string): ParsedTranscript {
    const content = readFileSync(filePath, 'utf-8');
    const segments: TranscriptSegment[] = [];
    
    // Split by double newlines to get cue blocks
    const blocks = content.split(/\n\s*\n/).filter(block => block.trim());
    
    for (const block of blocks) {
      // Skip WEBVTT header and metadata blocks
      if (block.startsWith('WEBVTT') || block.startsWith('NOTE') || !block.includes('-->')) {
        continue;
      }
      
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      // Find the line with timestamp (contains -->)
      let timestampLine = '';
      let textLines: string[] = [];
      
      for (const line of lines) {
        if (line.includes('-->')) {
          timestampLine = line;
        } else if (timestampLine) {
          textLines.push(line);
        }
      }
      
      if (!timestampLine || textLines.length === 0) {
        continue;
      }
      
      // Parse timestamp
      const timeMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
      if (!timeMatch) {
        continue;
      }
      
      const startTime = this.parseVTTTime(timeMatch[1]);
      const endTime = this.parseVTTTime(timeMatch[2]);
      
      // Extract speaker if present (format: <v Speaker Name>text</v> or Speaker: text)
      let speaker: string | undefined;
      let text = textLines.join(' ');
      
      // Check for <v Speaker> format
      const speakerMatch = text.match(/<v\s+([^>]+)>/);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
        text = text.replace(/<v[^>]+>/g, '').replace(/<\/v>/g, '').trim();
      }
      
      // Check for "Speaker: text" format
      const colonMatch = text.match(/^([^:]+):\s*(.+)$/);
      if (colonMatch && !speaker) {
        speaker = colonMatch[1].trim();
        text = colonMatch[2].trim();
      }
      
      if (text) {
        segments.push({
          text,
          startTime,
          endTime,
          speaker: speaker || undefined,
        });
      }
    }
    
    const metadata: TranscriptMetadata = {
      filePath,
      fileName: path.basename(filePath),
    };
    
    return {
      segments,
      metadata,
    };
  }
  
  /**
   * Parse VTT time format (HH:MM:SS.mmm) to seconds
   */
  private parseVTTTime(timeStr: string): number {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }
}
