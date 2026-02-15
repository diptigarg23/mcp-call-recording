# Ollama Setup Guide

Ollama is used to generate structured summaries from transcripts using open-source language models.

## Installation

### macOS
```bash
brew install ollama
```

### Windows
1. Download from https://ollama.com/download
2. Run the installer
3. Ollama will start automatically as a service

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Download Models

After installing Ollama, pull the model you want to use:

### Recommended: Phi-3 (Default)
```bash
ollama pull phi3
```
- **Size**: ~2.3GB
- **Speed**: Fast (runs well on CPU)
- **Quality**: Excellent for structured tasks
- **Memory**: ~4GB RAM required

### Alternative: Llama 3 8B
```bash
ollama pull llama3
```
- **Size**: ~4.7GB
- **Speed**: Moderate (GPU recommended)
- **Quality**: Higher quality summaries
- **Memory**: ~8GB RAM required

### Alternative: Mistral 7B
```bash
ollama pull mistral
```
- **Size**: ~4.1GB
- **Speed**: Fast
- **Quality**: Good balance
- **Memory**: ~8GB RAM required

## Starting Ollama

### macOS/Linux
Ollama runs as a background service automatically after installation. You can verify it's running:

```bash
ollama list
```

To start/stop manually:
```bash
# Start
ollama serve

# Stop
killall ollama
```

### Windows
Ollama runs as a Windows service automatically. Check it's running by opening:
```
http://localhost:11434
```

You should see: "Ollama is running"

## Testing

Test that Ollama is working:

```bash
ollama run phi3 "Hello, how are you?"
```

## Configuration

In your `.env` file:

```env
# Default configuration (Ollama on localhost, using phi3)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
```

## Troubleshooting

### "Ollama is not running"
**macOS/Linux:**
```bash
ollama serve
```

**Windows:**
- Check Windows Services for "Ollama"
- Restart the Ollama service

### "Model not found"
Pull the model first:
```bash
ollama pull phi3
```

### Check available models
```bash
ollama list
```

### Remove a model
```bash
ollama rm phi3
```

## Model Comparison

| Model | Size | RAM | Speed | Quality | Best For |
|-------|------|-----|-------|---------|----------|
| **phi3** | 2.3GB | 4GB | Fast | Good | Structured tasks, quick summaries (recommended) |
| **llama3** | 4.7GB | 8GB | Moderate | Excellent | High-quality summaries, detailed analysis |
| **mistral** | 4.1GB | 8GB | Fast | Good | Fast processing, good balance |

## Resource Requirements

### Minimum (phi3):
- CPU: 4 cores
- RAM: 4GB free
- Disk: 3GB

### Recommended (phi3):
- CPU: 8 cores
- RAM: 8GB free
- Disk: 5GB

### For llama3/mistral:
- CPU: 8 cores (or GPU)
- RAM: 8GB+ free
- GPU: Optional but recommended (NVIDIA with 6GB+ VRAM)
- Disk: 8GB

## Performance Tips

1. **Use GPU if available**: Ollama automatically uses GPU if detected
2. **Close other apps**: Free up RAM for better performance
3. **Start with phi3**: Test with the smaller model first
4. **Upgrade to llama3**: If you need better quality and have resources

## API Details

Ollama runs a REST API on port 11434:
- Endpoint: `http://localhost:11434/api/generate`
- No authentication required (local only)
- JSON request/response format

The MCP server uses this API to generate structured summaries.
