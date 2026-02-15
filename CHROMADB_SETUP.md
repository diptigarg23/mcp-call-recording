# ChromaDB Setup Instructions

ChromaDB requires a running server for the Node.js client to connect to. Follow these steps:

## Option 1: Install and Run ChromaDB Server (Recommended)

1. **Install ChromaDB** (requires Python):
   ```bash
   # On macOS, use pip3 instead of pip
   pip3 install chromadb
   
   # Or use python3 -m pip
   python3 -m pip install chromadb
   ```

2. **Start ChromaDB Server** using the provided script:
   ```bash
   # Option 1: Use the shell script (recommended)
   ./start_chroma.sh
   
   # Option 2: Use the Python script
   python3 start_chroma.py
   
   # Option 3: Run directly with uvicorn
   export IS_PERSISTENT=TRUE
   export PERSIST_DIRECTORY="$(pwd)/chroma_db"
   python3 -m uvicorn chromadb.app:app --host 0.0.0.0 --port 8000
   ```
   
   This will:
   - Start ChromaDB server on `http://localhost:8000`
   - Store data in the `./chroma_db` directory (or path from CHROMA_DB_PATH env var)
   - Keep running until you stop it (Ctrl+C)

3. **Keep the server running** in a separate terminal window while you run your MCP server.

## Option 2: Run ChromaDB Server in Background

You can run ChromaDB server in the background:

```bash
# macOS/Linux
chroma run --path ./chroma_db --port 8000 &

# Or use nohup to keep it running after terminal closes
nohup chroma run --path ./chroma_db --port 8000 > chroma.log 2>&1 &
```

## Verify ChromaDB is Running

Check if ChromaDB is accessible:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

You should see a response like: `{"nanosecond heartbeat": ...}`

## Troubleshooting

- **Port 8000 already in use**: Change the port in the chroma command and update the client connection
- **Python not found**: Install Python 3.8+ first
- **ChromaDB not found**: Make sure `pip install chromadb` completed successfully

## Alternative: Use Docker (if you have Docker installed)

```bash
docker run -d -p 8000:8000 -v $(pwd)/chroma_db:/chroma/chroma chromadb/chroma
```
