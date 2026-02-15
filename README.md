# MCP Call Recording Server

An MCP (Model Context Protocol) server that provides semantic search over VTT transcript files using **AI-powered structured summaries**. This server enables business stakeholders to query client call transcripts using natural language through Claude Desktop and Microsoft Copilot 365 Studio.

**Now powered by OpenAI GPT-4-turbo** for best-in-class summary quality and structured extraction.

## Architecture Diagram (generated using Gemini Nano Banana)
<img width="954" height="906" alt="image" src="https://github.com/user-attachments/assets/a2bee971-9b3e-4a22-b1d7-15ce1136b9f8" />

## Data Flow 

This is improved version of data flow after we identified improvements we can make at the embedding levels.
<img width="736" height="427" alt="image" src="https://github.com/user-attachments/assets/abd7d122-c602-4bed-a89f-1b239432525b" />

## Features

- **Automatic Indexing**: Monitors a directory for VTT transcript files and automatically indexes them in the background
- **AI-Powered Summaries**: Uses OpenAI GPT-4-turbo to generate perfect structured summaries with CALL TYPE, PARTICIPANTS, COMPANY/COMPANIES, KEY TOPICS, ACTION ITEMS, and DECISIONS MADE
- **Advanced Embeddings**: OpenAI text-embedding-3-small (1536 dimensions) for superior semantic search quality
- **Natural Language Queries**: Ask questions like "Summarize the Bank of America sales call" or "What were the action items from the Capital One call?"
- **100% Consistent Format**: GPT-4-turbo maintains perfect structure even for long transcripts (860+ lines, 286+ segments)
- **All Participants Captured**: Never miss a meeting attendee - all speakers are identified correctly
- **No Hallucinations**: Correctly shows "Unknown" for missing information instead of fabricating data
- **Single Tool Interface**: Simple `query_transcripts` tool that handles all queries (pure semantic search)

## The server uses:

- **OpenAI GPT-4-turbo**: Best-in-class LLM for generating structured summaries (~$0.01-0.05 per transcript)
- **OpenAI Embeddings**: text-embedding-3-small for 1536-dimensional semantic search (~$0.0001 per transcript)
- **Chroma**: Vector database; the Node.js client connects to a **ChromaDB server** running at `http://localhost:8000`. Persisted data is stored in a directory you configure when starting the Chroma server (see [CHROMADB_SETUP.md](CHROMADB_SETUP.md)).
- **File Watcher (chokidar)**: Automatically detects and indexes new, changed, or deleted VTT files
- **MCP Protocol**: Standard protocol for AI assistant integration (stdio transport)

## Prerequisites

- Node.js 18+
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- $5+ OpenAI credit (covers ~200 transcripts)
- Directory containing VTT transcript files
- **ChromaDB server** running on `http://localhost:8000` (see [CHROMADB_SETUP.md](CHROMADB_SETUP.md))

## Installation

1. Clone or download this repository.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the TypeScript code:

   ```bash
   npm run build
   ```

