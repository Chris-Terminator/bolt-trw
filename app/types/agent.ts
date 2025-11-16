/**
 * Simplified Agent Mode - Todo List + Artifact Streaming
 * Works exactly like normal mode but with todo planning and progress tracking
 */

import type { Message } from 'ai';

/**
 * Status of an individual todo item.
 */
export type AgentTodoStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Priority level for todo items.
 */
export type AgentTodoPriority = 'high' | 'medium' | 'low';

/**
 * A single todo item in the agent's plan.
 */
export interface AgentTodo {
  /** Unique identifier for this todo */
  id: string;
  /** Short, user-facing title */
  title: string;
  /** Optional longer description */
  description?: string;
  /** Current status */
  status: AgentTodoStatus;
  /** Priority level */
  priority: AgentTodoPriority;
  /** Parent todo ID for hierarchical todos */
  parentId?: string;
  /** Results/output from completing this todo */
  results?: unknown;
  /** Number of retry attempts for this todo */
  retryCount?: number;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when completed/failed */
  completedAt?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Overall plan containing all todos.
 */
export interface AgentPlan {
  /** List of all todos in the plan */
  todos: AgentTodo[];
  /** Estimated number of steps needed */
  estimatedSteps: number;
  /** High-level strategy description */
  strategy: string;
  /** ISO timestamp when plan was created */
  createdAt: string;
}