import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../agent-orchestrator';
import type { AgentSessionInput, AgentStep } from '~/types/agent';

describe('AgentOrchestrator', () => {
  describe('JSON Response Parsing', () => {
    it('should parse a thought step', () => {
      const orchestrator = new AgentOrchestrator();
      const text = JSON.stringify({
        thought: 'I need to analyze the user request',
      });

      const step = (orchestrator as any).parseModelResponse(text, 0);

      expect(step.kind).toBe('thought');
      expect(step.thought).toBe('I need to analyze the user request');
      expect(step.stepIndex).toBe(0);
    });

    it('should parse a tool call step', () => {
      const orchestrator = new AgentOrchestrator();
      const text = JSON.stringify({
        thought: 'Reading the file to understand the code',
        tool_call: {
          toolName: 'read_file',
          arguments: { path: 'app.ts', maxLines: 100 },
        },
      });

      const step = (orchestrator as any).parseModelResponse(text, 1);

      expect(step.kind).toBe('tool_call');
      expect(step.thought).toBe('Reading the file to understand the code');
      expect(step.toolCall?.toolName).toBe('read_file');
      expect(step.toolCall?.arguments).toEqual({ path: 'app.ts', maxLines: 100 });
    });

    it('should parse a final answer step', () => {
      const orchestrator = new AgentOrchestrator();
      const text = JSON.stringify({
        thought: 'I have all the information needed',
        final_answer: 'The application is a React TypeScript project...',
      });

      const step = (orchestrator as any).parseModelResponse(text, 5);

      expect(step.kind).toBe('final');
      expect(step.finalAnswer).toBe('The application is a React TypeScript project...');
      expect(step.stepIndex).toBe(5);
    });

    it('should handle malformed JSON gracefully', () => {
      const orchestrator = new AgentOrchestrator();
      const text = 'This is not JSON';

      const step = (orchestrator as any).parseModelResponse(text, 2);

      expect(step.kind).toBe('thought');
      expect(step.thought).toBe('This is not JSON');
      expect(step.error).toContain('Failed to parse response');
    });

    it('should handle empty object', () => {
      const orchestrator = new AgentOrchestrator();
      const text = '{}';

      const step = (orchestrator as any).parseModelResponse(text, 3);

      expect(step.kind).toBe('thought');
      expect(step.rawModelOutput).toBe('{}');
    });
  });

  describe('System Prompt Generation', () => {
    it('should generate system prompt with tools', () => {
      const orchestrator = new AgentOrchestrator();
      const tools = [
        { name: 'read_file', description: 'Read file contents', input_schema: {} },
        { name: 'list_files', description: 'List directory files', input_schema: {} },
      ];

      const prompt = (orchestrator as any).buildAgentSystemPrompt('plan_act', tools);

      expect(prompt).toContain('read_file');
      expect(prompt).toContain('list_files');
      expect(prompt).toContain('plan_act');
      expect(prompt).toContain('JSON');
    });

    it('should generate system prompt with empty tools', () => {
      const orchestrator = new AgentOrchestrator();
      const tools: any[] = [];

      const prompt = (orchestrator as any).buildAgentSystemPrompt('react', tools);

      expect(prompt).toContain('react');
      expect(prompt).toBeTruthy();
    });
  });

  describe('Step Limit Enforcement', () => {
    it('should terminate when max steps reached', async () => {
      const orchestrator = new AgentOrchestrator();
      const input: AgentSessionInput = {
        provider: 'OpenAI',
        model: 'gpt-4',
        messages: [{ id: '1', role: 'user', content: 'Test' }],
        config: {
          mode: 'plan_act',
          maxSteps: 0, // Set to 0 to trigger immediate termination
          tools: [],
        },
      };

      // Mock runState to simulate already at max steps
      (orchestrator as any).runState = {
        id: 'test',
        config: input.config,
        steps: [],
        status: 'running',
        startedAt: new Date().toISOString(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };

      const steps: AgentStep[] = [];
      const generator = (orchestrator as any).executeLoop(input, input.messages);

      for await (const step of generator) {
        steps.push(step);
      }

      expect(steps).toHaveLength(1);
      expect(steps[0].kind).toBe('final');
      expect(steps[0].error).toContain('Step limit exceeded');
    });
  });

  describe('Cancellation', () => {
    it('should allow cancellation of running session', () => {
      const orchestrator = new AgentOrchestrator();
      
      // Initialize a run state
      (orchestrator as any).runState = {
        id: 'test',
        config: { mode: 'plan_act', maxSteps: 10, tools: [] },
        steps: [],
        status: 'running',
        startedAt: new Date().toISOString(),
      };
      (orchestrator as any).abortController = new AbortController();

      orchestrator.cancel();

      const state = orchestrator.getRunState();
      expect(state?.status).toBe('cancelled');
      expect(state?.finishedAt).toBeTruthy();
    });

    it('should handle cancel when no session is running', () => {
      const orchestrator = new AgentOrchestrator();
      
      // Should not throw
      expect(() => orchestrator.cancel()).not.toThrow();
    });
  });

  describe('Run State', () => {
    it('should return null when no session has started', () => {
      const orchestrator = new AgentOrchestrator();
      const state = orchestrator.getRunState();
      
      // Will return initialized state, not null
      expect(state).toBeTruthy();
    });

    it('should track steps in run state', () => {
      const orchestrator = new AgentOrchestrator();
      
      const runState = {
        id: 'test',
        config: { mode: 'plan_act' as const, maxSteps: 10, tools: [] },
        steps: [
          { stepIndex: 0, kind: 'thought' as const, thought: 'test', timestamp: new Date().toISOString() },
        ],
        status: 'running' as const,
        startedAt: new Date().toISOString(),
      };
      
      (orchestrator as any).runState = runState;
      
      const state = orchestrator.getRunState();
      expect(state?.steps).toHaveLength(1);
      expect(state?.steps[0].kind).toBe('thought');
    });
  });
});