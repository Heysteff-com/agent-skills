---
name: heysteff-observe
description: Observa y depura una integración con heysteff. Úsala para saber por qué un mensaje no llegó, revisar el registro de entregas de los webhooks y reintentar las fallidas, leer los logs de la API (qué pidió tu servidor y qué respondió heysteff) y ver el uso del plan.
license: MIT
---

# heysteff: observar

Fuentes de verdad: https://app.heysteff.com/api/v1/llms-full.txt y https://developers.heysteff.com/docs/.

## Reglas de seguridad (obligatorias)

1. **Reintentar una entrega vuelve a mandar el evento a tu servidor**, y tu servidor puede escribirle a personas reales al procesarlo. Confirma con quien te lo pidió antes de usar `--confirm`.
2. **Nunca imprimas ni guardes una API key** ni un secreto de webhook. Si un log o una respuesta los muestra, no los copies al chat.

## Por dónde empezar

| Síntoma | Mira |
| --- | --- |
| Un mensaje no llegó | `message-status.mjs <id>`: `failed` trae el motivo. Un `failed` en WhatsApp fuera de 24 h casi siempre pide una plantilla |
| Tu servidor no recibe eventos | `webhook-deliveries.mjs` (todas las fallidas) o `webhook-deliveries.mjs <webhook_id> --status failed`: status HTTP, duración y lo que respondió tu servidor |
| Ya arreglaste tu servidor | `retry-delivery.mjs <delivery_id> --confirm` para las que `retryable` es `true`. Las demás se reintentan solas con espera creciente |
| Un `4xx` de la API que no entiendes | Logs de la API (abajo): cada request con su status, código de error y duración |
| Te acercas al tope de mensajes | Uso del plan (abajo) |

## Scripts (Node 20+, sin dependencias)

Leen `HEYSTEFF_API_KEY` y, si existe, `HEYSTEFF_API_URL`.

| Script | Endpoint | Scope |
| --- | --- | --- |
| `scripts/message-status.mjs <message_id>` | `GET /v1/messages/{id}` | `conversations:read` |
| `scripts/webhook-deliveries.mjs [<webhook_id>] [--status failed\|succeeded\|pending] [--event …] [--since ISO] [--limit N]` | `GET /v1/webhooks`, `GET /v1/webhooks/{id}/deliveries` | `webhooks:read` |
| `scripts/retry-delivery.mjs <delivery_id> --confirm` | `POST /v1/webhook-deliveries/{id}/retry` | `webhooks:write` |

## Logs de la API y uso del plan

La API v1 no expone los logs ni el uso: no los busques ahí. Están en:

- **Consola**: https://developers.heysteff.com/console/ → Logs (cada request con método, ruta, status, código de error y duración) y Uso y facturación (mensajes del período y tope del plan).
- **Servidor MCP** (`https://mcp.heysteff.com/mcp`, con OAuth): tools `list_api_requests`, `get_message_usage`, `get_conversation_usage`, `list_webhook_deliveries` y `retry_webhook_delivery`.

## Errores frecuentes

- `401`: key inválida o revocada. `heysteff whoami` (si está la CLI) lo confirma sin mostrar la key.
- `403`: falta un scope en la key. Pídele a la persona que lo agregue.
- `422`: el body no cumple el esquema; el mensaje dice qué campo.
- `429`: límite de velocidad; respeta `Retry-After`.
