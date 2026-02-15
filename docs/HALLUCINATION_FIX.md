# Fix: Ollama Hallucination of Company Names

## Issue
Ollama (phi3) was fabricating/hallucinating company names that didn't exist in transcripts. For example, for a transcript with only participant roles like "Emma Williams (CMO)", it was inventing companies like "Acme Corp", "Bright Solutions Inc.", etc.

## Root Cause Analysis (Evidence-Based)
Using debug instrumentation, we confirmed:

1. **Ambiguous prompt instructions**: The original prompt said "COMPANY/COMPANIES: [Companies where the call participants work - NOT just companies mentioned]" but didn't provide a clear "escape hatch" when company information wasn't in the transcript.

2. **Contradictory guideline**: The prompt included "Include company affiliations in parentheses for clarity" which encouraged the LLM to add companies even when they don't exist.

3. **Missing anti-hallucination instruction**: No explicit instruction to avoid fabricating information.

### Debug Evidence
**Before Fix** (Log timestamp: 1771195705900):
```
PARTICIPANTS: Emma Williams (CMO, Acme Corp), Carlos Mendez (Demand Generation Manager, Bright Solutions Inc.), ...
COMPANY/COMPANIES: [Acme Corp], [Bright Solutions Inc.], [WriteWell Media LLC], [HealthInnovate Ltd.]
```
❌ All fabricated - transcript only had roles like "Emma Williams (CMO)"

**After Fix** (Log timestamp: 1771195833635):
```
PARTICIPANTS: Emma Williams (CMO), Carlos Mendez (Demand Gen), Olivia Chen (Content Marketing), ...
Company/Companies: Unknown, since no specific company name was mentioned in the transcript where participants work.
```
✅ Correctly identifies missing information without fabrication

## Solution
Updated the summary generation prompt in `src/services/summaryService.ts` with:

### Key Changes:
1. **Added explicit anti-hallucination instruction at the top**:
   ```
   CRITICAL INSTRUCTION: ONLY extract information that is EXPLICITLY stated in the transcript. 
   DO NOT invent, assume, or fabricate ANY information. If information is not mentioned, 
   write "Unknown" or leave blank as specified.
   ```

2. **Removed contradictory guideline**: Deleted "Include company affiliations in parentheses for clarity"

3. **Clarified COMPANY/COMPANIES field**:
   - Old: `[Companies where the call participants work - NOT just companies mentioned]`
   - New: `[Only list companies explicitly mentioned as where participants work. If not stated, write "Unknown"]`

4. **Updated participant format**:
   - Old: `[Name (Role/Company), Name (Role/Company), ...]`
   - New: `[Name (Role), Name (Role), ...] - Extract names and roles exactly as stated`

5. **Added explicit guideline**:
   ```
   For COMPANY/COMPANIES: ONLY include if the transcript explicitly states where someone works 
   (e.g., "John from Acme Corp"). If roles are mentioned without companies, write "Unknown"
   ```

## Results
✅ Files with structured format now correctly output "Unknown" for company names instead of hallucinating
✅ Participants are listed with only their roles (as stated in transcript)
✅ No fabricated company names in any verified summaries

## Known Limitation
Some transcripts (BankOfAmerica, Delta, Meridian) generate narrative summaries without structured fields. This is a separate formatting consistency issue unrelated to hallucination. The LLM occasionally ignores format instructions for longer or more complex transcripts.

## Files Modified
- `src/services/summaryService.ts` - Updated prompt template (lines 27-63)

## Testing
Verified across all 6 transcript files after re-indexing. Files that include COMPANY/COMPANIES field now correctly show "Unknown" instead of fabricated names.
