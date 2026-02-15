# Re-indexing Scripts Fix

## Issue
The `reindex-all.ts` and `reindex-file.ts` scripts were failing with the error:
```
TypeError: Cannot read properties of undefined (reading 'deleteSummary')
```

## Root Cause
After migrating to transcript-level structured summaries using Ollama, the `Indexer` constructor was updated to require 3 parameters:
1. `embeddingService: EmbeddingService`
2. `summaryService: SummaryService` ← **Missing**
3. `vectorDb: VectorDatabase`

However, the re-indexing scripts were still using the old 2-parameter initialization, causing `summaryService` to be `undefined`.

## Fix Applied
Updated both scripts to:
1. Import `SummaryService`
2. Read Ollama configuration from environment (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`)
3. Initialize `SummaryService` before creating `Indexer`
4. Pass all 3 services to `Indexer` constructor

### Files Modified
- `reindex-all.ts` - Re-index all VTT files in directory
- `reindex-file.ts` - Re-index a single VTT file

## Verification
After the fix, re-indexing successfully:
- ✅ Generated structured summaries using Ollama (phi3)
- ✅ Created embeddings for each summary (384 dimensions)
- ✅ Stored summaries in ChromaDB `transcript_summaries` collection
- ✅ Processed all 6 VTT files without errors

## Usage

### Re-index All Files
```bash
npm run reindex-all
```

### Re-index Single File
```bash
npm run reindex vtt_files/CapitalOne_2026-01-15_Sales.vtt
```

## Environment Requirements
Ensure `.env` contains:
```bash
VTT_DIRECTORY=/path/to/vtt_files
CHROMA_DB_PATH=./chroma_db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
```

## Prerequisites
1. ChromaDB server running: `./start_chroma.sh`
2. Ollama running with model: `ollama run phi3`
