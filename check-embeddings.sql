-- Quick SQL queries to check embeddings in ChromaDB

-- 1. Count total embeddings
SELECT 'Total embeddings:' as info, COUNT(*) as count FROM embeddings;

-- 2. Count segments
SELECT 'Total segments:' as info, COUNT(*) as count FROM segments;

-- 3. View client names
SELECT 'Client names:' as info, string_value as client_name 
FROM embedding_metadata 
WHERE key = 'clientName';

-- 4. View file names
SELECT 'File names:' as info, string_value as file_name 
FROM embedding_metadata 
WHERE key = 'fileName';

-- 5. Count embeddings per client
SELECT 
  string_value as client_name,
  COUNT(DISTINCT e.id) as embedding_count
FROM embeddings e
JOIN embedding_metadata em ON e.id = em.id
WHERE em.key = 'clientName'
GROUP BY string_value;

-- 6. View all metadata keys
SELECT DISTINCT key FROM embedding_metadata;
