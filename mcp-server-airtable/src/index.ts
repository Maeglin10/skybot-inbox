#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Airtable from 'airtable';

// Configuration from environment variables
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Error: AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set');
  process.exit(1);
}

// Initialize Airtable
Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

// Define available tools
const tools: Tool[] = [
  {
    name: 'airtable_list_tables',
    description: 'List all tables in the Airtable base with their fields',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'airtable_list_records',
    description: 'List records from an Airtable table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Name of the table to query',
        },
        maxRecords: {
          type: 'number',
          description: 'Maximum number of records to return (default: 100)',
        },
        filterByFormula: {
          type: 'string',
          description: 'Airtable formula to filter records (optional)',
        },
        view: {
          type: 'string',
          description: 'Name of the view to use (optional)',
        },
      },
      required: ['table'],
    },
  },
  {
    name: 'airtable_get_record',
    description: 'Get a specific record by ID from an Airtable table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Name of the table',
        },
        recordId: {
          type: 'string',
          description: 'ID of the record to retrieve',
        },
      },
      required: ['table', 'recordId'],
    },
  },
  {
    name: 'airtable_create_record',
    description: 'Create a new record in an Airtable table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Name of the table',
        },
        fields: {
          type: 'object',
          description: 'Fields to set on the new record',
        },
      },
      required: ['table', 'fields'],
    },
  },
  {
    name: 'airtable_update_record',
    description: 'Update an existing record in an Airtable table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Name of the table',
        },
        recordId: {
          type: 'string',
          description: 'ID of the record to update',
        },
        fields: {
          type: 'object',
          description: 'Fields to update on the record',
        },
      },
      required: ['table', 'recordId', 'fields'],
    },
  },
  {
    name: 'airtable_delete_record',
    description: 'Delete a record from an Airtable table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Name of the table',
        },
        recordId: {
          type: 'string',
          description: 'ID of the record to delete',
        },
      },
      required: ['table', 'recordId'],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: 'airtable-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler for listing tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handler for calling tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'airtable_list_tables': {
        // Use Airtable Meta API to list tables
        const response = await fetch(
          `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch tables: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'airtable_list_records': {
        const { table, maxRecords = 100, filterByFormula, view } = args as any;
        const records: any[] = [];

        const selectOptions: any = { maxRecords };
        if (filterByFormula) selectOptions.filterByFormula = filterByFormula;
        if (view) selectOptions.view = view;

        await base(table)
          .select(selectOptions)
          .eachPage((pageRecords, fetchNextPage) => {
            pageRecords.forEach((record) => {
              records.push({
                id: record.id,
                fields: record.fields,
              });
            });
            fetchNextPage();
          });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  table,
                  count: records.length,
                  records,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'airtable_get_record': {
        const { table, recordId } = args as any;
        const record = await base(table).find(recordId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: record.id,
                  fields: record.fields,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'airtable_create_record': {
        const { table, fields } = args as any;
        const record = await base(table).create(fields) as any;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: record.id,
                  fields: record.fields,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'airtable_update_record': {
        const { table, recordId, fields } = args as any;
        const record = await base(table).update(recordId, fields);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: record.id,
                  fields: record.fields,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'airtable_delete_record': {
        const { table, recordId } = args as any;
        await base(table).destroy(recordId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, recordId }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Airtable MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
