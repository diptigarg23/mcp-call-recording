import { ParsedTranscript, TranscriptSummary } from '../types/transcript.js';
import { createHash } from 'crypto';

export class SummaryService {
  private ollamaBaseUrl: string;
  private model: string;
  
  constructor(ollamaBaseUrl: string = 'http://localhost:11434', model: string = 'phi3') {
    this.ollamaBaseUrl = ollamaBaseUrl;
    this.model = model;
  }
  
  /**
   * Generate a structured summary from a parsed transcript using Ollama
   */
  async generateSummary(transcript: ParsedTranscript): Promise<string> {
    try {
      // Concatenate all transcript segments into full text
      const fullTranscriptText = transcript.segments
        .map(segment => {
          const speaker = segment.speaker ? `${segment.speaker}: ` : '';
          return `${speaker}${segment.text}`;
        })
        .join('\n\n');
      
      // Build the prompt with the exact format specified
      const prompt = `Analyze this call transcript and create a structured summary.

CRITICAL INSTRUCTION: ONLY extract information that is EXPLICITLY stated in the transcript. DO NOT invent, assume, or fabricate ANY information. If information is not mentioned, write "Unknown" or leave blank as specified.

Format your response EXACTLY as follows:

CALL TYPE: [guidance session/demo/onboarding/sales call/technical review/etc]
PARTICIPANTS: [Name (Role), Name (Role), ...] - Extract names and roles exactly as stated
COMPANY/COMPANIES: [Only list companies explicitly mentioned as where participants work. If not stated, write "Unknown"]
DATE: [Extract if mentioned in transcript, otherwise write "Unknown"]
DURATION: [Extract if mentioned, otherwise write "Unknown"]

SUMMARY:
[2-3 well-organized paragraphs covering the main discussion points. Organize by topic/theme, not chronologically. Include specific technical details, decisions made, and context.]

KEY TOPICS:
- [Topic 1 with brief context]
- [Topic 2 with brief context]
- [Topic 3 with brief context]

ACTION ITEMS:
- [Action item 1]
- [Action item 2]

DECISIONS MADE:
- [Decision 1]
- [Decision 2]

Guidelines:
- Use full names consistently (e.g., "Brian Hopkins" not "Brian" or "Hopkins")
- Extract roles exactly as mentioned in the transcript (e.g., "CMO", "VP of Engineering")
- For COMPANY/COMPANIES: ONLY include if the transcript explicitly states where someone works (e.g., "John from Acme Corp"). If roles are mentioned without companies, write "Unknown"
- Be specific about technical topics (don't just say "API discussion", say "OAuth 2.0 authentication implementation")
- Preserve important details like timelines, numbers, specific product names
- DO NOT make up or infer information that is not explicitly in the transcript

Transcript:
${fullTranscriptText}`;

      console.error(`[SummaryService] Generating summary using Ollama (${this.model}) for transcript with ${transcript.segments.length} segments...`);
      
      // Call Ollama API
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more consistent output
            num_predict: 2000, // Max tokens to generate
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as { response?: string };
      const summaryText = data.response?.trim() || '';
      
      if (!summaryText) {
        throw new Error('Ollama API returned empty summary');
      }
      
      console.error(`[SummaryService] Successfully generated summary (${summaryText.length} characters)`);
      
      return summaryText;
    } catch (error) {
      console.error('[SummaryService] Error generating summary:', error);
      throw error;
    }
  }
  
  /**
   * Generate a unique ID for a transcript summary
   */
  generateSummaryId(filePath: string): string {
    const hash = createHash('md5')
      .update(`summary:${filePath}`)
      .digest('hex');
    return `summary_${hash.substring(0, 16)}`;
  }
}
