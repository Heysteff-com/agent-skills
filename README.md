# heysteff agent skills

Skills para agentes de código (Claude Code, Codex, Cursor y cualquier agente compatible con `SKILL.md`) que integran, automatizan y observan la API de mensajería omnicanal de [heysteff](https://developers.heysteff.com): WhatsApp, Instagram, Messenger, SMS y correo con el mismo `POST /v1/messages`.

| Skill | Para qué |
| --- | --- |
| [`heysteff-integrate`](skills/heysteff-integrate/SKILL.md) | API key, enviar por cualquier canal, webhooks, clientes y links de conexión |
| [`heysteff-automate`](skills/heysteff-automate/SKILL.md) | Flujos, campañas (envíos masivos) y plantillas de WhatsApp |
| [`heysteff-observe`](skills/heysteff-observe/SKILL.md) | Estado de mensajes, entregas de webhooks, reintentos, logs de la API y uso del plan |

## Instalar

```bash
npx skills add heysteff-com/agent-skills
```

O copia la carpeta de una skill a `~/.claude/skills/` (Claude Code) o a la carpeta de skills de tu agente.

Cada skill trae scripts `.mjs` sin dependencias (Node 20+) que leen la key de `HEYSTEFF_API_KEY` y la base de `HEYSTEFF_API_URL` (por defecto `https://app.heysteff.com/api`). Los que mandan algo a una persona real no hacen nada sin `--confirm`, y ninguno imprime la key.

## Licencia

MIT
