@echo off
REM Start ChromaDB server for Windows

if "%CHROMA_DB_PATH%"=="" set CHROMA_DB_PATH=.\chroma_db
if "%CHROMA_PORT%"=="" set CHROMA_PORT=8000

if not exist "%CHROMA_DB_PATH%" mkdir "%CHROMA_DB_PATH%"

echo Starting ChromaDB server on http://localhost:%CHROMA_PORT%
echo Database path: %CD%\%CHROMA_DB_PATH%
echo Press Ctrl+C to stop the server
echo.

set IS_PERSISTENT=TRUE
set PERSIST_DIRECTORY=%CD%\%CHROMA_DB_PATH%
set ANONYMIZED_TELEMETRY=FALSE

python -m uvicorn chromadb.app:app --host 0.0.0.0 --port %CHROMA_PORT% --log-level info
