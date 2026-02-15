#!/usr/bin/env python3
"""
Search ChromaDB transcript summaries with a query
Usage: python3 search-summaries.py "What were the action items?"
"""

import chromadb
import sys

if len(sys.argv) < 2:
    print("Usage: python3 search-summaries.py 'your search query'")
    sys.exit(1)

query = " ".join(sys.argv[1:])

# Connect to ChromaDB
client = chromadb.HttpClient(host="localhost", port=8000)

try:
    collection = client.get_collection(name="transcript_summaries")
    
    # Search with the query
    # Note: This requires embeddings, which we'd need to generate
    # For now, just list all summaries
    results = collection.get(include=["documents", "metadatas"])
    
    print(f"🔍 Searching for: '{query}'")
    print(f"📊 Total summaries: {len(results['ids'])}\n")
    print("=" * 80)
    
    # Simple text search (not semantic)
    matches = []
    for i, (doc_id, document, metadata) in enumerate(zip(
        results['ids'],
        results['documents'],
        results['metadatas']
    )):
        if query.lower() in document.lower():
            matches.append((doc_id, document, metadata))
    
    if matches:
        print(f"\n✅ Found {len(matches)} summaries containing '{query}':\n")
        for doc_id, document, metadata in matches:
            print(f"📄 {metadata.get('fileName', 'Unknown')}")
            print(f"   Client: {metadata.get('clientName', 'N/A')}")
            print(f"   Type: {metadata.get('callType', 'N/A')}")
            
            # Find and print relevant lines
            lines = document.split('\n')
            for line in lines:
                if query.lower() in line.lower():
                    print(f"   ➜ {line.strip()}")
            print()
    else:
        print(f"\n❌ No summaries found containing '{query}'")
        print("\nAvailable summaries:")
        for metadata in results['metadatas']:
            print(f"  - {metadata.get('fileName', 'Unknown')}")

except Exception as e:
    print(f"❌ Error: {e}")
