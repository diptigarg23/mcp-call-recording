#!/bin/bash
# Start ChromaDB server

CHROMA_DB_PATH=${CHROMA_DB_PATH:-./chroma_db}
CHROMA_PORT=${CHROMA_PORT:-8000}

# Create directory if it doesn't exist
mkdir -p "$CHROMA_DB_PATH"

echo "Starting ChromaDB server on http://localhost:$CHROMA_PORT"
echo "Database path: $(cd "$CHROMA_DB_PATH" && pwd)"
echo "Press Ctrl+C to stop the server"
echo ""

# Set environment variables
export IS_PERSISTENT=TRUE
export PERSIST_DIRECTORY="$(cd "$CHROMA_DB_PATH" && pwd)"
export ANONYMIZED_TELEMETRY=FALSE

# Try to start ChromaDB server
python3 -m uvicorn chromadb.app:app --host 0.0.0.0 --port "$CHROMA_PORT" --log-level info
