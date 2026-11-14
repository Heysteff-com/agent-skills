#!/usr/bin/env node
// Estado de un mensaje (queued, sent, delivered, read, failed) y por qué falló.
//
//   node message-status.mjs <message_id>
import { isMain, print, request, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [{ method: 'GET', path: '/v1/messages/{id}' }];

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const id = args._[0];
    if (!id) throw new UsageError('Uso: node message-status.mjs <message_id>');
    print(await request('GET', '/v1/messages/{id}', { params: { id } }));
  });
}
