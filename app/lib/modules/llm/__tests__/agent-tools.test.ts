import { describe, it, expect, beforeEach } from 'vitest';
import { AgentToolRegistry } from '../agent-tools';
import type { AgentToolDescriptor } from '~/types/agent';

describe('AgentToolRegistry', () => {
  let registry: AgentToolRegistry;

  beforeEach(() => {
    registry = AgentToolRegistry.getInstance();
  });

  describe('Tool Registration', () => {
    it('should register a new tool', () => {
      const tool: AgentToolDescriptor = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
        },
      };

      registry.registerTool(tool);
      const descriptors = registry.getToolDescriptors();

      expect(descriptors.some((t) => t.name === 'test_tool')).toBe(true);
    });

    it('should not register duplicate tools', () => {
      const tool: AgentToolDescriptor = {
        name: 'duplicate_tool',
        description: 'Test',
        inputSchema: {},
      };

      registry.registerTool(tool);
      const initialCount = registry.getToolDescriptors().length;

      registry.registerTool(tool); // Try to register again
      const finalCount = registry.getToolDescriptors().length;

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Tool Retrieval', () => {
    it('should get all registered tools', () => {
      const descriptors = registry.getToolDescriptors();
      expect(Array.isArray(descriptors)).toBe(true);
    });

    it('should include built-in tools', () => {
      const descriptors = registry.getToolDescriptors();
      const names = descriptors.map((t) => t.name);

      expect(names).toContain('read_file');
      expect(names).toContain('list_files');
    });
  });

  describe('Tool Execution', () => {
    it('should throw error for unknown tool', async () => {
      await expect(
        registry.executeTool('nonexistent_tool', {}, {
          messages: [],
          toolCallId: 'test',
        })
      ).rejects.toThrow('Tool "nonexistent_tool" not found');
    });

    it('should throw for unimplemented workspace tool', async () => {
      await expect(
        registry.executeTool('read_file', { path: 'test.ts' }, {
          messages: [],
          toolCallId: 'test',
        })
      ).rejects.toThrow('execution not implemented');
    });
  });

  describe('MCP Tool Handling', () => {
    it('should handle MCP tool names with prefix', async () => {
      const tool: AgentToolDescriptor = {
        name: 'mcp_test_tool',
        description: 'MCP test tool',
        inputSchema: {},
      };

      registry.registerTool(tool);
      
      // Should recognize as MCP tool
      const result = await registry.executeTool('mcp_test_tool', {}, {
        messages: [],
        toolCallId: 'test',
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('Input Schema Validation', () => {
    it('should store input schema with tool', () => {
      const schema = {
        type: 'object',
        properties: {
          required_param: { type: 'string' },
          optional_param: { type: 'number' },
        },
        required: ['required_param'],
      };

      const tool: AgentToolDescriptor = {
        name: 'schema_test',
        description: 'Test',
        inputSchema: schema,
      };

      registry.registerTool(tool);
      const registered = registry.getToolDescriptors().find((t) => t.name === 'schema_test');

      expect(registered?.inputSchema).toEqual(schema);
    });
  });
});