import type { AgentStep } from './agent';

export type ContextAnnotation =
  | {
      type: 'codeContext';
      files: string[];
    }
  | {
      type: 'chatSummary';
      summary: string;
      chatId: string;
    };

export type ProgressAnnotation = {
  type: 'progress';
  label: string;
  status: 'in-progress' | 'complete';
  order: number;
  message: string;
};

export type ToolCallAnnotation = {
  type: 'toolCall';
  toolCallId: string;
  serverName: string;
  toolName: string;
  toolDescription: string;
};

/**
 * Annotation for agent step events streamed to the UI
 */
export type AgentStepAnnotation = {
  type: 'agentStep';
  step: AgentStep;
  stepIndex: number;
  totalSteps: number;
};

/**
 * Annotation for agent plan creation
 */
export type AgentPlanAnnotation = {
  type: 'agentPlan';
  plan: import('./agent').AgentPlan;
};

/**
 * Annotation for todo status updates
 */
export type AgentTodoUpdateAnnotation = {
  type: 'agentTodoUpdate';
  todoId: string;
  status: import('./agent').AgentTodoStatus;
  results?: unknown;
  error?: string;
  retryCount?: number;
};

/**
 * Annotation for agent session completion
 */
export type AgentCompleteAnnotation = {
  type: 'agentComplete';
  finalAnswer: string;
  totalSteps: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

/**
 * Annotation for agent session errors
 */
export type AgentErrorAnnotation = {
  type: 'agentError';
  error: string;
  stepIndex?: number;
};
