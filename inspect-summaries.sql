-- SQL queries to inspect ChromaDB SQLite database for transcript summaries
-- Usage: sqlite3 ./chroma_db/chroma.sqlite3 < inspect-summaries.sql

.mode column
.headers on
.width 20 40 15 10

-- Check if transcript_summaries collection exists
SELECT '=== Collections ===' as '';
SELECT name, metadata FROM collections WHERE name LIKE '%summar%';

-- Get collection ID for transcript_summaries
.print ''
SELECT '=== Summary Count ===' as '';
SELECT 
    c.name as collection,
    COUNT(e.id) as total_summaries
FROM collections c
LEFT JOIN embeddings e ON c.id = e.collection_id
WHERE c.name = 'transcript_summaries'
GROUP BY c.name;

-- View all summaries with metadata
.print ''
SELECT '=== All Summaries ===' as '';
SELECT 
    substr(e.id, 1, 16) as summary_id,
    json_extract(e.metadata, '$.fileName') as file_name,
    json_extract(e.metadata, '$.clientName') as client,
    json_extract(e.metadata, '$.callType') as type,
    substr(e.document, 1, 50) || '...' as summary_preview
FROM embeddings e
JOIN collections c ON e.collection_id = c.id
WHERE c.name = 'transcript_summaries'
ORDER BY json_extract(e.metadata, '$.callDate') DESC;

-- Show full summary for a specific file (change the fileName below)
.print ''
.print '=== Full Summary Example (first one) ==='
.mode line
SELECT 
    json_extract(e.metadata, '$.fileName') as file_name,
    json_extract(e.metadata, '$.clientName') as client_name,
    json_extract(e.metadata, '$.callType') as call_type,
    json_extract(e.metadata, '$.callDate') as call_date,
    e.document as full_summary
FROM embeddings e
JOIN collections c ON e.collection_id = c.id
WHERE c.name = 'transcript_summaries'
LIMIT 1;
