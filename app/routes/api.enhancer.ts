import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

// Strip provider reasoning/thinking content (e.g., <think>...</think>) from SSE stream chunks.
// This preserves streaming while ensuring no "thinking" content leaks into the enhanced prompt.
function createReasoningStripStream(input: AsyncIterable<string>): ReadableStream<Uint8Array> {
  const textEncoder = new TextEncoder();

  // We'll maintain a rolling buffer to correctly handle <think> tags that span chunk boundaries.
  let buffer = '';

  function stripThinkingFromBuffer(): { output: string; keep: string } {
    // Process buffer to remove any complete <think>...</think> segments.
    // Emit only the text outside of <think> blocks. If an opening tag is found
    // without its closing tag in the current buffer, we keep it in 'keep' for the next chunk.
    let out = '';
    let idx = 0;

    const indexOf = (s: string, search: string, from: number) => s.indexOf(search, from);

    while (true) {
      const openIdx = indexOf(buffer, '<think>', idx);
      if (openIdx === -1) {
        out += buffer.slice(idx);
        return { output: out, keep: '' };
      }

      // Emit content before the <think> tag
      out += buffer.slice(idx, openIdx);

      const closeIdx = indexOf(buffer, '</think>', openIdx + 7);
      if (closeIdx === -1) {
        // Keep partial block for next chunk
        const keep = buffer.slice(openIdx);
        return { output: out, keep };
      }

      // Skip the entire <think>...</think> block
      idx = closeIdx + 8; // '</think>'
    }
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Consume AsyncIterable<string>
        for await (const chunkText of input as any) {
          buffer += chunkText;

          const { output, keep } = stripThinkingFromBuffer();
          buffer = keep; // Keep any unterminated <think>... for the next chunk

          if (output) {
            controller.enqueue(textEncoder.encode(output));
          }
        }

        // Flush: drop any remaining unterminated <think> block content
        if (buffer && !buffer.includes('<think>')) {
          controller.enqueue(textEncoder.encode(buffer));
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

const logger = createScopedLogger('api.enhancher');

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, model, provider } = await request.json<{
    message: string;
    model: string;
    provider: ProviderInfo;
    apiKeys?: Record<string, string>;
  }>();

  const { name: providerName } = provider;

  // validate 'model' and 'provider' fields
  if (!model || typeof model !== 'string') {
    throw new Response('Invalid or missing model', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Invalid or missing provider', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content:
            `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n` +
            stripIndents`
            You are a professional prompt engineer specializing in crafting precise, effective prompts.
            Your task is to enhance prompts by making them more specific, actionable, and effective.

            I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

            For valid prompts:
            - Make instructions explicit and unambiguous
            - Add relevant context and constraints
            - Remove redundant information
            - Maintain the core intent
            - Ensure the prompt is self-contained
            - Use professional language

            For invalid or unclear prompts:
            - Respond with clear, professional guidance
            - Keep responses concise and actionable
            - Maintain a helpful, constructive tone
            - Focus on what the user should provide
            - Use a standard template for consistency

            IMPORTANT: Your response must ONLY contain the enhanced prompt text.
            Do not include any explanations, metadata, or wrapper tags.

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      env: context.cloudflare?.env as any,
      apiKeys,
      providerSettings,
      options: {
        system:
          'You are a senior software principal architect, you should help the user analyse the user query and enrich it with the necessary context and constraints to make it more specific, actionable, and effective. You should also ensure that the prompt is self-contained and uses professional language. Your response should ONLY contain the enhanced prompt text. Do not include any explanations, metadata, or wrapper tags.',

        /*
         * onError: (event) => {
         *   throw new Response(null, {
         *     status: 500,
         *     statusText: 'Internal Server Error',
         *   });
         * }
         */
      },
    });

    // Handle streaming errors in a non-blocking way
    (async () => {
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'error') {
            const error: any = part.error;
            logger.error('Streaming error:', error);
            break;
          }
        }
      } catch (error) {
        logger.error('Error processing stream:', error);
      }
    })();

    // Return the text stream after stripping any provider "thinking" content from the stream
    const cleanedStream = createReasoningStripStream(result.textStream as any);
    return new Response(cleanedStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.log(error);

    if (error instanceof Error && error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
