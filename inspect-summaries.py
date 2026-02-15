#!/usr/bin/env python3
"""
Inspect ChromaDB transcript summaries
Usage: python3 inspect-summaries.py
"""

import chromadb
from chromadb.config import Settings
import json

# Connect to ChromaDB
client = chromadb.HttpClient(host="localhost", port=8000)

# Get the transcript_summaries collection
try:
    collection = client.get_collection(name="transcript_summaries")
    
    # Get all summaries
    results = collection.get(
        include=["documents", "metadatas"]
    )
    
    print(f"📊 Found {len(results['ids'])} transcript summaries\n")
    print("=" * 80)
    
    for i, (doc_id, document, metadata) in enumerate(zip(
        results['ids'],
        results['documents'],
        results['metadatas']
    ), 1):
        print(f"\n{i}. Summary ID: {doc_id}")
        print(f"   File: {metadata.get('fileName', 'Unknown')}")
        print(f"   Client: {metadata.get('clientName', 'N/A')}")
        print(f"   Call Type: {metadata.get('callType', 'N/A')}")
        print(f"   Date: {metadata.get('callDate', 'N/A')}")
        print(f"\n   Summary:\n   {'-' * 76}")
        
        # Print first 500 characters of summary
        summary_preview = document[:500] if len(document) > 500 else document
        for line in summary_preview.split('\n'):
            print(f"   {line}")
        
        if len(document) > 500:
            print(f"   ... (truncated, {len(document)} total characters)")
        
        print(f"   {'-' * 76}")
        print()

except Exception as e:
    print(f"❌ Error: {e}")
    print("\nMake sure:")
    print("  1. ChromaDB server is running (./start_chroma.sh)")
    print("  2. You have indexed some transcripts")
    print("  3. The MCP server has run at least once")
