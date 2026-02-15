# Participant Detection Fix - Status

## Issue
For the Meridian Sales Pitch call (860 lines, 286 segments, 5 participants), only 2 participants were being detected by Ollama:
- ❌ Original: Jennifer Martinez, Michael Stevens (missing 3 people)
- ✅ Target: Jennifer Martinez, Michael Stevens, Rachel Kim, David Porter, Tom Chen

## Root Cause (Evidence-Based)

Debug logs revealed:
1. **Transcript parsing works perfectly**: All 5 speakers correctly identified in parsed data
2. **Input too large**: 22,917 character transcript + prompt = 24KB total
3. **Token limit too restrictive**: Original 2000 tokens insufficient for long transcripts
4. **No explicit "ALL participants" instruction**: Prompt didn't emphasize listing every speaker
5. **Structured format abandoned**: For very long inputs, phi3 falls back to narrative summaries

## Fixes Applied

### Fix 1: Increased Token Limit
- Changed `num_predict` from 2000 → 4000 tokens
- **Result**: Summary length increased from 851 → 13,092 characters ✅

### Fix 2: Explicit "ALL" Instruction  
- Changed PARTICIPANTS field instruction from:
  ```
  PARTICIPANTS: [Name (Role), Name (Role), ...]
  ```
- To:
  ```
  PARTICIPANTS: [List ALL participants who spoke in the call: Name (Role), Name (Role), ...]
  ```
- Added guideline: "PARTICIPANTS: List EVERY person who spoke in the call - do not omit anyone"
- **Result**: All 5 participants now mentioned in summary ✅

### Fix 3: Format Emphasis
- Added guideline: "IMPORTANT: Follow the structured format above EXACTLY, even for long transcripts"
- **Result**: Partial success - still generates narrative for very long transcripts ⚠️

## Current Status

### ✅ **SUCCESS**: All Participants Captured
Verified in ChromaDB summary:
- ✓ Jennifer Martinez - FOUND
- ✓ Michael Stevens - FOUND  
- ✓ Rachel Kim - FOUND
- ✓ David Porter - FOUND
- ✓ Tom Chen - FOUND

### ⚠️ **PARTIAL**: Structured Format Inconsistent
- Short transcripts (< 2KB): Perfect structured format
- Medium transcripts (2-10KB): Good structured format  
- Long transcripts (> 20KB): Falls back to narrative format

The narrative format still includes all relevant information (participants, topics, decisions) but not in the exact CALL TYPE / PARTICIPANTS / SUMMARY structure.

## Impact on User Experience

When querying "ok what about the Sales Pitch call" in Claude Desktop:
- **Before**: Only showed 2 participants (Jennifer Martinez, Michael Stevens)
- **After**: Shows all 5 participants in the narrative context

The information IS available for semantic search, just not in a perfectly structured format.

## Recommendations

### Option A: Accept Current State (Recommended)
- All participants ARE captured and searchable
- Semantic search works correctly
- Trade-off: Long transcripts use narrative vs structured format
- **Pros**: Works now, no additional changes needed
- **Cons**: Inconsistent formatting across transcript lengths

### Option B: Switch to More Powerful Model
- Try `llama3` or `llama3:70b` instead of `phi3`
- Larger models handle long contexts better
- **Pros**: Better format consistency
- **Cons**: Slower, requires more RAM

### Option C: Implement Transcript Summarization
- For very long transcripts, first summarize into manageable chunks
- Then generate structured summary from condensed version
- **Pros**: More consistent formatting
- **Cons**: Additional complexity, potential information loss

## Files Modified
- `src/services/summaryService.ts`:
  - Increased `num_predict` from 2000 to 4000 (line 92)
  - Updated PARTICIPANTS instruction to emphasize "ALL" (line 44)
  - Added explicit guidelines for comprehensive participant listing (line 63-64)

## Testing
- Verified with Meridian_2025-11-22_Sales_Pitch.vtt (860 lines, 286 segments, 5 speakers)
- All 5 participants now captured in summary
- Re-indexing all files recommended to apply fixes consistently
