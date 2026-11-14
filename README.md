# heysteff agent skills

Skills para que tu agente de código (Claude Code, Codex, Cursor y cualquier agente compatible con `SKILL.md`) integre, automatice y observe la API de [heysteff](https://developers.heysteff.com), con **el mismo `POST /v1/messages` para WhatsApp, Instagram, Messenger, SMS y correo**.

[English](./README.en.md) · [Documentación](https://developers.heysteff.com/docs/agentes-de-codigo#skill) · [GitHub](https://github.com/heysteff-com/agent-skills)

| Skill | Para qué |
| --- | --- |
| [`heysteff-integrate`](skills/heysteff-integrate/SKILL.md) | API key, enviar por cualquier canal, webhooks, clientes y links de conexión |
| [`heysteff-automate`](skills/heysteff-automate/SKILL.md) | Flujos, campañas (envíos masivos) y plantillas de WhatsApp |
| [`heysteff-observe`](skills/heysteff-observe/SKILL.md) | Estado de mensajes, entregas de webhooks, reintentos, logs de la API y uso del plan |

Cada skill trae scripts `.mjs` sin dependencias. Los que le mandan algo a una persona real no hacen nada sin `--confirm`, y ninguno imprime la key.

## Requisitos

- Una cuenta en [developers.heysteff.com](https://developers.heysteff.com/console/register) (el plan Developer Free es gratis).
- Una API key creada en [la consola](https://developers.heysteff.com/console/) → API keys, con los scopes de lo que vas a pedir:

  | Skill | Scopes |
  | --- | --- |
  | `heysteff-integrate` | `messages:write`, `conversations:read`, `webhooks:read`, `webhooks:write`, `customers:read`, `customers:write` |
  | `heysteff-automate` | `automations:trigger`, `campaigns:read`, `campaigns:write`, `messages:write`, `templates:write` |
  | `heysteff-observe` | `conversations:read`, `webhooks:read`, `webhooks:write` |

  Para empezar basta una key de prueba (`sk_test_…`): manda por el [sandbox](https://developers.heysteff.com/docs/sandbox) con `messages:write`, `conversations:read` y `conversations:write`.
- Node 20 o más nuevo, para los scripts.

## Inicio rápido

1. Instala las skills:

   ```bash
   npx skills add heysteff-com/agent-skills
   ```

   O copia la carpeta de una skill a `~/.claude/skills/` (Claude Code) o a la carpeta de skills de tu agente.

2. Define la key en tu entorno (o en `.env.local`, fuera de git). Los scripts la leen de `HEYSTEFF_API_KEY`:

   ```bash
   export HEYSTEFF_API_KEY=<TU_API_KEY>
   ```

3. Une tu WhatsApp al sandbox: en la consola, en Developers, aparece un código (`DEV-…`) y un botón que abre WhatsApp con el mensaje escrito. Mándalo desde tu teléfono.

4. Pídele a tu agente: "Con la skill heysteff-integrate, manda 'Hola desde el sandbox' por WhatsApp a mi teléfono". El agente primero corre el script sin `--confirm`, te muestra lo que mandaría y espera tu sí:

   ```bash
   node skills/heysteff-integrate/scripts/send-message.mjs --channel whatsapp_cloud --to +56912345678 --text "Hola desde el sandbox"
   ```

5. Con tu confirmación lo repite con `--confirm` y revisa el estado con `message-status.mjs <id>`.

## Uso

### heysteff-integrate

```bash
node scripts/send-message.mjs --channel instagram --contact-ref <id> --text "Hola" --confirm
node scripts/send-message.mjs --channel whatsapp_cloud --to +56912345678 --template pedido_listo --lang es --param "Ana" --confirm
node scripts/send-message.mjs --channel whatsapp_cloud --to +56912345678 --text "Hola" --customer-id <uuid> --confirm
node scripts/message-status.mjs <message_id>
node scripts/webhooks.mjs create --url https://tu-app.com/webhooks/heysteff --events message:received --confirm
node scripts/customers.mjs create --external-id acme-42 --name "Acme SpA"
node scripts/customers.mjs link <customer_id> --channels whatsapp_cloud,instagram
```

Canales (`--channel`): `whatsapp_cloud`, `whatsapp_baileys`, `instagram`, `facebook`, `sms` y `gmail`. Cada envío lleva un `Idempotency-Key`: repetir el mismo comando tras un error de red no duplica el mensaje.

### heysteff-automate

```bash
node scripts/trigger-flow.mjs <flow_id> --phone +56912345678 --var pedido=1042 --confirm
node scripts/campaign.mjs create --file campana.json --confirm
node scripts/bulk-send.mjs --file lista.csv --template pedido_listo --lang es --confirm
node scripts/templates.mjs list
```

### heysteff-observe

```bash
node scripts/webhook-deliveries.mjs --status failed
node scripts/retry-delivery.mjs <delivery_id> --confirm
node scripts/message-status.mjs <message_id>
```

Los scripts usan `https://app.heysteff.com/api` por defecto; otra base con `HEYSTEFF_API_URL`.

## Configúralo con tu IA

Copia este texto y pégalo en Claude Code, Cursor, Codex o ChatGPT:

```text
Quiero que uses las skills de heysteff (github.com/heysteff-com/agent-skills) para integrar,
automatizar y revisar mensajes de WhatsApp, Instagram, Messenger, SMS y correo. Todos salen
con el mismo POST /v1/messages.

Fuentes de verdad (léelas antes de actuar; ganan sobre lo que recuerdes):
- https://developers.heysteff.com/AGENTS.md
- https://app.heysteff.com/api/v1/llms-full.txt
- El SKILL.md de cada skill

Pasos:
1. Revisa que haya Node 20+. Instala las skills con npx skills add heysteff-com/agent-skills
   (o copia skills/heysteff-integrate, skills/heysteff-automate y skills/heysteff-observe a tu
   carpeta de skills).
2. La key va en la variable HEYSTEFF_API_KEY. Si hace falta un archivo, crea .env.local con
   HEYSTEFF_API_KEY=<TU_API_KEY>, confirma que esté en .gitignore y yo reemplazo el valor.
   No me pidas la key en el chat. Para probar usaré una key de prueba (sk_test_…).
3. Verifica: corre skills/heysteff-integrate/scripts/send-message.mjs con --channel whatsapp_cloud
   --to <TELEFONO_UNIDO_AL_SANDBOX> --text "Hola desde el sandbox de heysteff" SIN --confirm,
   muéstrame lo que mandaría y espera mi sí. Después repítelo con --confirm y revisa el estado
   con message-status.mjs <id>.

Reglas de seguridad:
- Nunca escribas la API key en el código, en archivos versionados, en commits, en logs ni en
  este chat, y no la pases como argumento de un comando.
- Antes de cualquier envío a personas reales (mensaje, plantilla, campaña, flujo o reintento de
  webhook), muéstrame el destinatario, el canal y el texto exactos y espera mi confirmación.
- No inventes endpoints: solo existen las rutas bajo https://app.heysteff.com/api/v1/.
- Ante un 403, falta un scope en la key: dímelo en vez de buscar un rodeo.
```

## Enlaces

- Documentación: [Agentes de código y MCP](https://developers.heysteff.com/docs/agentes-de-codigo) · [Sandbox](https://developers.heysteff.com/docs/sandbox) · [Webhooks](https://developers.heysteff.com/docs/webhooks)
- GitHub: [heysteff-com/agent-skills](https://github.com/heysteff-com/agent-skills)
- Plugin para Claude Code, Cursor y Codex: [heysteff-com/agent-plugins](https://github.com/heysteff-com/agent-plugins)
- CLI: [@heysteff/cli](https://www.npmjs.com/package/@heysteff/cli) · SDK: [@heysteff/sdk](https://www.npmjs.com/package/@heysteff/sdk)
- Licencia: [MIT](./LICENSE)
