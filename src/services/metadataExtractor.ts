import { statSync } from 'fs';
import path from 'path';
import { TranscriptMetadata } from '../types/transcript.js';

export class MetadataExtractor {
  /**
   * Extract metadata from VTT file path and file system
   */
  extractMetadata(filePath: string, vttContent?: string): Partial<TranscriptMetadata> {
    const fileName = path.basename(filePath, '.vtt');
    const metadata: Partial<TranscriptMetadata> = {
      filePath,
      fileName: path.basename(filePath),
    };
    
    // Try to extract from filename pattern: {ClientName}_{Date}_{Type}.vtt
    const filenameMetadata = this.parseFilename(fileName);
    if (filenameMetadata.clientName) {
      metadata.clientName = filenameMetadata.clientName;
    }
    if (filenameMetadata.callDate) {
      metadata.callDate = filenameMetadata.callDate;
    }
    if (filenameMetadata.callType) {
      metadata.callType = filenameMetadata.callType;
    }
    
    // Try to extract from VTT content headers if provided
    if (vttContent) {
      const contentMetadata = this.parseVTTHeaders(vttContent);
      if (contentMetadata.clientName && !metadata.clientName) {
        metadata.clientName = contentMetadata.clientName;
      }
      if (contentMetadata.callDate && !metadata.callDate) {
        metadata.callDate = contentMetadata.callDate;
      }
      if (contentMetadata.participants && contentMetadata.participants.length > 0) {
        metadata.participants = contentMetadata.participants;
      }
    }
    
    // Fallback to file modification date if no date found
    if (!metadata.callDate) {
      try {
        const stats = statSync(filePath);
        metadata.callDate = stats.mtime;
      } catch (error) {
        // File might not exist yet, ignore
      }
    }
    
    return metadata;
  }
  
  /**
   * Parse filename for patterns like: ClientName_2024-01-15_Sales.vtt
   */
  private parseFilename(fileName: string): {
    clientName?: string;
    callDate?: Date;
    callType?: string;
  } {
    const result: {
      clientName?: string;
      callDate?: Date;
      callType?: string;
    } = {};
    
    // Try various date formats
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
      /(\d{2}-\d{2}-\d{4})/, // MM-DD-YYYY
      /(\d{4}\d{2}\d{2})/,   // YYYYMMDD
    ];
    
    for (const pattern of datePatterns) {
      const match = fileName.match(pattern);
      if (match) {
        const dateStr = match[1];
        const date = this.parseDate(dateStr);
        if (date) {
          result.callDate = date;
          // Split filename around the date
          const parts = fileName.split(match[0]);
          if (parts[0]) {
            result.clientName = parts[0].replace(/[_-]/g, ' ').trim();
          }
          if (parts[1]) {
            result.callType = parts[1].replace(/[_-]/g, ' ').replace('.vtt', '').trim();
          }
          break;
        }
      }
    }
    
    // If no date pattern found, try to extract client name from first part
    if (!result.clientName) {
      const parts = fileName.split(/[_-]/);
      if (parts.length > 0) {
        result.clientName = parts[0].trim();
      }
      if (parts.length > 1) {
        result.callType = parts.slice(1).join(' ').replace('.vtt', '').trim();
      }
    }
    
    return result;
  }
  
  /**
   * Parse date string in various formats
   */
  private parseDate(dateStr: string): Date | undefined {
    // Try YYYY-MM-DD
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try YYYYMMDD
    if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return undefined;
  }
  
  /**
   * Parse VTT headers for metadata
   */
  private parseVTTHeaders(content: string): {
    clientName?: string;
    callDate?: Date;
    participants?: string[];
  } {
    const result: {
      clientName?: string;
      callDate?: Date;
      participants?: string[];
    } = {};
    
    const lines = content.split('\n').slice(0, 20); // Check first 20 lines
    
    for (const line of lines) {
      // Look for NOTE comments with metadata
      if (line.startsWith('NOTE')) {
        const noteContent = line.substring(4).trim().toLowerCase();
        
        // Extract client name
        const clientMatch = noteContent.match(/client[:\s]+([^\n,]+)/i);
        if (clientMatch) {
          result.clientName = clientMatch[1].trim();
        }
        
        // Extract date
        const dateMatch = noteContent.match(/date[:\s]+([^\n,]+)/i);
        if (dateMatch) {
          const parsedDate = this.parseDate(dateMatch[1].trim());
          if (parsedDate) {
            result.callDate = parsedDate;
          }
        }
        
        // Extract participants
        const participantsMatch = noteContent.match(/participants?[:\s]+([^\n]+)/i);
        if (participantsMatch) {
          result.participants = participantsMatch[1]
            .split(/[,;]/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        }
      }
    }
    
    return result;
  }
}
