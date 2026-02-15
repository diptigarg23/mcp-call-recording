# MCP Call Recording Server

An MCP (Model Context Protocol) server that provides semantic search over VTT transcript files. This server enables business stakeholders to query client call transcripts using natural language through Claude Desktop and Microsoft Copilot 365 Studio.

## Features

- **Automatic Indexing**: Monitors a directory for VTT transcript files and automatically indexes them in the background
- **Semantic Search**: Uses open-source embeddings (Hugging Face models via `@xenova/transformers`) and Chroma vector database for semantic search over transcripts
- **No API Keys Required**: All embeddings are generated locally using open-source models
- **Natural Language Queries**: Ask questions like "identify the top risk identified in last client call with Bank of America with Sales"
- **Metadata Extraction**: Automatically extracts client names, call dates, and participants from filenames and VTT content
- **Single Tool Interface**: Simple `query_transcripts` tool that handles all queries (pure semantic search; metadata is used for display, not filtering)

## Architecture

The server uses:

- **Chroma**: Vector database; the Node.js client connects to a **ChromaDB server** running at `http://localhost:8000`. Persisted data is stored in a directory you configure when starting the Chroma server (see [CHROMADB_SETUP.md](CHROMADB_SETUP.md)).
- **@xenova/transformers**: Open-source embeddings using Hugging Face models (runs locally, no API needed)
- **File Watcher (chokidar)**: Automatically detects and indexes new, changed, or deleted VTT files
- **MCP Protocol**: Standard protocol for AI assistant integration (stdio transport)

## Prerequisites

- Node.js 18+
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

4. Create a `.env` file in the project root with at least:

   ```env
   EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
   VTT_DIRECTORY=/path/to/vtt/transcript/files
   CHROMA_DB_PATH=./chroma_db
   ```

   **Note**: No API key is needed. The embedding service uses open-source models that run locally. `CHROMA_DB_PATH` is the path used when **starting the Chroma server** (where it stores data); the MCP client always connects to `http://localhost:8000`.

5. Start the ChromaDB server (in a separate terminal) before running the MCP server—see [CHROMADB_SETUP.md](CHROMADB_SETUP.md).

## Configuration

### Environment Variables

The MCP server reads configuration from environment variables (e.g. from a `.env` file in the project root):

| Variable           | Required | Description                                                                 |
|--------------------|----------|-----------------------------------------------------------------------------|
| `VTT_DIRECTORY`    | Yes      | Path to the directory containing VTT transcript files                      |
| `EMBEDDING_MODEL`  | No       | Hugging Face model for embeddings. Default: `Xenova/all-MiniLM-L6-v2`. For better quality (slower): `Xenova/all-mpnet-base-v2` |
| `CHROMA_DB_PATH`   | No       | Path for Chroma server data when you start Chroma (e.g. `./chroma_db`). The MCP client connects to `http://localhost:8000`. |

Embeddings are generated locally; no API key is required.

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

For reference, `config/copilot-studio.json` illustrates a possible structure (name, description, transport type, environment variables). Set `VTT_DIRECTORY` and `CHROMA_DB_PATH` in your deployment environment; no `OPENAI_API_KEY` is needed for embeddings.

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
4. Chunks segments by size (default: up to ~750 words per chunk, ~50 words overlap) for embedding
5. Generates embeddings locally and stores them with metadata in Chroma
6. Uses the same pipeline when the file watcher detects new or changed files

### File Watching

The server watches the VTT directory with chokidar:

- **New files**: Indexed automatically
- **Changed files**: Re-indexed (existing segments for that file are removed first)
- **Deleted files**: Segments for that file are removed from the database

### Query Processing

For each query:

1. The question is embedded with the same model used for indexing
2. Chroma returns the closest segments by embedding similarity (cosine distance → converted to a 0–1 score)
3. Results are filtered by `minScore`, sorted by score, and formatted with segment text and metadata

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

Both scripts use your `.env` (e.g. `VTT_DIRECTORY`, `CHROMA_DB_PATH`, `EMBEDDING_MODEL`). The Chroma server must be running.

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
│   │   ├── embeddingService.ts  # Local embeddings (@xenova/transformers)
│   │   ├── vectorDb.ts          # Chroma client (connects to http://localhost:8000)
│   │   ├── metadataExtractor.ts # Metadata from filename and VTT content
│   │   ├── indexer.ts           # Index one file or directory into Chroma
│   │   └── fileWatcher.ts       # chokidar-based file watcher
│   ├── types/
│   │   └── transcript.ts        # TypeScript interfaces
│   └── utils/
│       └── chunking.ts          # Chunk segments by word count (e.g. 750 words, 50 overlap)
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

### Server won’t start

- Ensure all required environment variables are set in `.env` (especially `VTT_DIRECTORY`).
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
- First run downloads the embedding model; ensure network and disk space are available.

### Embedding model

- Default: `Xenova/all-MiniLM-L6-v2` (fast, smaller). For higher quality (slower): set `EMBEDDING_MODEL=Xenova/all-mpnet-base-v2` in `.env`.
- Models are downloaded and cached locally on first use.

## Security Considerations

- Embeddings run locally; no embedding API keys are required.
- Validate and constrain file paths to avoid directory traversal.
- Sanitize or limit user query input as needed.
- Consider rate limiting and access control for production or HTTP deployment.

## License

MIT
