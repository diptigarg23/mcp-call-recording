# Environment Variables Setup

Create a `.env` file in the project root with the following content:

```env
# Embedding model to use (optional, defaults to Xenova/all-MiniLM-L6-v2)
# Options: Xenova/all-MiniLM-L6-v2, Xenova/all-mpnet-base-v2, etc.
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2

# Directory containing VTT transcript files
VTT_DIRECTORY=/path/to/vtt/transcript/files

# Path to Chroma database storage (optional, defaults to ./chroma_db if not specified)
CHROMA_DB_PATH=./chroma_db
```

Replace the placeholder values with your actual configuration.

**Note**: The embedding service now uses open-source models from Hugging Face (via @xenova/transformers). No API key is required! Models are downloaded and run locally on first use.
