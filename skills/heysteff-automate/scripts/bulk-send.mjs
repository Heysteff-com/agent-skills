#!/usr/bin/env node
// Manda una plantilla de WhatsApp a una lista corta (CSV con columna `to` y,
// opcional, `param1`, `param2`… para las variables del cuerpo). Para listas
// grandes, con exclusiones y métricas, usa una campaña (campaign.mjs).
//
//   node bulk-send.mjs --file clientes.csv --template aviso_pedido --lang es --confirm [--batch-id promo-nov] [--delay-ms 300]
//
// Sin --confirm muestra cuántos y los primeros 3 mensajes, y no envía nada.
// Cada mensaje lleva Idempotency-Key (derivada de --batch-id, o del archivo y
// la plantilla, más el destinatario): repetir el lote tras un corte no le
// vuelve a escribir a quien ya recibió.
import { readFileSync } from 'node:fs';
import { idempotencyKey, isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [{ method: 'POST', path: '/v1/messages' }];

/** CSV simple (sin comillas con comas adentro): primera fila = encabezados. */
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
}

export function buildMessages(rows, { channel = 'whatsapp_cloud', template, lang }) {
  return rows.filter((r) => r.to).map((r) => {
    const params = Object.keys(r).filter((k) => /^param\d+$/.test(k)).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5))).map((k) => r[k]);
    return {
      channel, to: r.to, content_type: 'template',
      template: { name: template, language: lang, ...(params.length ? { body_params: params } : {}) },
    };
  });
}

if (isMain(import.meta.url)) {
  await run(async (args) => {
    if (!args.file || !args.template || !args.lang) throw new UsageError('Faltan --file, --template y --lang.');
    const messages = buildMessages(parseCsv(readFileSync(String(args.file), 'utf8')), {
      channel: args.channel ? String(args.channel) : undefined, template: String(args.template), lang: String(args.lang),
    });
    requireConfirm(args, { total: messages.length, sample: messages.slice(0, 3) });
    const batch = typeof args['batch-id'] === 'string' ? args['batch-id'] : `${args.file}:${args.template}:${args.lang}`;
    const delay = Number(args['delay-ms'] ?? 300);
    const results = [];
    for (const body of messages) {
      try {
        const res = await request('POST', '/v1/messages', { body, idempotencyKey: idempotencyKey(undefined, `bulk:${batch}`, body) });
        // POST /v1/messages responde { data: { id, ... } }.
        results.push({ to: body.to, ok: true, id: res?.data?.id ?? null });
      } catch (err) {
        results.push({ to: body.to, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
      await new Promise((r) => setTimeout(r, delay));
    }
    print({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
  });
}
