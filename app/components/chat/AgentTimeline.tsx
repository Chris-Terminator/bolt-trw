import { memo } from 'react';
import type { AgentStep } from '~/types/agent';

interface AgentTimelineProps {
  steps: AgentStep[];
  currentStep?: number;
  maxSteps: number;
}

/**
 * Displays the timeline of agent steps in a chat session
 */
export const AgentTimeline = memo(({ steps, currentStep, maxSteps }: AgentTimelineProps) => {
  return (
    <div className="agent-timeline border-l-2 border-bolt-elements-borderColor pl-4 my-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">
          Agent Progress
        </h3>
        <span className="text-xs text-bolt-elements-textSecondary">
          {steps.length} / {maxSteps} steps
        </span>
      </div>
      
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <AgentStepCard
            key={`step-${step.stepIndex}`}
            step={step}
            isActive={currentStep === idx}
            isLatest={idx === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
});

interface AgentStepCardProps {
  step: AgentStep;
  isActive?: boolean;
  isLatest?: boolean;
}

/**
 * Card for displaying a single agent step
 */
export const AgentStepCard = memo(({ step, isActive, isLatest }: AgentStepCardProps) => {
  const getStepIcon = (kind: AgentStep['kind']) => {
    switch (kind) {
      case 'thought':
        return '💭';
      case 'tool_call':
        return '🔧';
      case 'observation':
        return '👁️';
      case 'final':
        return '✅';
      default:
        return '•';
    }
  };

  const getStepLabel = (kind: AgentStep['kind']) => {
    switch (kind) {
      case 'thought':
        return 'Thinking';
      case 'tool_call':
        return 'Tool Call';
      case 'observation':
        return 'Observation';
      case 'final':
        return 'Final Answer';
      default:
        return 'Step';
    }
  };

  const getStepColor = (kind: AgentStep['kind']) => {
    switch (kind) {
      case 'thought':
        return 'text-blue-400';
      case 'tool_call':
        return 'text-purple-400';
      case 'observation':
        return 'text-green-400';
      case 'final':
        return 'text-emerald-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className={`
        agent-step-card rounded-lg p-3 transition-all
        ${isActive ? 'bg-bolt-elements-background-depth-3 ring-2 ring-bolt-elements-focus' : 'bg-bolt-elements-background-depth-2'}
        ${isLatest && !step.finalAnswer ? 'animate-pulse' : ''}
        ${step.error ? 'border-l-4 border-red-500' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg" role="img" aria-label={getStepLabel(step.kind)}>
          {getStepIcon(step.kind)}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${getStepColor(step.kind)}`}>
              {getStepLabel(step.kind)}
            </span>
            <span className="text-xs text-bolt-elements-textSecondary">
              Step {step.stepIndex + 1}
            </span>
          </div>
          
          {step.thought && (
            <p className="text-sm text-bolt-elements-textPrimary mb-2">
              {step.thought}
            </p>
          )}
          
          {step.toolCall && (
            <div className="bg-bolt-elements-background-depth-1 rounded px-2 py-1 mb-2">
              <code className="text-xs text-bolt-elements-textPrimary font-mono">
                {step.toolCall.toolName}(
                {JSON.stringify(step.toolCall.arguments, null, 2).slice(0, 100)}
                {JSON.stringify(step.toolCall.arguments).length > 100 ? '...' : ''})
              </code>
            </div>
          )}
          
          {step.observation !== undefined && (
            <div className="bg-green-900/20 border border-green-700/30 rounded px-2 py-1 mb-2">
              <pre className="text-xs text-green-300 font-mono overflow-x-auto">
                {typeof step.observation === 'string'
                  ? step.observation
                  : JSON.stringify(step.observation, null, 2).slice(0, 200)}
              </pre>
            </div>
          )}
          
          {step.finalAnswer && (
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded px-3 py-2">
              <p className="text-sm text-bolt-elements-textPrimary whitespace-pre-wrap">
                {step.finalAnswer}
              </p>
            </div>
          )}
          
          {step.error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded px-2 py-1">
              <p className="text-xs text-red-300">
                ⚠️ {step.error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AgentTimeline.displayName = 'AgentTimeline';
AgentStepCard.displayName = 'AgentStepCard';