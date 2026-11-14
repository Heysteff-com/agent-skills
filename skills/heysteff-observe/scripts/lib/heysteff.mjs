// Cliente mínimo de la API v1 de heysteff para los scripts de esta skill.
// Sin dependencias: fetch nativo de Node 20+. Licencia MIT.
//
// - La key sale de HEYSTEFF_API_KEY y nunca se imprime (ni en errores).
// - La base sale de HEYSTEFF_API_URL (o HEYSTEFF_BASE_URL, la de la CLI);
//   por defecto https://app.heysteff.com/api.
// - Cada ruta se pide con su plantilla del OpenAPI (`/v1/messages/{id}`), así
//   una prueba offline puede comprobar que existe.
// Este archivo es igual en las tres skills: cada una se instala sola.

import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULT_BASE_URL = 'https://app.heysteff.com/api';

export function baseUrl(env = process.env) {
  return (env.HEYSTEFF_API_URL || env.HEYSTEFF_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/** Rellena `{id}` con valores codificados. */
export function fillPath(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = params[name];
    if (value === undefined || value === '') throw new UsageError(`Falta el parámetro "${name}".`);
    return encodeURIComponent(String(value));
  });
}

export class UsageError extends Error {}

export class ApiError extends Error {
  constructor(status, body) {
    const err = body && typeof body === 'object' ? body.error : null;
    super(err?.message || `HTTP ${status}`);
    this.status = status;
    this.code = err?.code || `http_${status}`;
    this.fix = err?.fix;
  }
}

/**
 * Clave de idempotencia de un envío. Con `--idempotency-key` se usa esa; si no,
 * sale del contenido (`scope` + cuerpo), así repetir el MISMO comando tras una
 * respuesta perdida no vuelve a mandar el mensaje. Para mandar dos veces lo
 * mismo a propósito, pasa una clave distinta.
 */
export function idempotencyKey(explicit, scope, body) {
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const digest = createHash('sha256').update(`${scope}\n${JSON.stringify(body)}`).digest('hex').slice(0, 32);
  return `hs-skill-${digest}`;
}

export async function request(method, template, { params, query, body, idempotencyKey: idemKey } = {}) {
  const key = process.env.HEYSTEFF_API_KEY;
  if (!key) throw new UsageError('Define HEYSTEFF_API_KEY (créala en https://developers.heysteff.com/console/).');
  const url = new URL(baseUrl() + fillPath(template, params));
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      accept: 'application/json',
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(idemKey ? { 'idempotency-key': idemKey } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 500) }; }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/**
 * `--flag valor`, `--flag=valor` y `--flag` (true). Un flag repetido
 * (`--param a --param b`) junta sus valores en un arreglo. El resto va a `_`.
 */
export function parseArgs(argv) {
  const out = { _: [] };
  const set = (key, value) => {
    if (key in out) out[key] = [].concat(out[key], value);
    else out[key] = value;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq > 0) { set(a.slice(2, eq), a.slice(eq + 1)); continue; }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { set(a.slice(2), next); i++; }
    else set(a.slice(2), true);
  }
  return out;
}

export function print(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Lo que llega a una persona real no sale sin `--confirm`: sin él se muestra
 * qué se mandaría y el script termina con código 2.
 */
export function requireConfirm(args, preview) {
  if (args.confirm === true || args.confirm === 'true') return;
  print({ dry_run: true, would_send: preview, next: 'Revisa destinatario y texto con la persona y repite con --confirm.' });
  process.exit(2);
}

/** Corre `main` y traduce errores a una salida corta (sin la key). */
export async function run(main) {
  try {
    await main(parseArgs(process.argv.slice(2)));
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(64);
    }
    if (err instanceof ApiError) {
      process.stderr.write(JSON.stringify({ error: { status: err.status, code: err.code, message: err.message, ...(err.fix ? { fix: err.fix } : {}) } }) + '\n');
      process.exit(1);
    }
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

/** Solo corre `main` si el archivo se ejecuta directo (no al importarlo en una prueba). */
export function isMain(metaUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return pathToFileURL(realpathSync(entry)).href === metaUrl;
  } catch {
    return false;
  }
}
