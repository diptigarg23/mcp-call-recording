# Quick Start Guide

Get the MCP Call Recording Server running in 5 steps!

## 1. Install Ollama

### macOS
```bash
brew install ollama
```

### Windows
Download from https://ollama.com/download and run the installer.

## 2. Pull the Phi-3 Model

```bash
ollama pull phi3
```

This downloads a 2.3GB model that runs locally for generating summaries.

## 3. Start ChromaDB

```bash
./start_chroma.sh
```

Or on Windows:
```cmd
start_chroma.bat
```

## 4. Configure Environment

Create a `.env` file in the project root:

```env
VTT_DIRECTORY=/path/to/your/vtt_files
CHROMA_DB_PATH=./chroma_db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
```

## 5. Build and Start

```bash
npm install
npm run build
npm start
```

## Test in Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

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

Restart Claude Desktop and ask:
- "Summarize the Capital One call"
- "What were the action items from the Bank of America sales call?"
- "Who participated in the Acme call?"

## System Requirements

### Minimum (for phi3):
- **CPU**: 4 cores
- **RAM**: 4GB free
- **Disk**: 5GB (Node modules + models)

### Recommended:
- **CPU**: 8 cores
- **RAM**: 8GB free
- **GPU**: Optional (speeds up summary generation)

## Troubleshooting

### "Ollama is not running"
```bash
ollama serve
```

### "ChromaDB connection error"
Make sure ChromaDB is running:
```bash
./start_chroma.sh
```

### "Model not found"
Pull the model:
```bash
ollama pull phi3
```

## What's Happening?

1. **Indexing**: When you add a VTT file to your directory:
   - MCP server detects it
   - Sends full transcript to Ollama (local)
   - Ollama generates structured summary
   - Summary is embedded using local model
   - Stored in ChromaDB

2. **Querying**: When you ask a question in Claude:
   - Question is embedded using local model
   - Semantic search finds relevant summaries
   - Formatted summary is returned

**Everything runs locally - no cloud services, no API costs!**

## Next Steps

- See [docs/OLLAMA_SETUP.md](docs/OLLAMA_SETUP.md) for model options and tuning
- See [CHROMADB_SETUP.md](CHROMADB_SETUP.md) for ChromaDB details
- See [ENV_SETUP.md](ENV_SETUP.md) for all configuration options
