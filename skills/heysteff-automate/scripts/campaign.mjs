#!/usr/bin/env node
// Envíos masivos con campañas: crear una desde un JSON y ver cómo va.
//
//   node campaign.mjs create --file campana.json --confirm
//   node campaign.mjs get <campaign_id>
//
// El JSON sigue el body de POST /v1/campaigns (name, channel, trigger_type,
// message_mode, audience_source, message_config…): revisa los campos exactos en
// https://app.heysteff.com/api/v1/llms-full.txt antes de armarlo.
import { readFileSync } from 'node:fs';
import { isMain, print, request, requireConfirm, run, UsageError } from './lib/heysteff.mjs';

export const REQUESTS = [
  { method: 'POST', path: '/v1/campaigns' },
  { method: 'GET', path: '/v1/campaigns/{id}' },
];

if (isMain(import.meta.url)) {
  await run(async (args) => {
    const [action, id] = args._;
    if (action === 'get') {
      if (!id) throw new UsageError('Uso: node campaign.mjs get <campaign_id>');
      return print(await request('GET', '/v1/campaigns/{id}', { params: { id } }));
    }
    if (action === 'create') {
      if (!args.file || args.file === true) throw new UsageError('Falta --file con el JSON de la campaña.');
      const body = JSON.parse(readFileSync(String(args.file), 'utf8'));
      requireConfirm(args, body);
      return print(await request('POST', '/v1/campaigns', { body }));
    }
    throw new UsageError('Uso: node campaign.mjs create --file <json> --confirm | get <id>');
  });
}
