import { PassThrough } from 'node:stream';
import type { AppLoadContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  // await initializeModelList({});

  const body = new PassThrough();
  const pipeable = renderToPipeableStream(<RemixServer context={remixContext} url={request.url} />, {
    onError(error: unknown) {
      console.error(error);
      responseStatusCode = 500;
    },
  });

  const head = renderHeadToString({ request, remixContext, Head });

  // Write HTML head and opening body
  body.write(
    `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`
  );

  // Pipe the React content
  pipeable.pipe(body);

  // Write closing tags when React content is done
  body.on('finish', () => {
    body.write('</div></body></html>');
    body.end();
  });

  if (isbot(request.headers.get('user-agent') || '')) {
    await new Promise((resolve) => {
      body.on('finish', resolve);
    });
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body as any, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}