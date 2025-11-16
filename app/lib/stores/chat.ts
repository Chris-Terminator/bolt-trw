import { map } from 'nanostores';
import type { AgentStep } from '~/types/agent';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
});

/**
 * Store for tracking agent session state
 */
export const agentStore = map<{
  isRunning: boolean;
  steps: AgentStep[];
  currentStepIndex: number | null;
  maxSteps: number;
  error: string | null;
}>({
  isRunning: false,
  steps: [],
  currentStepIndex: null,
  maxSteps: 10,
  error: null,
});

/**
 * Update agent store with a new step
 */
export function addAgentStep(step: AgentStep) {
  const current = agentStore.get();
  agentStore.set({
    ...current,
    steps: [...current.steps, step],
    currentStepIndex: step.stepIndex,
  });
}

/**
 * Start an agent session
 */
export function startAgentSession(maxSteps: number) {
  agentStore.set({
    isRunning: true,
    steps: [],
    currentStepIndex: null,
    maxSteps,
    error: null,
  });
}

/**
 * Complete an agent session
 */
export function completeAgentSession() {
  const current = agentStore.get();
  agentStore.set({
    ...current,
    isRunning: false,
    currentStepIndex: null,
  });
}

/**
 * Set agent error
 */
export function setAgentError(error: string) {
  const current = agentStore.get();
  agentStore.set({
    ...current,
    isRunning: false,
    error,
  });
}

/**
 * Reset agent session
 */
export function resetAgentSession() {
  agentStore.set({
    isRunning: false,
    steps: [],
    currentStepIndex: null,
    maxSteps: 10,
    error: null,
  });
}
