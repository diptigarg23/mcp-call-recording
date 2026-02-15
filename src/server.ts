import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { QueryTool } from './tools/query.js';
import { EmbeddingService } from './services/embeddingService.js';
import { VectorDatabase } from './services/vectorDb.js';

export class MCPServer {
  private server: Server;
  private queryTool: QueryTool;
  
  constructor(embeddingService: EmbeddingService, vectorDb: VectorDatabase) {
    this.server = new Server(
      {
        name: 'call-recording-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.queryTool = new QueryTool(embeddingService, vectorDb);
    this.setupHandlers();
  }
  
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'query_transcripts',
            description: 'Query call transcripts using natural language. Ask questions about client calls, risks, discussions, decisions, etc. Example: "identify the top risk identified in last client call with Bank of America with Sales"',
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: 'Natural language question about the call transcripts',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                },
                minScore: {
                  type: 'number',
                  description: 'Minimum relevance score (0-1, default: 0.3)',
                  default: 0.3,
                },
              },
              required: ['question'],
            },
          } as Tool,
        ],
      };
    });
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'query_transcripts') {
        const question = args?.question as string;
        const limit = (args?.limit as number) || 10;
        const minScore = (args?.minScore as number) ?? 0.0; // Default to 0.0 to see all results
        
        if (!question) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: question parameter is required',
              },
            ],
            isError: true,
          };
        }
        
        try {
          const result = await this.queryTool.queryTranscripts(question, limit, minScore);
          
          return {
            content: [
              {
                type: 'text',
                text: result.answer,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Error querying transcripts: ${error.message || String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    });
  }
  
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server started and connected via stdio');
  }
}
