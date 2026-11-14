#!/usr/bin/env node
// Dispara un flujo de automatización para un teléfono (el flujo le escribe a esa persona).
//
//   node trigger-flow.mjs <flow_id> --phone +56912345678 [--var nombre=Ana --var pedido=1042] [--dedup-key pedido-1042] --confirm
//
// Sin --confirm muestra lo que dispararía y no hace nada.
import { isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [{ method: 'POST', path: '/v1/automation-flows/{id}/trigger' }];

export function buildTrigger(args) {
  if (!args.phone || args.phone === true) throw new UsageError('Falta --phone.');
  const body = { phone: String(args.phone) };
  if (args['order-number']) body.order_number = String(args['order-number']);
  if (args['dedup-key']) body.dedup_key = String(args['dedup-key']);
  for (const pair of [].concat(args.var ?? [])) {
    const eq = String(pair).indexOf('=');
    if (eq <= 0) throw new UsageError(`--var espera clave=valor (recibí "${pair}").`);
    body[String(pair).slice(0, eq)] = String(pair).slice(eq + 1);
  }
  return body;
}

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const id = args._[0];
    if (!id) throw new UsageError('Uso: node trigger-flow.mjs <flow_id> --phone <tel> --confirm');
    const body = buildTrigger(args);
    requireConfirm(args, { flow_id: id, ...body });
    print(await request('POST', '/v1/automation-flows/{id}/trigger', { params: { id }, body }));
  });
}
