#!/usr/bin/env node
// Plantillas de WhatsApp (las únicas que abren conversación fuera de la ventana de 24 h).
//
//   node templates.mjs list [--status all] [--channel-connection-id <uuid>]
//   node templates.mjs create --file plantilla.json --confirm
//   node templates.mjs delete <name> [--lang es] --confirm
import { readFileSync } from 'node:fs';
import { isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [
  { method: 'GET', path: '/v1/templates', query: ['status', 'channel_connection_id'] },
  { method: 'POST', path: '/v1/templates' },
  { method: 'DELETE', path: '/v1/templates/{name}', query: ['language', 'channel_connection_id'] },
];

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const [action, name] = args._;
    if (action === 'list') {
      return print(await request('GET', '/v1/templates', {
        query: { status: args.status, channel_connection_id: args['channel-connection-id'] },
      }));
    }
    if (action === 'create') {
      if (!args.file || args.file === true) throw new UsageError('Falta --file con el JSON de la plantilla.');
      const body = JSON.parse(readFileSync(String(args.file), 'utf8'));
      requireConfirm(args, body);
      return print(await request('POST', '/v1/templates', { body }));
    }
    if (action === 'delete') {
      if (!name) throw new UsageError('Uso: node templates.mjs delete <name> [--lang es] --confirm');
      requireConfirm(args, { delete_template: name, language: args.lang ?? 'todas' });
      return print(await request('DELETE', '/v1/templates/{name}', {
        params: { name },
        query: { language: args.lang, channel_connection_id: args['channel-connection-id'] },
      }));
    }
    throw new UsageError('Uso: node templates.mjs list | create --file <json> --confirm | delete <name> --confirm');
  });
}
