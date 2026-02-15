# Environment Variables Setup

This project requires the following environment variables to be set in a `.env` file in the project root.

## Required Variables

### VTT_DIRECTORY
Path to the directory containing your VTT transcript files.

Example:
```
VTT_DIRECTORY=/Users/yourusername/transcripts
```

### CHROMA_DB_PATH
Path where ChromaDB will store its data. This should be a local directory path.

Example:
```
CHROMA_DB_PATH=./chroma_db
```

## Optional Variables

### OLLAMA_BASE_URL
URL where Ollama is running. Defaults to `http://localhost:11434`.

Example:
```
OLLAMA_BASE_URL=http://localhost:11434
```

### OLLAMA_MODEL
The Ollama model to use for generating summaries. Defaults to `phi3`.

Available models (after pulling with `ollama pull <model>`):
- `phi3` - Small (3.8B), fast, excellent for structured tasks (recommended)
- `llama3` - Larger (8B), higher quality summaries
- `mistral` - Fast (7B), good balance

Example:
```
OLLAMA_MODEL=phi3
```

### EMBEDDING_MODEL
The embedding model to use. Defaults to `Xenova/all-MiniLM-L6-v2` (open-source, runs locally).

Example:
```
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

## Complete Example

```env
VTT_DIRECTORY=/Users/yourusername/transcripts
CHROMA_DB_PATH=./chroma_db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

## Notes

- **Ollama**: Used for generating structured summaries (completely local, no API costs)
- **Embeddings**: Generated locally using open-source models via `@xenova/transformers` (no API calls)
- **ChromaDB**: Runs as a local server on port 8000 (see CHROMADB_SETUP.md for setup)
- **No API Keys Required**: Everything runs locally!