import { useState } from 'react';
import type { AgentTodo, AgentPlan } from '~/types/agent';

interface AgentTodoListProps {
  plan: AgentPlan;
  currentTodoId?: string;
  showDetails?: boolean;
}

interface TodoItemProps {
  todo: AgentTodo;
  isActive: boolean;
  showDetails: boolean;
  children?: AgentTodo[];
  currentTodoId?: string;
}

const TodoItem = ({ todo, isActive, showDetails, children, currentTodoId }: TodoItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getStatusIcon = (status: AgentTodo['status']) => {
    switch (status) {
      case 'completed':
        return <div className="i-ph:check-circle-fill text-green-500" />;
      case 'in_progress':
        return <div className="i-svg-spinners:3-dots-fade text-blue-500" />;
      case 'failed':
        return <div className="i-ph:x-circle-fill text-red-500" />;
      case 'skipped':
        return <div className="i-ph:minus-circle text-gray-400" />;
      default:
        return <div className="i-ph:circle text-gray-300" />;
    }
  };

  const getStatusLabel = (status: AgentTodo['status']) => {
    switch (status) {
      case 'completed':
        return 'Done';
      case 'in_progress':
        return 'Working...';
      case 'failed':
        return 'Failed';
      case 'skipped':
        return 'Skipped';
      default:
        return 'Pending';
    }
  };

  const getPriorityColor = (priority: AgentTodo['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const hasChildren = children && children.length > 0;

  return (
    <div className="todo-item">
      <div
        className={`
          flex items-start gap-2 p-2 rounded-md transition-all
          ${isActive ? 'bg-bolt-elements-background-depth-3 ring-2 ring-bolt-elements-focus' : 'hover:bg-bolt-elements-background-depth-2'}
          ${todo.status === 'in_progress' ? 'border-l-2 border-blue-500' : ''}
        `}
      >
        {/* Expand/Collapse button for todos with children */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-0.5 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
          >
            <div className={`i-ph:caret-${isExpanded ? 'down' : 'right'} text-sm`} />
          </button>
        )}
        
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon(todo.status)}
        </div>

        {/* Todo content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-bolt-elements-textPrimary text-sm">
              {todo.title}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>
            <span className="text-xs text-bolt-elements-textSecondary">
              {getStatusLabel(todo.status)}
            </span>
            {todo.retryCount && todo.retryCount > 0 && (
              <span className="text-xs text-orange-500">
                (Retry {todo.retryCount})
              </span>
            )}
          </div>

          {/* Description (if showDetails enabled) */}
          {showDetails && todo.description && (
            <div className="text-xs text-bolt-elements-textSecondary mt-1">
              {todo.description}
            </div>
          )}

          {/* Results (if completed and showDetails enabled) */}
          {showDetails && todo.status === 'completed' && todo.results !== undefined && (
            <div className="text-xs text-bolt-elements-textSecondary mt-1 bg-bolt-elements-background-depth-1 rounded p-2">
              <div className="font-medium mb-1">Results:</div>
              <pre className="whitespace-pre-wrap overflow-x-auto">
                {typeof todo.results === 'string'
                  ? todo.results
                  : JSON.stringify(todo.results, null, 2)}
              </pre>
            </div>
          )}

          {/* Error message (if failed and showDetails enabled) */}
          {showDetails && todo.status === 'failed' && todo.error && (
            <div className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-950/20 rounded p-2">
              <div className="font-medium mb-1">Error:</div>
              <div>{todo.error}</div>
            </div>
          )}

          {/* Timestamps (if showDetails enabled) */}
          {showDetails && (
            <div className="text-xs text-bolt-elements-textTertiary mt-1">
              {todo.completedAt 
                ? `Created: ${new Date(todo.createdAt).toLocaleTimeString()} | Completed: ${new Date(todo.completedAt).toLocaleTimeString()}`
                : `Created: ${new Date(todo.createdAt).toLocaleTimeString()}`
              }
            </div>
          )}
        </div>
      </div>

      {/* Child todos */}
      {hasChildren && isExpanded && (
        <div className="ml-8 mt-1 space-y-1 border-l-2 border-bolt-elements-borderColor pl-2">
          {children.map((child) => (
            <TodoItem
              key={child.id}
              todo={child}
              isActive={currentTodoId === child.id}
              showDetails={showDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function AgentTodoList({ plan, currentTodoId, showDetails = false }: AgentTodoListProps) {
  const [detailsEnabled, setDetailsEnabled] = useState(showDetails);
  
  // Organize todos into parent-child structure
  const parentTodos = plan.todos.filter(t => !t.parentId);
  const childTodosByParent = plan.todos
    .filter(t => t.parentId)
    .reduce((acc, todo) => {
      if (!acc[todo.parentId!]) {
        acc[todo.parentId!] = [];
      }
      acc[todo.parentId!].push(todo);
      return acc;
    }, {} as Record<string, AgentTodo[]>);

  // Calculate progress
  const completedCount = plan.todos.filter(t => t.status === 'completed').length;
  const totalCount = plan.todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="agent-todo-list border border-bolt-elements-borderColor rounded-lg p-4 my-4 bg-bolt-elements-background-depth-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="i-ph:list-checks-bold text-lg text-bolt-elements-textPrimary" />
          <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">
            Agent Plan
          </h3>
        </div>
        
        <button
          onClick={() => setDetailsEnabled(!detailsEnabled)}
          className="text-xs px-2 py-1 rounded hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary"
        >
          {detailsEnabled ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Strategy */}
      {plan.strategy && (
        <div className="text-xs text-bolt-elements-textSecondary mb-3 p-2 bg-bolt-elements-background-depth-2 rounded">
          <span className="font-medium">Strategy: </span>
          {plan.strategy}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-bolt-elements-textSecondary mb-1">
          <span>Progress: {completedCount}/{totalCount} tasks</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-bolt-elements-background-depth-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Todo list */}
      <div className="space-y-2">
        {parentTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isActive={currentTodoId === todo.id}
            showDetails={detailsEnabled}
            children={childTodosByParent[todo.id]}
            currentTodoId={currentTodoId}
          />
        ))}
      </div>

      {/* Estimated steps remaining */}
      {detailsEnabled && (
        <div className="text-xs text-bolt-elements-textTertiary mt-3 pt-3 border-t border-bolt-elements-borderColor">
          Estimated steps: ~{plan.estimatedSteps}
        </div>
      )}
    </div>
  );
}