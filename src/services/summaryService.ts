import { ParsedTranscript } from '../types/transcript.js';
import { createHash } from 'crypto';
import OpenAI from 'openai';

export class SummaryService {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  /**
   * Generate a structured summary from a parsed transcript using OpenAI
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
PARTICIPANTS: [List ALL participants who spoke in the call: Name (Role), Name (Role), ...] - Include every person who spoke, extract names and roles exactly as stated
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
- IMPORTANT: Follow the structured format above EXACTLY, even for long transcripts
- PARTICIPANTS: List EVERY person who spoke in the call - do not omit anyone
- Use full names consistently (e.g., "Brian Hopkins" not "Brian" or "Hopkins")
- Extract roles exactly as mentioned in the transcript (e.g., "CMO", "VP of Engineering")
- For COMPANY/COMPANIES: ONLY include if the transcript explicitly states where someone works (e.g., "John from Acme Corp"). If roles are mentioned without companies, write "Unknown"
- Be specific about technical topics (don't just say "API discussion", say "OAuth 2.0 authentication implementation")
- Preserve important details like timelines, numbers, specific product names
- DO NOT make up or infer information that is not explicitly in the transcript

Transcript:
${fullTranscriptText}`;

      console.error(`[SummaryService] Generating summary using OpenAI (gpt-4-turbo) for transcript with ${transcript.segments.length} segments...`);
      
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing call transcripts and creating structured summaries. Follow instructions precisely and never fabricate information."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });
      
      const summaryText = completion.choices[0]?.message?.content?.trim() || '';
      
      if (!summaryText) {
        throw new Error('OpenAI API returned empty summary');
      }
      
      console.error(`[SummaryService] Successfully generated summary (${summaryText.length} characters)`);
      console.error(`[SummaryService] Tokens used: ${completion.usage?.total_tokens || 'unknown'}`);
      
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
