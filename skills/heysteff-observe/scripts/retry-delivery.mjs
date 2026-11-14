#!/usr/bin/env node
// Reintenta una entrega de webhook (vuelve a mandar el mismo evento a tu servidor).
//
//   node retry-delivery.mjs <delivery_id> --confirm
import { isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [{ method: 'POST', path: '/v1/webhook-deliveries/{id}/retry' }];

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const id = args._[0];
    if (!id) throw new UsageError('Uso: node retry-delivery.mjs <delivery_id> --confirm');
    requireConfirm(args, { retry_delivery: id });
    print(await request('POST', '/v1/webhook-deliveries/{id}/retry', { params: { id } }));
  });
}
