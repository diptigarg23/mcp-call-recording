# Environment Setup

This project requires certain environment variables to be configured. Create a `.env` file in the project root with the following variables:

## Required Variables

### OPENAI_API_KEY
Your OpenAI API key for generating summaries and embeddings.

```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**Get your API key**: https://platform.openai.com/api-keys

**Cost estimate**: 
- Summaries (GPT-4-turbo): ~$0.01-0.03 per transcript
- Embeddings (text-embedding-3-small): ~$0.0001 per transcript
- Total: ~$0.02 per transcript on average

### VTT_DIRECTORY
The directory containing your VTT transcript files. Use an absolute path.

```bash
VTT_DIRECTORY=/Users/yourusername/path/to/vtt_files
```

### CHROMA_DB_PATH (Optional)
The path where ChromaDB will store its data. Defaults to `./chroma_db` if not specified.

```bash
CHROMA_DB_PATH=./chroma_db
```

## Example .env File

```bash
OPENAI_API_KEY=sk-proj-abc123...
VTT_DIRECTORY=/Users/diptigarg/Library/Mobile Documents/com~apple~CloudDocs/Cursor/MCP_Call_Recording/vtt_files
CHROMA_DB_PATH=./chroma_db
```

## Security Notes

- **Never commit `.env` files** to version control (already in `.gitignore`)
- Keep your OpenAI API key secure
- Monitor your OpenAI usage at https://platform.openai.com/usage
- Set usage limits in your OpenAI account to avoid unexpected charges

## Models Used

- **Summaries**: GPT-4-turbo (best quality for structured extraction)
- **Embeddings**: text-embedding-3-small (1536 dimensions, optimized for search)

## Verification

After setting up your `.env` file, verify it's correct:

```bash
# Check if variables are loaded
npm run build
node -e "require('dotenv').config(); console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set ✓' : 'Missing ✗'); console.log('VTT Directory:', process.env.VTT_DIRECTORY || 'Missing ✗');"
```