4. Create a `.env` file in the project root:

   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   VTT_DIRECTORY=/path/to/vtt/transcript/files
   CHROMA_DB_PATH=./chroma_db
   ```

   See [ENV_SETUP.md](ENV_SETUP.md) for detailed environment setup instructions.

5. Start the ChromaDB server (in a separate terminal) before running the MCP server—see [CHROMADB_SETUP.md](CHROMADB_SETUP.md).

## Configuration

### Environment Variables

The MCP server reads configuration from environment variables (e.g. from a `.env` file in the project root):

| Variable           | Required | Description                                                                 |
|--------------------|----------|-----------------------------------------------------------------------------|
| `OPENAI_API_KEY`   | Yes      | Your OpenAI API key for GPT-4-turbo summaries and embeddings               |
| `VTT_DIRECTORY`    | Yes      | Path to the directory containing VTT transcript files                      |
| `CHROMA_DB_PATH`   | No       | Path for Chroma server data (default: `./chroma_db`)                       |

**Cost**: ~$0.02 per transcript on average (varies with length). Your $5 credit covers approximately 200 transcripts.

### Claude Desktop Setup

1. Edit your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

2. Add the MCP server (use the **absolute** path to `dist/index.js`):

   ```json
   {
     "mcpServers": {
       "call-recording": {
         "command": "node",
         "args": ["/absolute/path/to/MCP_Call_Recording/dist/index.js"]
       }
     }
   }
   ```

   Example config is in `config/claude-desktop.json`.

3. Restart Claude Desktop.

4. The server will load `.env`, index existing VTT files in `VTT_DIRECTORY`, and watch for new, changed, or deleted files.

### Microsoft Copilot 365 Studio Setup

The server currently uses **stdio** transport. For Copilot Studio you would need to run it as an HTTP MCP server (e.g. add an HTTP transport in `src/index.ts` or run behind an adapter).

For reference, `config/copilot-studio.json` illustrates a possible structure (name, description, transport type, environment variables). Set `VTT_DIRECTORY`, `CHROMA_DB_PATH`, and `OPENAI_API_KEY` in your deployment environment.

## Usage

Once configured, you can ask Claude Desktop (or Copilot Studio once HTTP is set up) questions about your call transcripts, for example:

- "What were the main risks discussed in the last call with Bank of America?"
- "Identify the top risk identified in last client call with Bank of America with Sales"
- "What decisions were made in calls with Acme Corp this month?"
- "Summarize the key points from the call with TechCorp on January 15th"

The server will:

1. Generate an embedding for your question
2. Run a **semantic search** in the vector database (no metadata filtering)
3. Return a formatted answer with relevant segments, metadata (client, date, speaker), and relevance scores

### Tool: `query_transcripts`

- **`question`** (required): Natural language question about the transcripts.
- **`limit`** (optional, default: 10): Maximum number of results to return.
- **`minScore`** (optional, default: 0.0): Minimum relevance score (0–1). Segments below this are excluded.

## How It Works

### Automatic Indexing

On startup the server:

1. Scans `VTT_DIRECTORY` for existing `.vtt` files
2. Parses each file into segments with timestamps
3. Extracts metadata (client name, date, participants, call type) from filenames and VTT content
4. Generates AI-powered structured summary using OpenAI GPT-4-turbo
5. Creates semantic embedding of the entire summary using OpenAI text-embedding-3-small (1536 dimensions)
6. Stores summary and embedding in ChromaDB for semantic search
7. Uses the same pipeline when the file watcher detects new or changed files

### File Watching

The server watches the VTT directory with chokidar:

- **New files**: Indexed automatically
- **Changed files**: Re-indexed (existing segments for that file are removed first)
- **Deleted files**: Segments for that file are removed from the database

### Query Processing

For each query:

1. The question is embedded using OpenAI text-embedding-3-small (same model used for indexing)
2. Chroma returns the closest transcript summaries by embedding similarity (cosine distance → converted to a 0–1 score)
3. Results are filtered by `minScore`, sorted by score, and formatted with summary text and metadata

## Reindexing

If you need to refresh the index for one file or the whole directory:

- **Single file** (force reindex one VTT file):

  ```bash
  npm run reindex -- path/to/file.vtt
  # or: tsx reindex-file.ts path/to/file.vtt
  ```

- **All files** in `VTT_DIRECTORY` (force reindex everything):

  ```bash
  npm run reindex-all
  # or: tsx reindex-all.ts
  ```

Both scripts use your `.env` (e.g. `VTT_DIRECTORY`, `CHROMA_DB_PATH`, `OPENAI_API_KEY`). The Chroma server must be running.

**Note**: Re-indexing costs OpenAI API credits (~$0.02 per transcript).

## File Structure

```
MCP_Call_Recording/
├── src/
│   ├── index.ts                 # Entry point: init services, index existing files, start file watcher, start MCP server
│   ├── server.ts                # MCP server setup and tool registration (query_transcripts)
│   ├── tools/
│   │   └── query.ts             # query_transcripts tool (embedding + vector search + format answer)
│   ├── services/
│   │   ├── vttParser.ts         # VTT file parsing
│   │   ├── summaryService.ts    # OpenAI GPT-4-turbo for structured summaries
│   │   ├── embeddingService.ts  # OpenAI text-embedding-3-small (1536-dim)
│   │   ├── vectorDb.ts          # Chroma client (connects to http://localhost:8000)
│   │   ├── metadataExtractor.ts # Metadata from filename and VTT content
│   │   ├── indexer.ts           # Index one file or directory into Chroma
│   │   └── fileWatcher.ts       # chokidar-based file watcher
│   ├── types/
│   │   └── transcript.ts        # TypeScript interfaces
│   └── utils/
│       └── chunking.ts          # Legacy chunking utilities (now using full-transcript summaries)
├── config/
│   ├── claude-desktop.json      # Example Claude Desktop MCP config
│   └── copilot-studio.json      # Example structure for Copilot Studio (HTTP not implemented)
├── reindex-file.ts             # Script to reindex a single VTT file
├── reindex-all.ts              # Script to reindex all VTT files in VTT_DIRECTORY
├── check-embeddings.sql        # Optional: SQL for inspecting Chroma SQLite DB (chroma_db)
├── start_chroma.sh             # Helper to start Chroma server (see CHROMADB_SETUP.md)
├── start_chroma.py
├── package.json
├── tsconfig.json
├── CHROMADB_SETUP.md
└── README.md
```

## Development

### Run (production build)

```bash
npm run build
npm start
```

### Development mode (tsx, no build step)

```bash
npm run dev
```

### Watch (rebuild on change)

```bash
npm run watch
```

### Reindex

```bash
npm run reindex -- vtt_files/SomeFile.vtt
npm run reindex-all
```

## VTT File Format

The server expects WebVTT files (`.vtt` extension). Example:

```
WEBVTT

