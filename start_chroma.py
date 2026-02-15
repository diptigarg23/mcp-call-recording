#!/usr/bin/env python3
"""
Start ChromaDB server for local development
"""
import os
import sys
import subprocess

# Get the database path from environment or use default
db_path = os.getenv('CHROMA_DB_PATH', './chroma_db')
port = int(os.getenv('CHROMA_PORT', '8000'))

# Create the directory if it doesn't exist
os.makedirs(db_path, exist_ok=True)

# Start the server
if __name__ == "__main__":
    print(f"Starting ChromaDB server on http://localhost:{port}")
    print(f"Database path: {os.path.abspath(db_path)}")
    print("Press Ctrl+C to stop the server")
    print()
    
    # Set environment variables for ChromaDB
    env = os.environ.copy()
    # Prevent ChromaDB from trying to read .env file
    env['CHROMA_SERVER_NOFILE'] = '1'
    env['IS_PERSISTENT'] = 'TRUE'
    env['PERSIST_DIRECTORY'] = os.path.abspath(db_path)
    env['ANONYMIZED_TELEMETRY'] = 'FALSE'
    
    # Change to a directory without .env to avoid permission issues
    original_dir = os.getcwd()
    try:
        # Try to run chromadb server using uvicorn
        # ChromaDB 1.5.0+ uses a different structure
        print("Starting ChromaDB server...")
        subprocess.run([
            sys.executable, '-m', 'uvicorn',
            'chromadb.app:app',
            '--host', '0.0.0.0',
            '--port', str(port),
            '--log-level', 'info'
        ], env=env, cwd=original_dir)
    except KeyboardInterrupt:
        print("\nStopping ChromaDB server...")
    except Exception as e:
        print(f"Error starting server: {e}")
        print("\nTrying alternative: install chromadb with server extras:")
        print("  pip3 install 'chromadb[server]'")
        print("\nOr use Docker:")
        print("  docker run -d -p 8000:8000 -v $(pwd)/chroma_db:/chroma/chroma chromadb/chroma")
        sys.exit(1)
