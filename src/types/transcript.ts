export interface TranscriptSegment {
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  speaker?: string;
}

export interface TranscriptMetadata {
  filePath: string;
  fileName: string;
  clientName?: string;
  callDate?: Date;
  participants?: string[];
  callType?: string;
}

export interface ParsedTranscript {
  segments: TranscriptSegment[];
  metadata: TranscriptMetadata;
}

export interface IndexedSegment {
  id: string;
  text: string;
  embedding?: number[];
  metadata: {
    filePath: string;
    fileName: string;
    clientName?: string;
    callDate?: string;
    participants?: string;
    callType?: string;
    startTime: number;
    endTime: number;
    speaker?: string;
  };
}