00:00:00.000 --> 00:00:05.000
Hello, this is a transcript segment.

00:00:05.000 --> 00:00:10.000
<v Speaker Name>This segment has a speaker identifier.</v>
```

### Metadata Extraction

Metadata is derived from:

1. **Filename pattern**: `{ClientName}_{Date}_{Type}.vtt`  
   Example: `BankOfAmerica_2026-01-15_Sales.vtt`
2. **VTT headers**: NOTE comments or other header metadata
3. **File modification time**: Fallback when no date is found in filename or content

## Troubleshooting

### Server won't start

- Ensure all required environment variables are set in `.env` (especially `OPENAI_API_KEY` and `VTT_DIRECTORY`).
- Verify your OpenAI API key is valid and has credits.
- Ensure the **ChromaDB server** is running at `http://localhost:8000` (see [CHROMADB_SETUP.md](CHROMADB_SETUP.md)).
- In Claude Desktop config, use the **absolute** path to `dist/index.js`.
- Check stderr/logs for errors.

### Files not being indexed

- Confirm `VTT_DIRECTORY` points to the correct directory and files have `.vtt` extension.
- Check file permissions and stderr for indexing errors.
- For a single file, try: `npm run reindex -- path/to/file.vtt`.

### Poor or empty search results

- Ensure transcripts are valid VTT and were indexed (watch startup logs or use reindex scripts).
- Lower `minScore` (e.g. 0.0) to see more results; the tool default is 0.0.
- Check OpenAI API usage to confirm embeddings are being generated.

### OpenAI API Issues

- **Rate limits**: OpenAI has rate limits. If indexing many files, they're processed sequentially.
- **Cost monitoring**: Check your usage at https://platform.openai.com/usage
- **Budget alerts**: Set limits at https://platform.openai.com/settings/organization/billing/limits

## Security Considerations

- **API Key Security**: Keep your OpenAI API key secure. Never commit `.env` files to version control.
- **Cost Control**: Set usage limits in your OpenAI account to prevent unexpected charges.
- **Data Privacy**: Transcripts are sent to OpenAI for processing. Ensure compliance with your data policies.
- Validate and constrain file paths to avoid directory traversal.
- Sanitize or limit user query input as needed.
- Consider rate limiting and access control for production or HTTP deployment.

## Migration from Ollama

If you're upgrading from the previous Ollama-based version, see [docs/OPENAI_MIGRATION.md](docs/OPENAI_MIGRATION.md) for complete migration instructions.

## License

MIT
