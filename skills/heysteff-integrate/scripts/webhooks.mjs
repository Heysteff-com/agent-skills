#!/usr/bin/env node
// Webhooks salientes.
//
//   node webhooks.mjs list
//   node webhooks.mjs create --url https://tu-servidor/webhooks/heysteff --events message:received,message.failed --confirm
//   node webhooks.mjs delete <webhook_id> --confirm
//
// Al crear, la respuesta trae el secreto de firma UNA sola vez: guárdalo en tu
// gestor de secretos y no lo pegues en el chat ni en un commit.
import { isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [
  { method: 'GET', path: '/v1/webhooks' },
  { method: 'POST', path: '/v1/webhooks' },
  { method: 'DELETE', path: '/v1/webhooks/{id}' },
];

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const [action, id] = args._;
    if (action === 'list') return print(await request('GET', '/v1/webhooks'));
    if (action === 'create') {
      if (!args.url || args.url === true) throw new UsageError('Falta --url (https).');
      const events = typeof args.events === 'string' ? args.events.split(',').map((e) => e.trim()).filter(Boolean) : [];
      const body = { url: String(args.url), events };
      requireConfirm(args, body);
      return print(await request('POST', '/v1/webhooks', { body }));
    }
    if (action === 'delete') {
      if (!id) throw new UsageError('Uso: node webhooks.mjs delete <webhook_id> --confirm');
      requireConfirm(args, { delete_webhook: id });
      return print(await request('DELETE', '/v1/webhooks/{id}', { params: { id } }));
    }
    throw new UsageError('Uso: node webhooks.mjs list | create --url <https> [--events a,b] --confirm | delete <id> --confirm');
  });
}
