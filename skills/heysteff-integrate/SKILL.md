---
name: heysteff-integrate
description: Integra un sistema con la API v1 de heysteff. Úsala para crear y usar una API key, mandar mensajes por WhatsApp, Instagram, Messenger, SMS o correo con el mismo POST /v1/messages, ver el estado de un mensaje, crear y verificar webhooks, y dar de alta clientes de tu SaaS con su link de conexión (cada cliente conecta su propio canal).
license: MIT
---

# heysteff: integrar

heysteff es una API de mensajería omnicanal: el mismo `POST /v1/messages` manda por WhatsApp (API oficial o por QR), Instagram, Messenger, SMS y correo. Fuentes de verdad, que ganan sobre esta skill si algo cambia:

- API completa en texto: https://app.heysteff.com/api/v1/llms-full.txt (léela antes de escribir código)
- OpenAPI 3.1: https://app.heysteff.com/api/v1/openapi.json
- Docs: https://developers.heysteff.com/docs/

No inventes endpoints: solo existen las rutas bajo `https://app.heysteff.com/api/v1/`.

## Reglas de seguridad (obligatorias)

1. **Antes de mandar algo a una persona real, confirma con quien te pidió el cambio el destinatario exacto, el canal y el texto completo.** Los scripts que envían no hacen nada sin `--confirm`: córrelos primero sin él, muestra el resultado y espera el sí.
2. **Nunca imprimas, pegues ni guardes una API key** (en código, commits, logs, issues o el chat). Se lee de `HEYSTEFF_API_KEY`. Si la persona te la pega, pídele que la guarde como variable de entorno y no la repitas.
3. Prueba con una key de sandbox (`sk_test_…`) mientras desarrollas: solo manda a teléfonos unidos al sandbox del espacio.

## API key

La key se crea en la consola (https://developers.heysteff.com/console/ → API keys) con los scopes justos: `messages:write` para mandar, `conversations:read` para leer estados, `webhooks:read`/`webhooks:write`, `customers:read`/`customers:write`. Un `403` casi siempre es un scope que falta: pídele a la persona que lo agregue, no busques un rodeo.

```bash
export HEYSTEFF_API_KEY=...   # la pone la persona, nunca tú en un archivo versionado
heysteff whoami               # si tiene la CLI: muestra la key enmascarada y si la API la acepta
```

## Scripts (Node 20+, sin dependencias)

Todos leen `HEYSTEFF_API_KEY` y, si existe, `HEYSTEFF_API_URL` (por defecto `https://app.heysteff.com/api`). Imprimen JSON y salen con código 1 ante un error de la API (`{ error: { status, code, message } }`).

| Script | Qué hace | Endpoint |
| --- | --- | --- |
| `scripts/send-message.mjs --channel <canal> --to <destino> --text "…" --confirm` | Manda texto por cualquier canal. Con `--template <nombre> --lang es --param …` manda una plantilla de WhatsApp; con `--customer-id` sale por el canal de ese cliente | `POST /v1/messages` |
| `scripts/message-status.mjs <id>` | Estado del mensaje (`queued`, `sent`, `delivered`, `read`, `failed`) | `GET /v1/messages/{id}` |
| `scripts/webhooks.mjs list` · `create --url … --events … --confirm` · `delete <id> --confirm` | Webhooks salientes | `/v1/webhooks` |
| `scripts/customers.mjs list` · `create --external-id … --name …` · `get <id>` · `link <id> [--channels …] [--hours …]` · `channels <id>` | Clientes de tu SaaS y sus links de conexión | `/v1/customers…` |

Cada envío de `send-message.mjs` lleva un `Idempotency-Key` (el de `--idempotency-key`, o uno derivado del contenido que el script imprime). Si la respuesta se pierde, repite el MISMO comando: la API devuelve el primer resultado y no manda el mensaje dos veces. Para mandar a propósito el mismo texto otra vez, usa otra clave.

Canales (`--channel`): `whatsapp_cloud`, `whatsapp_baileys`, `instagram`, `facebook`, `sms`, `gmail`. Fuera de la ventana de 24 h, WhatsApp Cloud solo acepta plantillas aprobadas.

## Webhooks

Al crear un webhook la respuesta trae el secreto de firma una sola vez: que la persona lo guarde en su gestor de secretos. Cada entrega llega con `X-Heysteff-Event`, `X-Heysteff-Timestamp`, `X-Heysteff-Signature` y `X-Heysteff-Delivery-Id`. Para verificar:

1. Rechaza si `X-Heysteff-Timestamp` difiere en más de 300 segundos de tu reloj.
2. Calcula `v1=` + HMAC-SHA256 en hex con el secreto sobre `${timestamp}.${body}` (el cuerpo crudo) y compáralo en tiempo constante con `X-Heysteff-Signature`.
3. Responde 2xx rápido, procesa después y deduplica por `X-Heysteff-Delivery-Id`.

## Clientes y links de conexión

Para un SaaS cuyos clientes conectan su propio WhatsApp, Instagram, Messenger o Gmail: `customers.mjs create` crea el cliente con tu `external_id`, `customers.mjs link <id>` devuelve un link de un solo uso que le mandas por tu producto, llega el webhook `customer.channel_connected`, y desde ahí mandas por cuenta de él con `send-message.mjs --customer-id <id>`.

## Más

- Automatizar (flujos, campañas, plantillas): skill `heysteff-automate`.
- Revisar entregas, reintentos, logs y uso del plan: skill `heysteff-observe`.
- Configurar el espacio conversando (canales, flujos, bandeja): el servidor MCP `https://mcp.heysteff.com/mcp` con OAuth.
