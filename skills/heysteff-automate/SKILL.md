---
name: heysteff-automate
description: Automatiza mensajes con heysteff. Úsala para disparar flujos de automatización por API, crear y seguir campañas (envíos masivos con audiencia, exclusiones y métricas), mandar una plantilla de WhatsApp a una lista corta y crear, listar o borrar plantillas de WhatsApp.
license: MIT
---

# heysteff: automatizar

Esta skill cubre lo que corre solo o le llega a muchas personas a la vez. Fuentes de verdad: https://app.heysteff.com/api/v1/llms-full.txt y https://developers.heysteff.com/docs/. No inventes endpoints ni campos: revisa el body exacto ahí antes de armar un JSON.

## Reglas de seguridad (obligatorias)

1. **Un envío masivo o un flujo le escribe a personas reales.** Antes de correr cualquier script con `--confirm`, muéstrale a quien te lo pidió el destinatario (o la audiencia y cuántas personas son), el canal y el texto o la plantilla con sus variables, y espera un sí explícito. Sin `--confirm` los scripts solo muestran lo que harían.
2. **Nunca imprimas ni guardes una API key.** Se lee de `HEYSTEFF_API_KEY`.
3. Prueba primero contigo: un flujo o una plantilla se dispara a tu propio número antes de la lista real.

## Qué usar

| Necesidad | Usa |
| --- | --- |
| Un evento de tu sistema (pedido pagado, cita confirmada) debe escribirle a una persona | Un flujo con disparador por API: `trigger-flow.mjs` |
| Mandar lo mismo a una lista o segmento, con exclusiones, horario y resultados | Una campaña: `campaign.mjs` |
| Mandar una plantilla a pocas personas desde un CSV | `bulk-send.mjs` (para más de unas decenas, mejor una campaña) |
| Crear o revisar plantillas de WhatsApp | `templates.mjs` |

Los flujos y las campañas se arman en el panel o con el servidor MCP (`https://mcp.heysteff.com/mcp`, tools `create_flow`, `set_flow_steps`, `set_flow_status`, `create_campaign`, `create_wa_template`). La API dispara y consulta.

## Scripts (Node 20+, sin dependencias)

Leen `HEYSTEFF_API_KEY` y, si existe, `HEYSTEFF_API_URL`.

| Script | Qué hace | Endpoint | Scope |
| --- | --- | --- | --- |
| `scripts/trigger-flow.mjs <flow_id> --phone <tel> [--var clave=valor] [--dedup-key …] --confirm` | Dispara el flujo para ese teléfono; las `--var` entran al contexto del run | `POST /v1/automation-flows/{id}/trigger` | `automations:trigger` |
| `scripts/campaign.mjs create --file campana.json --confirm` · `get <id>` | Crea una campaña desde un JSON y consulta su estado | `POST /v1/campaigns`, `GET /v1/campaigns/{id}` | `campaigns:write` / `campaigns:read` |
| `scripts/bulk-send.mjs --file lista.csv --template <nombre> --lang es --confirm` | Una plantilla por fila (`to`, `param1`, `param2`…), con pausa entre envíos | `POST /v1/messages` | `messages:write` |
| `scripts/templates.mjs list [--status all]` · `create --file plantilla.json --confirm` · `delete <nombre> [--lang es] --confirm` | Plantillas de WhatsApp | `/v1/templates` | `messages:write` / `templates:write` |

`bulk-send.mjs` manda cada fila con un `Idempotency-Key` derivado del lote (`--batch-id`, o el archivo y la plantilla) y del destinatario: si el lote se corta, repítelo igual y quien ya recibió no recibe dos veces.

Usa `--dedup-key` en los flujos que dispara tu sistema: si tu servidor reintenta, el mismo evento no le escribe dos veces a la persona.

## Plantillas de WhatsApp

Fuera de la ventana de 24 h desde el último mensaje del cliente, WhatsApp Cloud solo acepta plantillas aprobadas por Meta. La aprobación tarda de minutos a horas: crea la plantilla, revisa `templates.mjs list --status all` y no la uses hasta que diga `APPROVED`.
