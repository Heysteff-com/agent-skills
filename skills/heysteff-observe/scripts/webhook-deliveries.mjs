#!/usr/bin/env node
// Registro de entregas de los webhooks: qué falló, con qué status y qué respondió tu servidor.
//
//   node webhook-deliveries.mjs                      # todas las fallidas de todos los webhooks
//   node webhook-deliveries.mjs <webhook_id> [--status failed|succeeded|pending] [--event message:received] [--since 2026-11-01T00:00:00Z] [--limit 50]
import { isMain, print, request, run } from './lib/heysteff.mjs';

export const REQUESTS = [
  { method: 'GET', path: '/v1/webhooks' },
  { method: 'GET', path: '/v1/webhooks/{id}/deliveries', query: ['status', 'event', 'since', 'until', 'cursor', 'limit'] },
];

function filters(args) {
  return { status: args.status, event: args.event, since: args.since, until: args.until, cursor: args.cursor, limit: args.limit };
}

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const id = args._[0];
    if (id) return print(await request('GET', '/v1/webhooks/{id}/deliveries', { params: { id }, query: filters(args) }));
    const list = await request('GET', '/v1/webhooks');
    const hooks = Array.isArray(list) ? list : (list?.data ?? list?.webhooks ?? []);
    const out = [];
    for (const hook of hooks) {
      const deliveries = await request('GET', '/v1/webhooks/{id}/deliveries', {
        params: { id: hook.id }, query: { ...filters(args), status: args.status ?? 'failed' },
      });
      out.push({ webhook_id: hook.id, url: hook.url, deliveries });
    }
    print(out);
  });
}
