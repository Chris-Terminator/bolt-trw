import type { Message } from 'ai';
import { useCallback, useRef, useState } from 'react';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useMessageParser');

const messageParser = new StreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      logger.trace('onArtifactOpen', data);
      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);
    },
    onArtifactClose: (data) => {
      logger.trace('onArtifactClose');
      workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      logger.trace('onActionOpen', data.action);
      if (data.action.type === 'file') {
        workbenchStore.addAction(data);
      }
    },
    onActionClose: (data) => {
      logger.trace('onActionClose', data.action);
      if (data.action.type !== 'file') {
        workbenchStore.addAction(data);
      }
      workbenchStore.runAction(data);
    },
    onActionStream: (data) => {
      logger.trace('onActionStream', data.action);
      workbenchStore.runAction(data, true);
    },
  },
});

const extractTextContent = (message: Message) =>
  Array.isArray(message.content)
    ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
    : message.content;

export function useMessageParser() {
  const lastRootMessageIdRef = useRef<string>();
  const [parsedMessages, setParsedMessages] = useState<Record<string, string>>({});

  const parseMessages = useCallback((messages: Message[], _isLoading: boolean) => {
    const firstContentMessage = messages.find(
      (message) => message.role === 'assistant' || message.role === 'user',
    );

    let resetParser = false;

    if (firstContentMessage?.id && firstContentMessage.id !== lastRootMessageIdRef.current) {
      lastRootMessageIdRef.current = firstContentMessage.id;
      resetParser = true;
      messageParser.reset();
    } else if (!firstContentMessage && lastRootMessageIdRef.current) {
      lastRootMessageIdRef.current = undefined;
      resetParser = true;
      messageParser.reset();
    }

    setParsedMessages((prevParsed) => {
      const nextParsed: Record<string, string> = resetParser ? {} : { ...prevParsed };
      const activeIds = new Set<string>();

      for (const message of messages) {
        if (message.role === 'assistant' || message.role === 'user') {
          const id = message.id;
          activeIds.add(id);
          const newParsedContent = messageParser.parse(id, extractTextContent(message));
          nextParsed[id] = resetParser ? newParsedContent : (nextParsed[id] || '') + newParsedContent;
        }
      }

      for (const id of Object.keys(nextParsed)) {
        if (!activeIds.has(id)) {
          delete nextParsed[id];
        }
      }

      return nextParsed;
    });
  }, []);

  return { parsedMessages, parseMessages };
}
