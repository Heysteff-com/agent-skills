#!/usr/bin/env node
// Manda un mensaje por cualquier canal con el mismo POST /v1/messages.
//
//   node send-message.mjs --channel whatsapp_cloud --to +56912345678 --text "Hola" --confirm
//   node send-message.mjs --channel instagram --contact-ref <id> --text "Hola" --confirm
//   node send-message.mjs --channel whatsapp_cloud --to +569… --template pedido_listo --lang es --param "Ana" --confirm
//   node send-message.mjs --channel whatsapp_cloud --to +569… --text "Hola" --customer-id <uuid> --confirm
//
// Sin --confirm muestra lo que mandaría y no envía nada.
// Cada envío lleva Idempotency-Key (--idempotency-key, o una derivada del
// contenido): repetir el mismo comando tras un error de red no duplica el mensaje.
import { idempotencyKey, isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [{ method: 'POST', path: '/v1/messages' }];

export function buildMessage(args) {
  if (!args.channel) throw new UsageError('Falta --channel (whatsapp_cloud, whatsapp_baileys, instagram, facebook, sms, gmail…).');
  if (!args.to && !args['contact-ref']) throw new UsageError('Falta --to o --contact-ref.');
  const body = { channel: String(args.channel) };
  if (args.to) body.to = String(args.to);
  if (args['contact-ref']) body.contact_ref = String(args['contact-ref']);
  if (args['customer-id']) body.customer_id = String(args['customer-id']);
  if (args['channel-connection-id']) body.channel_connection_id = String(args['channel-connection-id']);
  if (args.template) {
    if (!args.lang) throw new UsageError('Una plantilla necesita --lang (es, en_US…).');
    const params = [].concat(args.param ?? []).filter((p) => p !== true).map(String);
    body.content_type = 'template';
    body.template = { name: String(args.template), language: String(args.lang), ...(params.length ? { body_params: params } : {}) };
  } else {
    if (!args.text || args.text === true) throw new UsageError('Falta --text (o --template).');
    body.content = String(args.text);
  }
  return body;
}

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const body = buildMessage(args);
    const key = idempotencyKey(args['idempotency-key'], 'send-message', body);
    requireConfirm(args, { ...body, idempotency_key: key });
    const res = await request('POST', '/v1/messages', { body, idempotencyKey: key });
    print({ idempotency_key: key, ...res });
  });
}
