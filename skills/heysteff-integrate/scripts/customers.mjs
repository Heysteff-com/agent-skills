#!/usr/bin/env node
// Clientes de tu SaaS y sus links de conexión (cada cliente conecta su propio canal).
//
//   node customers.mjs list
//   node customers.mjs create --external-id acme-42 --name "Acme"
//   node customers.mjs get <customer_id>
//   node customers.mjs link <customer_id> [--channels whatsapp_cloud,instagram] [--hours 72]
//   node customers.mjs channels <customer_id>
//
// El link (`https://developers.heysteff.com/connect/hsl_…`) es de un solo uso:
// mándaselo a tu cliente por tu propio producto.
import { isMain, print, request, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [
  { method: 'GET', path: '/v1/customers', query: ['limit', 'cursor'] },
  { method: 'POST', path: '/v1/customers' },
  { method: 'GET', path: '/v1/customers/{id}' },
  { method: 'POST', path: '/v1/customers/{id}/setup-links' },
  { method: 'GET', path: '/v1/customers/{id}/channels' },
];

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const [action, id] = args._;
    const needId = () => { if (!id) throw new UsageError(`Uso: node customers.mjs ${action} <customer_id>`); };
    switch (action) {
      case 'list':
        return print(await request('GET', '/v1/customers', { query: { limit: args.limit, cursor: args.cursor } }));
      case 'create': {
        if (!args['external-id'] || !args.name) throw new UsageError('Faltan --external-id y --name.');
        return print(await request('POST', '/v1/customers', { body: { external_id: String(args['external-id']), name: String(args.name) } }));
      }
      case 'get':
        needId();
        return print(await request('GET', '/v1/customers/{id}', { params: { id } }));
      case 'link': {
        needId();
        const body = {};
        if (typeof args.channels === 'string') body.allowed_channels = args.channels.split(',').map((c) => c.trim()).filter(Boolean);
        if (args.hours) body.expires_in_hours = Number(args.hours);
        return print(await request('POST', '/v1/customers/{id}/setup-links', { params: { id }, body }));
      }
      case 'channels':
        needId();
        return print(await request('GET', '/v1/customers/{id}/channels', { params: { id } }));
      default:
        throw new UsageError('Uso: node customers.mjs list | create | get <id> | link <id> | channels <id>');
    }
  });
}
